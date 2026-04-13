"""Voice pack semantic extraction prompt for gpt-4o (single call)."""
from __future__ import annotations

VOICE_SCHEMA = {
    "name": "SemanticProfile",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "top_5_hook_patterns": {"type": "array", "items": {"type": "string"}},
            "banned_phrases": {"type": "array", "items": {"type": "string"}},
            "preferred_phrases": {"type": "array", "items": {"type": "string"}},
            "tone_descriptors": {"type": "array", "items": {"type": "string"}},
            "cta_patterns": {"type": "array", "items": {"type": "string"}},
            "formality_level": {"type": "integer", "minimum": 1, "maximum": 10},
            "spanish_english_mix_policy": {"type": "string"},
            "topic_anchors": {"type": "array", "items": {"type": "string"}},
        },
        "required": [
            "top_5_hook_patterns", "banned_phrases", "preferred_phrases",
            "tone_descriptors", "cta_patterns", "formality_level",
            "spanish_english_mix_policy", "topic_anchors",
        ],
        "additionalProperties": False,
    },
}

SYSTEM_PROMPT = """Eres un estratega de contenido. Analiza estos posts de EPIC Lab para extraer su perfil de voz semántico.

EPIC Lab es una aceleradora de startups del ITAM. Su audiencia son emprendedores mexicanos y latinoamericanos.

Extrae:
- top_5_hook_patterns: Los 5 patrones de apertura más usados (ej. "La pregunta que nadie hace:", "Dato que sorprende:")
- banned_phrases: Frases que NUNCA aparecen o que se deben evitar (clichés, anglicismos innecesarios)
- preferred_phrases: Frases y expresiones características de EPIC Lab
- tone_descriptors: 5-7 adjetivos que describen el tono (ej. "directo", "basado en evidencia", "inspirador")
- cta_patterns: Patrones de llamada a la acción usados
- formality_level: 1 (muy casual) a 10 (muy formal) — basado en los posts reales
- spanish_english_mix_policy: Descripción de cómo mezclan español e inglés
- topic_anchors: Los 5-8 temas recurrentes en el contenido de EPIC Lab"""


def build_voice_messages(posts: list[dict]) -> list[dict]:
    posts_text = "\n\n---\n\n".join(
        f"[{p.get('platform', 'unknown').upper()}]\n{p.get('raw_text', '')}"
        for p in posts
    )

    user_content = f"""Analiza estos {len(posts)} posts de EPIC Lab y extrae el perfil de voz semántico:

{posts_text}

Extrae los patrones de voz según el esquema indicado."""

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
