"""
Pipeline step 1: Download audio → transcribe → chunk transcript.

Azure Whisper notes:
- Max file size: 25 MB
- Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
- timestamp_granularities is NOT used (segment timestamps come from verbose_json by default)
- We download low-bitrate audio natively from YouTube (no FFmpeg required)

Audio size budget:
- YouTube OPUS/webm at ~48 kbps: ~16 MB for a 45-min video  ← safe
- YouTube m4a at ~128 kbps: ~43 MB for a 45-min video       ← too large
We always prefer the low-bitrate webm/opus stream first.
"""
from __future__ import annotations
import asyncio
import re
from pathlib import Path
from typing import NamedTuple

import tiktoken
from openai import AsyncAzureOpenAI

from app.config import settings
from app.models.schemas import TranscriptSegment, Chunk

ENCODING = tiktoken.get_encoding("cl100k_base")
MAX_TOKENS_PER_CHUNK = 400
MAX_WHISPER_BYTES = 24 * 1024 * 1024  # 24 MB safety margin (limit is 25 MB)

TMP_DIR = Path(__file__).parent.parent.parent / "tmp"
TMP_DIR.mkdir(exist_ok=True)


class VideoInfo(NamedTuple):
    title: str
    speaker_name: str
    duration_sec: int | None
    video_id: str


def _count_tokens(text: str) -> int:
    return len(ENCODING.encode(text))


def _find_downloaded_file(video_id: str) -> Path | None:
    """Find the downloaded audio file for a given video ID (any extension)."""
    for path in TMP_DIR.glob(f"{video_id}.*"):
        return path
    return None


