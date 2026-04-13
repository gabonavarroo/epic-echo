"""
Platform definitions and structured JSON schemas for EPIC Lab content briefs.

Each platform has:
  - Human-readable format instructions for the LLM
  - A strict JSON schema for structured output (response_format json_schema)
  - Character limits and payload type metadata

Azure OpenAI strict mode constraints:
  - No minimum/maximum on integers (use Pydantic validators instead)
  - additionalProperties must be False on all objects
  - All properties must appear in required[]
"""
from __future__ import annotations
from app.models.enums import Platform


# ── Per-platform JSON schemas ───────────────────────────────────────────────

# LinkedIn and X: no structured_payload needed — hook + body + cta is sufficient.
BRIEF_SCHEMA_SIMPLE: dict = {
    "name": "BriefSimpleOutput",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "hook": {
                "type": "string",
                "description": "Primera oración del post que detiene el scroll.",
            },
            "body": {
                "type": "string",
                "description": "Cuerpo del post con evidencia y desarrollo del insight.",
            },
            "cta": {
                "type": "string",
                "description": "Llamada a la acción al final del post.",
            },
            "suggested_visuals": {
                "type": "string",
                "description": "Descripción breve del visual o imagen sugerida para acompañar el post.",
            },
        },
        "required": ["hook", "body", "cta", "suggested_visuals"],
        "additionalProperties": False,
    },
}

# Instagram Carousel: requires structured_payload with slides array.
BRIEF_SCHEMA_CAROUSEL: dict = {
    "name": "BriefCarouselOutput",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "hook": {
                "type": "string",
                "description": "Caption del post en Instagram (primera oración del texto que acompaña al carrusel).",
            },
            "body": {
                "type": "string",
                "description": "Texto completo del caption de Instagram con contexto del insight.",
            },
            "cta": {
                "type": "string",
                "description": "Llamada a la acción al final del caption.",
            },
            "suggested_visuals": {
                "type": "string",
                "description": "Paleta de colores, estilo visual o tipografía sugerida para el carrusel.",
            },
            "structured_payload": {
                "type": "object",
                "properties": {
                    "cover_headline": {
                        "type": "string",
                        "description": "Headline del slide 1 (cover): impactante, promete valor, ≤8 palabras.",
                    },
                    "closing_cta": {
                        "type": "string",
                        "description": "Texto del slide final con CTA claro.",
                    },
                    "slides": {
                        "type": "array",
                        "description": "Lista de slides del carrusel (5-7 slides, excluyendo cover y cierre).",
                        "items": {
                            "type": "object",
                            "properties": {
                                "slide_number": {
                                    "type": "integer",
                                    "description": "Número del slide empezando en 2 (el 1 es el cover).",
                                },
                                "headline": {
                                    "type": "string",
                                    "description": "Título corto del slide, ≤6 palabras.",
                                },
                                "body": {
                                    "type": "string",
                                    "description": "Desarrollo del punto en 2-3 oraciones.",
                                },
                                "visual_note": {
                                    "type": "string",
                                    "description": "Descripción del gráfico, imagen o elemento visual sugerido para este slide.",
                                },
                            },
                            "required": ["slide_number", "headline", "body", "visual_note"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["cover_headline", "closing_cta", "slides"],
                "additionalProperties": False,
            },
        },
        "required": ["hook", "body", "cta", "suggested_visuals", "structured_payload"],
        "additionalProperties": False,
    },
}

# Short-Form Video: requires structured_payload with clip timestamps and overlays.
BRIEF_SCHEMA_VIDEO: dict = {
    "name": "BriefVideoOutput",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "hook": {
                "type": "string",
                "description": "Texto del post en redes (primera oración que aparece en el feed).",
            },
            "body": {
                "type": "string",
                "description": "Descripción completa del post con contexto del clip.",
            },
            "cta": {
                "type": "string",
                "description": "Llamada a la acción al final del caption del video.",
            },
            "suggested_visuals": {
                "type": "string",
                "description": "Estilo visual, transiciones o efectos sugeridos para el editor de video.",
            },
            "structured_payload": {
                "type": "object",
                "properties": {
                    "clip_start": {
                        "type": "number",
                        "description": "Timestamp de inicio del clip en el video fuente (segundos).",
                    },
                    "clip_end": {
                        "type": "number",
                        "description": "Timestamp de fin del clip en el video fuente (segundos). clip_end - clip_start debe ser 30-90s.",
                    },
                    "caption": {
                        "type": "string",
                        "description": "Caption corto del post (≤150 caracteres).",
                    },
                    "hook_overlay": {
                        "type": "string",
                        "description": "Texto de overlay para los primeros 3 segundos del video (≤10 palabras).",
                    },
                    "cta_overlay": {
                        "type": "string",
                        "description": "Texto de overlay de cierre del video (≤8 palabras).",
                    },
                    "hashtags": {
                        "type": "array",
                        "description": "3-5 hashtags en español relevantes para el contenido.",
                        "items": {"type": "string"},
                    },
                },
                "required": [
                    "clip_start", "clip_end", "caption",
                    "hook_overlay", "cta_overlay", "hashtags",
                ],
                "additionalProperties": False,
            },
        },
        "required": ["hook", "body", "cta", "suggested_visuals", "structured_payload"],
        "additionalProperties": False,
    },
}


