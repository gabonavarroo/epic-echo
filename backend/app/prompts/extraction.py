"""Insight extraction prompts for gpt-4o structured output."""
from __future__ import annotations
from app.models.schemas import Chunk

INSIGHT_LIST_SCHEMA = {
    "name": "InsightList",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "insights": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "claim": {"type": "string"},
                        "evidence": {"type": "string"},
                        "speaker_quote": {"type": ["string", "null"]},
                        "timestamp_start": {"type": ["number", "null"]},
                        "timestamp_end": {"type": ["number", "null"]},
                        "novelty_score": {"type": "integer", "minimum": 1, "maximum": 10},
                        "evidence_density": {"type": "integer", "minimum": 1, "maximum": 10},
                        "journey_stages": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": [
                                    "curious_explorer",
                                    "first_builder",
                                    "growth_navigator",
                                    "ecosystem_leader",
                                ]
                            }
                        },
                    },
                    "required": [
                        "claim", "evidence", "speaker_quote",
                        "timestamp_start", "timestamp_end",
                        "novelty_score", "evidence_density", "journey_stages",
                    ],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["insights"],
        "additionalProperties": False,
    },
}

SYSTEM_PROMPT = """Eres un analista de contenido especializado en extraer insights accionables de charlas de emprendedores.

Tu trabajo es identificar los momentos de mayor valor en una charla: afirmaciones concretas respaldadas por evidencia específica, con citas directas del orador.

Reglas:
- Cada insight debe tener una afirmación (claim) clara y accionable
- La evidencia debe ser específica: datos, métricas, anécdotas concretas, NO generalidades
- La cita del orador debe ser textual (verbatim), si está disponible
- Los timestamps deben corresponder al inicio y fin del fragmento donde aparece el insight
- novelty_score (1-10): qué tan no-obvio o contraintuitivo es el insight
- evidence_density (1-10): qué tan rica y específica es la evidencia que lo respalda
- journey_stages: etapas del viaje emprendedor para las que este insight es más relevante
  - curious_explorer: exploran ideas, aún no han fundado
  - first_builder: fundaron hace <2 años, buscando product-market fit
  - growth_navigator: tienen tracción, escalando
  - ecosystem_leader: líderes establecidos, impacto en el ecosistema
- Extrae 1 insight por cada 3-5 minutos de contenido
- Si el fragmento no contiene insights de valor, devuelve lista vacía"""


def build_extraction_messages(
    chunks: list[Chunk],
    speaker_name: str,
    talk_title: str,
) -> list[dict]:
    chunk_texts = []
    for chunk in chunks:
        segs_text = "\n".join(
            f"[{seg.start:.1f}s - {seg.end:.1f}s] {seg.text}"
            for seg in chunk.segments
        )
        chunk_texts.append(segs_text)

    combined = "\n\n---\n\n".join(chunk_texts)

    user_content = f"""Charla: "{talk_title}"
Orador: {speaker_name}
Idioma: Español

Transcripción (con timestamps en segundos):
{combined}

Extrae los insights más valiosos de este fragmento."""

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
