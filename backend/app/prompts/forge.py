"""
Brief generation prompts for gpt-4o-mini structured output.

All briefs are generated in Spanish for EPIC Lab's ITAM audience.
Stage definitions live in stages.py; platform schemas live in platforms.py.
"""
from __future__ import annotations
from app.models.enums import Platform, JourneyStage
from app.models.schemas import InsightUnit, SemanticProfile
from app.prompts.stages import JOURNEY_STAGES
from app.prompts.platforms import PLATFORM_SPECS, get_brief_schema  # noqa: F401 — re-exported

__all__ = ["build_forge_messages", "get_brief_schema"]

SYSTEM_PROMPT = """\
Eres un editor de contenido senior especializado en redes sociales para EPIC Lab, \
una aceleradora de startups del ITAM en la Ciudad de México.

Tu misión: transformar insights de charlas de fundadores en briefs listos para publicar, \
perfectamente adaptados a la plataforma y audiencia objetivo.

Reglas inamovibles:
1. Escribe SIEMPRE en español. Sin excepciones.
2. El hook debe DETENER el scroll: afirmación contraintuitiva, estadística sorprendente, o pregunta retórica poderosa.
3. Mantén la voz auténtica del orador — no inventes datos, usa solo lo que está en el insight.
4. Adapta el formato ESTRICTAMENTE a las especificaciones de la plataforma, como lenguaje, formalidad, tipo de oraciones y límite de caracteres (para X).
5. El journey stage determina el nivel de sofisticación, tono y ángulo del contenido.
6. Incluye siempre evidencia concreta (datos, cifras, anécdotas del insight) cuando estén disponibles.
7. Evita frases genéricas de IA: "en el mundo actual", "es crucial", "en conclusión", "definitivamente".
"""


def build_forge_messages(
    insight: InsightUnit,
    platform: Platform,
    stage: JourneyStage,
    semantic_profile: SemanticProfile | None,
) -> list[dict]:
    """Build the message list for a forge API call."""
    platform_spec = PLATFORM_SPECS[platform]
    stage_info = JOURNEY_STAGES[stage]

    voice_context = ""
    if semantic_profile:
        hooks = ", ".join(f'"{p}"' for p in semantic_profile.top_5_hook_patterns[:3])
        preferred = ", ".join(f'"{p}"' for p in semantic_profile.preferred_phrases[:3])
        banned = ", ".join(f'"{p}"' for p in semantic_profile.banned_phrases[:3])
        tones = ", ".join(semantic_profile.tone_descriptors[:4])
        voice_context = f"""
━━━ VOZ DE EPIC LAB (aplica estos patrones) ━━━
• Hooks preferidos: {hooks}
• Frases preferidas: {preferred}
• Frases PROHIBIDAS: {banned}
• Tono: {tones}
• Formalidad (1-10): {semantic_profile.formality_level}
• Mix español/inglés: {semantic_profile.spanish_english_mix_policy}
"""

    user_content = f"""Genera un brief de {platform_spec["name"]} para el siguiente insight y audiencia.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIENCIA OBJETIVO: {stage_info["label_es"]} ({stage.value})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{stage_info["audience"]}

Objetivo del contenido: {stage_info["content_goal"]}
Tono: {stage_info["tone_guidance"]}
Estilo de CTA: {stage_info["cta_style"]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSIGHT FUENTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Afirmación: {insight.claim}

Evidencia: {insight.evidence}

Cita del orador: {insight.speaker_quote or "(no hay cita directa disponible)"}

Timestamp en el video: {insight.timestamp_start:.0f}s — {insight.timestamp_end:.0f}s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESPECIFICACIONES DE PLATAFORMA: {platform_spec["name"]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{platform_spec["format"]}
{voice_context}
Genera el brief ahora, completamente en español."""

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
