"""
Quick connectivity test for Azure OpenAI + Supabase.
Run before the pipeline to verify credentials.

Usage: cd backend && python scripts/test_connection.py
"""
from __future__ import annotations
import asyncio
import sys
import io
from pathlib import Path

# Force UTF-8 output on Windows to avoid UnicodeEncodeError with special chars
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings

OK = "[OK]"
FAIL = "[FAIL]"


async def test_azure_openai() -> bool:
    from openai import AsyncAzureOpenAI

    print("\n[Azure OpenAI]")
    print(f"  Endpoint:   {settings.azure_openai_endpoint}")
    print(f"  API version:{settings.azure_openai_api_version}")
    print(f"  GPT-4o dep: {settings.gpt4o_deployment}")
    print(f"  Embed dep:  {settings.embedding_deployment}")
    print(f"  Whisper dep:{settings.whisper_deployment}")

    client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )

    # Test chat completion
    try:
        print("  Testing chat completion (gpt-4o)...")
        resp = await client.chat.completions.create(
            model=settings.gpt4o_deployment,
            messages=[{"role": "user", "content": "Reply with just: OK"}],
            max_tokens=5,
        )
        reply = resp.choices[0].message.content
        print(f"  Chat reply: '{reply}' {OK}")
    except Exception as e:
        print(f"  Chat ERROR: {e}")
        return False

    # Test embeddings
    try:
        print("  Testing embeddings...")
        emb_resp = await client.embeddings.create(
            model=settings.embedding_deployment,
            input=["test embedding"],
        )
        dims = len(emb_resp.data[0].embedding)
        print(f"  Embedding dims: {dims} {OK}")
    except Exception as e:
        print(f"  Embedding ERROR: {e}")
        return False

    return True


def test_supabase() -> bool:
    print("\n[Supabase]")
    print(f"  URL: {settings.supabase_url}")

    try:
        from app.db import get_supabase
        supabase = get_supabase()

        result = supabase.table("talks").select("id", count="exact").execute()
        talk_count = result.count if result.count is not None else len(result.data)
        print(f"  talks table: {talk_count} rows {OK}")

        result = supabase.table("insights").select("id", count="exact").execute()
        insight_count = result.count if result.count is not None else len(result.data)
        print(f"  insights table: {insight_count} rows {OK}")

        return True
    except Exception as e:
        print(f"  Supabase ERROR: {e}")
        return False


def test_ytdlp() -> bool:
    print("\n[yt-dlp]")
    try:
        import yt_dlp
        print(f"  version: {yt_dlp.version.__version__} {OK}")
        return True
    except ImportError:
        print("  yt-dlp not installed. Run: pip install yt-dlp")
        return False


def test_urls() -> bool:
    """Quick check that the 3 demo YouTube URLs are reachable."""
    print("\n[YouTube URLs]")
    import yt_dlp

    urls = [
        "https://www.youtube.com/watch?v=OgePyNAZDIs",
        "https://www.youtube.com/watch?v=1Pky04lprTY",
        "https://www.youtube.com/watch?v=BHM8IQa13bw",
    ]

    all_ok = True
    for url in urls:
        vid_id = url.split("v=")[1]
        try:
            ydl_opts = {"quiet": True, "skip_download": True}
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
            title = info.get("title", "?")[:50]
            dur = info.get("duration", 0)
            print(f"  {vid_id}: '{title}' ({dur//60}m) {OK}")
        except Exception as e:
            print(f"  {vid_id}: ERROR — {e}")
            all_ok = False

    return all_ok


async def main() -> None:
    print("EPIC Echo -- Connection Test")
    print("=" * 40)

    if not settings.azure_openai_api_key:
        print("ERROR: AZURE_OPENAI_API_KEY not set in backend/.env")
        sys.exit(1)

    ytdlp_ok = test_ytdlp()
    supabase_ok = test_supabase()
    azure_ok = await test_azure_openai()
    urls_ok = test_urls() if ytdlp_ok else False

    results = {
        "yt-dlp":       ytdlp_ok,
        "Supabase":     supabase_ok,
        "Azure OpenAI": azure_ok,
        "YouTube URLs": urls_ok,
    }

    print("\n" + "=" * 40)
    print("Summary:")
    all_ok = True
    for name, ok in results.items():
        status = OK if ok else FAIL
        print(f"  {name}: {status}")
        if not ok:
            all_ok = False

    if all_ok:
        print("\nAll systems go. Run: python scripts/run_pipeline.py --talk 1")
    else:
        print("\nFix the errors above before running the pipeline.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