async def download_audio(youtube_url: str) -> tuple[Path, VideoInfo]:
    """
    Download lowest-bitrate audio from YouTube using yt-dlp (no FFmpeg required).
    Returns (audio_path, VideoInfo).

    Format preference order:
    1. webm/opus ~48kbps  — native YouTube stream, no conversion needed
    2. m4a ~48kbps or lower
    3. Any audio stream (fallback)
    """
    import yt_dlp

    # Clean up t= parameter from URL (yt-dlp handles full download regardless)
    clean_url = re.sub(r"[&?]t=\d+s?", "", youtube_url).rstrip("?&")

    # Common yt-dlp options: use Node.js as JS runtime (Node 22 is installed)
    import shutil
    _node_path = shutil.which("node") or "node"
    _base_opts: dict = {
        "quiet": True,
        "no_warnings": False,
    }

    # Step 1: Get video info without downloading
    info_opts = {**_base_opts, "skip_download": True}
    with yt_dlp.YoutubeDL(info_opts) as ydl:
        info = await asyncio.to_thread(ydl.extract_info, clean_url, download=False)

    video_id = info["id"]
    title = info.get("title", "EPIC Lab Talk")
    speaker_name = info.get("uploader") or info.get("channel") or "Fundador"
    duration_sec = info.get("duration")

    video_info = VideoInfo(
        title=title,
        speaker_name=speaker_name,
        duration_sec=duration_sec,
        video_id=video_id,
    )

    print(f"  Video: {title}")
    print(f"  Speaker: {speaker_name}")
    print(f"  Duration: {duration_sec}s ({(duration_sec or 0) // 60} min)")

    # Check if already downloaded
    existing = _find_downloaded_file(video_id)
    if existing:
        print(f"  Audio already downloaded: {existing.name}")
        return existing, video_info

    # Step 2: Download with format priority — low bitrate first to stay under 25 MB
    # worstaudio tries to get the lowest quality audio (typically 48 kbps OPUS webm)
    format_string = (
        "bestaudio[ext=webm][abr<=70]"   # YouTube OPUS 48 kbps webm (best option)
        "/bestaudio[abr<=70]"             # Any 48-70 kbps audio
        "/worstaudio[ext=webm]"           # Lowest quality webm
        "/worstaudio"                     # Absolute fallback (lowest quality anything)
    )

    ydl_opts = {
        **_base_opts,
        "format": format_string,
        "outtmpl": str(TMP_DIR / "%(id)s.%(ext)s"),
        "quiet": False,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        await asyncio.to_thread(ydl.extract_info, clean_url, download=True)

    audio_path = _find_downloaded_file(video_id)
    if not audio_path:
        raise FileNotFoundError(
            f"Audio file not found after download for video {video_id}. "
            f"URL: {clean_url}"
        )

    file_size_mb = audio_path.stat().st_size / 1024 / 1024
    print(f"  Audio: {audio_path.name} ({file_size_mb:.1f} MB)")

    if audio_path.stat().st_size > MAX_WHISPER_BYTES:
        audio_path = await _compress_with_ffmpeg(audio_path, video_id)

    return audio_path, video_info


async def _compress_with_ffmpeg(audio_path: Path, video_id: str) -> Path:
    """
    Compress audio to 32 kbps MP3 using ffmpeg so it stays under Whisper's 25 MB limit.
    At 32 kbps, a 64-min video is ~15 MB — comfortably under the limit.
    Raises RuntimeError if ffmpeg is not installed.
    """
    import shutil
    import subprocess

    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        file_size_mb = audio_path.stat().st_size / 1024 / 1024
        raise RuntimeError(
            f"Audio file is {file_size_mb:.1f} MB (>24 MB limit for Azure Whisper) "
            f"and ffmpeg is not installed to compress it.\n"
            f"Install ffmpeg: https://ffmpeg.org/download.html\n"
            f"Then add it to your PATH and re-run the pipeline."
        )

    output_path = TMP_DIR / f"{video_id}_compressed.mp3"
    file_size_mb = audio_path.stat().st_size / 1024 / 1024
    print(f"  File too large ({file_size_mb:.1f} MB). Compressing with ffmpeg to 32 kbps...")

    cmd = [
        ffmpeg_bin,
        "-y",                       # overwrite output
        "-i", str(audio_path),
        "-b:a", "32k",              # 32 kbps audio — 64 min ≈ 15 MB
        "-ar", "16000",             # 16 kHz sample rate (Whisper works well with this)
        "-ac", "1",                 # mono
        str(output_path),
    ]

    result = await asyncio.to_thread(
        subprocess.run, cmd, capture_output=True, text=True
    )

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg compression failed:\n{result.stderr}")

    compressed_mb = output_path.stat().st_size / 1024 / 1024
    print(f"  Compressed to {output_path.name} ({compressed_mb:.1f} MB)")

    # Remove original oversized file
    audio_path.unlink(missing_ok=True)
    return output_path


async def transcribe(audio_path: Path) -> list[TranscriptSegment]:
    """
    Transcribe audio using Azure OpenAI Whisper.
    Returns list of segments with start/end timestamps.

    Notes:
    - Uses verbose_json for segment timestamps
    - Does NOT use timestamp_granularities (not universally supported in Azure)
    - Deletes the audio file after transcription
    """
    client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )

    print(f"  Transcribing {audio_path.name}...")

    with open(audio_path, "rb") as f:
        response = await client.audio.transcriptions.create(
            model=settings.whisper_deployment,
            file=f,
            response_format="verbose_json",
            language="es",          # Spanish — EPIC Lab talks
        )

    # Parse segments from the verbose_json response
    raw_segments = getattr(response, "segments", None) or []

    if not raw_segments:
        # Fallback: if no segments, treat entire transcript as one segment
        text = getattr(response, "text", "") or str(response)
        duration = getattr(response, "duration", 0) or 0
        segments = [TranscriptSegment(start=0.0, end=float(duration), text=text.strip())]
    else:
        segments = [
            TranscriptSegment(
                start=float(seg.get("start", 0) if isinstance(seg, dict) else getattr(seg, "start", 0)),
                end=float(seg.get("end", 0) if isinstance(seg, dict) else getattr(seg, "end", 0)),
                text=(seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", "")).strip(),
            )
            for seg in raw_segments
            if (seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", "")).strip()
        ]

    print(f"  Transcription complete: {len(segments)} segments")

    # Clean up audio file after transcription
    audio_path.unlink(missing_ok=True)
    print(f"  Audio file deleted (tmp/ cleaned)")

    return segments


def chunk_transcript(segments: list[TranscriptSegment]) -> list[Chunk]:
    """
    Group transcript segments into chunks of up to MAX_TOKENS_PER_CHUNK tokens.

    Strategy:
    - Accumulate segments until token limit is reached
    - If a single segment exceeds the limit, split at sentence boundaries
    - Each chunk preserves segment-level timestamps
    """
    chunks: list[Chunk] = []
    current: list[TranscriptSegment] = []
    current_tokens = 0
    chunk_index = 0

    for seg in segments:
        seg_tokens = _count_tokens(seg.text)

        # Flush current chunk if adding this segment would exceed the limit
        if current_tokens + seg_tokens > MAX_TOKENS_PER_CHUNK and current:
            chunks.append(Chunk(
                segments=current,
                token_count=current_tokens,
                chunk_index=chunk_index,
            ))
            chunk_index += 1
            current = []
            current_tokens = 0

        # Handle oversized single segments by splitting at sentence boundaries
        if seg_tokens > MAX_TOKENS_PER_CHUNK:
            sentences = re.split(r"(?<=[.!?¿¡])\s+", seg.text)
            for sentence in sentences:
                s_tokens = _count_tokens(sentence)
                if current_tokens + s_tokens > MAX_TOKENS_PER_CHUNK and current:
                    chunks.append(Chunk(
                        segments=current,
                        token_count=current_tokens,
                        chunk_index=chunk_index,
                    ))
                    chunk_index += 1
                    current = []
                    current_tokens = 0
                current.append(TranscriptSegment(
                    start=seg.start, end=seg.end, text=sentence
                ))
                current_tokens += s_tokens
        else:
            current.append(seg)
            current_tokens += seg_tokens

    if current:
        chunks.append(Chunk(
            segments=current,
            token_count=current_tokens,
            chunk_index=chunk_index,
        ))

    return chunks