# ── Platform specs ──────────────────────────────────────────────────────────

PLATFORM_SPECS: dict[Platform, dict] = {
    Platform.linkedin: {
        "name": "LinkedIn",
        "format": (
            "Post de LinkedIn en español. "
            "Hook de 1-2 oraciones en las primeras 2 líneas (son lo único visible sin hacer clic en 'ver más'). "
            "Cuerpo de 3-5 párrafos cortos (1-3 líneas c/u), separados con línea en blanco. "
            "CTA claro al final. Máx 1,300 caracteres totales. "
            "Sin markdown pesado. Viñetas ocasionales OK. Datos concretos y métricas siempre que estén disponibles."
        ),
        "char_limit": 1300,
        "schema": BRIEF_SCHEMA_SIMPLE,
        "payload_type": None,
    },

    Platform.x: {
        "name": "X (Twitter)",
        "format": (
            "Tweet único o hilo de máx 3 partes en español. "
            "Si es hilo, el primer tweet es el hook (≤240 caracteres). "
            "Cada parte del hilo máx 280 caracteres. "
            "Sin hashtags excesivos (máx 2 al final si son muy relevantes). "
            "Voz directa, sin rodeos. La apuesta en la primera oración."
        ),
        "char_limit": 840,
        "schema": BRIEF_SCHEMA_SIMPLE,
        "payload_type": None,
    },

    Platform.instagram_carousel: {
        "name": "Instagram Carousel",
        "format": (
            "Carrusel de 5-7 slides para Instagram en español. "
            "Slide 1 (cover): headline impactante que promete valor claro (≤8 palabras). "
            "Slides intermedios: un punto por slide — headline corto + body 2-3 oraciones + visual_note. "
            "Último slide: cierre con CTA de seguir o guardar. "
            "El structured_payload debe incluir cover_headline, closing_cta, y array de slides con "
            "slide_number (empieza en 2), headline, body y visual_note."
        ),
        "char_limit": None,
        "schema": BRIEF_SCHEMA_CAROUSEL,
        "payload_type": "carousel",
    },

    Platform.short_form_video: {
        "name": "Video Corto (Reels / TikTok / Shorts)",
        "format": (
            "Brief para video corto de 30-90 segundos en español, basado en clip del video fuente. "
            "clip_start y clip_end son los timestamps exactos en segundos del fragmento clave. "
            "caption: texto del post (≤150 chars). "
            "hook_overlay: texto para overlay en los primeros 3 segundos (≤10 palabras). "
            "cta_overlay: texto para overlay de cierre (≤8 palabras). "
            "hashtags: 3-5 hashtags en español relevantes."
        ),
        "char_limit": 150,
        "schema": BRIEF_SCHEMA_VIDEO,
        "payload_type": "video",
    },
}


def get_brief_schema(platform: Platform) -> dict:
    """Return the strict JSON schema for a given platform's brief output."""
    return PLATFORM_SPECS[platform]["schema"]
