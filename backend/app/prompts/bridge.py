"""Trend Hijacker bridge post prompt for gpt-4o-mini."""
from __future__ import annotations
from app.models.schemas import TrendHeadline, SemanticProfile

BRIDGE_SCHEMA = {
    "name": "BridgePost",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "hook": {"type": "string"},
            "body": {"type": "string"},
            "platform": {"type": "string"},
        },
        "required": ["hook", "body", "platform"],
        "additionalProperties": False,
    },
}

SYSTEM_PROMPT = """Eres editor de contenido de EPIC Lab. Tu trabajo es conectar titulares de tendencias actuales con insights de fundadores que ya habían identificado esta dinámica.

Tono: "Los oradores de EPIC Lab ya lo veían venir."
Escribe en español. Sé específico, no genérico."""


def build_bridge_messages(
    headline: TrendHeadline,
    insight: dict,
    semantic_profile: SemanticProfile | None,
) -> list[dict]:
    voice_hint = ""
    if semantic_profile:
        voice_hint = f"Voz: {', '.join(semantic_profile.tone_descriptors[:3])}"

    user_content = f"""Conecta este titular con el insight del fundador:

TITULAR TRENDING: {headline.headline}
Fuente: {headline.source_publication or "desconocida"}

INSIGHT DEL FUNDADOR:
- Afirmación: {insight.get("claim", "")}
- Evidencia: {insight.get("evidence", "")}
- Cita: {insight.get("speaker_quote", "N/A")}

{voice_hint}

Escribe un post de LinkedIn que diga: "este fundador ya lo sabía". Máx 800 caracteres."""

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
