"""
6-axis Resonance Rubric scoring prompt for gpt-4o-mini.

Note on strict mode: Azure OpenAI strict JSON schema does NOT support
minimum/maximum on integers. Range validation (1-10) is enforced downstream
by the ScoreBreakdown Pydantic model (ge=1, le=10).
"""
from __future__ import annotations
from app.models.schemas import BriefCreate

# All integer score fields: type "integer" only — no min/max in strict mode.
_SCORE_INT = {"type": "integer"}
_SCORE_STR = {"type": "string"}

SCORE_SCHEMA: dict = {
    "name": "ScoreBreakdown",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "hook_strength":              _SCORE_INT,
            "evidence_density":           _SCORE_INT,
            "voice_conformance":          _SCORE_INT,
            "platform_format_fit":        _SCORE_INT,
            "journey_stage_clarity":      _SCORE_INT,
            "novelty":                    _SCORE_INT,
            "hook_strength_reason":       _SCORE_STR,
            "evidence_density_reason":    _SCORE_STR,
            "voice_conformance_reason":   _SCORE_STR,
            "platform_format_fit_reason": _SCORE_STR,
            "journey_stage_clarity_reason": _SCORE_STR,
            "novelty_reason":             _SCORE_STR,
        },
        "required": [
            "hook_strength", "evidence_density", "voice_conformance",
            "platform_format_fit", "journey_stage_clarity", "novelty",
            "hook_strength_reason", "evidence_density_reason", "voice_conformance_reason",
            "platform_format_fit_reason", "journey_stage_clarity_reason", "novelty_reason",
        ],
        "additionalProperties": False,
    },
}

SYSTEM_PROMPT = """\
Eres un evaluador de contenido senior para EPIC Lab. \
Evalúas briefs de contenido en 6 ejes, cada uno de 1 a 10.

Criterios de evaluación:

1. hook_strength (1-10)
   ¿La primera oración o título detiene el scroll?
   10 = afirmación contraintuitiva, estadística impactante, o pregunta que nadie puede ignorar.
   1 = oración genérica que no genera curiosidad.

2. evidence_density (1-10)
   ¿Hay una afirmación concreta respaldada por evidencia específica (datos, métricas, anécdotas reales)?
   10 = cifras exactas, caso real nombrado, mecanismo explicado.
   1 = declaración vaga sin sustento.

3. voice_conformance (1-10)
   ¿El tono y estilo coinciden con la voz de EPIC Lab (auténtica, directa, basada en evidencia, en español)?
   10 = suena exactamente como EPIC Lab, no como IA genérica.
   1 = tono corporativo genérico o traducción literal de inglés.

4. platform_format_fit (1-10)
   ¿El brief usa correctamente las convenciones nativas de la plataforma?
   10 = longitud, estructura y formato perfectos para la plataforma.
   1 = formato incorrecto o ignorado.

5. journey_stage_clarity (1-10)
   ¿Es inmediatamente obvio para quién es este contenido?
   10 = la audiencia se siente identificada desde la primera línea.
   1 = podría ser para cualquier persona o nadie en particular.

6. novelty (1-10)
   ¿Dice algo que EPIC Lab no ha dicho antes? ¿Es contraintuitivo, sorprendente, o va contra el sentido común?
   10 = insight que hace pensar "nunca lo había visto así".
   1 = cliché conocido, repite lo que todo el mundo ya sabe.

Para cada eje: calificación (1-10) + UNA oración de justificación específica y concreta.\
"""


def build_scoring_messages(brief: BriefCreate) -> list[dict]:
    """Build the message list for a scoring API call."""
    user_content = f"""Evalúa este brief con el Resonance Rubric de 6 ejes.

PLATAFORMA: {brief.platform.value}
AUDIENCIA (journey stage): {brief.journey_stage.value}

HOOK:
{brief.hook}

CUERPO:
{brief.body}

CTA:
{brief.cta or "(sin CTA explícito)"}

Califica los 6 ejes (1-10) con una oración de justificación específica cada uno."""

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
