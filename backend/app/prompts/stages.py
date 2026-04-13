"""
Journey Stage definitions for EPIC Lab content briefs.

Four stages represent the entrepreneurial journey from curiosity to ecosystem leadership.
Used by the Forge pipeline to tailor brief tone, angle, and CTA to the right audience.
"""
from __future__ import annotations
from app.models.enums import JourneyStage


JOURNEY_STAGES: dict[JourneyStage, dict] = {
    JourneyStage.curious_explorer: {
        "label": "Curious Explorer",
        "label_es": "Explorador Curioso",
        "audience": (
            "Personas de 18-30 años explorando el ecosistema emprendedor sin haber fundado. "
            "Estudiantes universitarios, profesionistas tempranos y curiosos que sienten 'el llamado' "
            "pero aún no saben cómo empezar. Su mayor freno es la incertidumbre y el miedo al fracaso."
        ),
        "content_goal": (
            "Inspirar acción. Desmitificar el emprendimiento. Mostrar que fundar no requiere tener todo "
            "resuelto — requiere valentía y un primer paso concreto. Normalizar las dudas y el no saber."
        ),
        "tone_guidance": (
            "Accesible, cálido, inspirador. Evitar jerga técnica de negocios. Hablar de posibilidades, "
            "no de métricas. Validar sus dudas y miedos como normales. Usar historias de origen."
        ),
        "content_examples": [
            "Historias de orígenes humildes de fundadores exitosos",
            "El momento preciso en que el fundador decidió dar el salto",
            "Desmitificación de mitos del emprendimiento ('necesitas capital para empezar')",
            "Primeros pasos concretos y alcanzables esta semana",
        ],
        "cta_style": (
            "Llamadas a reflexión o exploración: '¿Te identificas?', "
            "'Guarda esto para cuando lo necesites', 'Comparte con alguien que lo necesita oír'."
        ),
    },

    JourneyStage.first_builder: {
        "label": "First Builder",
        "label_es": "Primer Constructor",
        "audience": (
            "Fundadores en etapa temprana (0-2 años construyendo). Están validando ideas, buscando sus "
            "primeros 10-100 clientes, o enfrentando el caos del pre-product market fit. "
            "El día a día es ambigüedad, sobrevivencia y aprendizaje acelerado."
        ),
        "content_goal": (
            "Ofrecer herramientas prácticas y validación emocional. Reducir el ruido. "
            "Enfocar en lo que realmente mueve la aguja en etapa temprana: hablar con clientes, "
            "iterar rápido, y no morir en el intento."
        ),
        "tone_guidance": (
            "Directo, práctico, con evidencia específica. Evitar platitudes genéricas. "
            "El lector quiere saber QUÉ hacer esta semana, no filosofía abstracta de negocios. "
            "Respeta su tiempo y su inteligencia."
        ),
        "content_examples": [
            "Frameworks concretos de validación (entrevistas de cliente, MVPs mínimos)",
            "Cómo conseguir los primeros usuarios sin presupuesto de marketing",
            "Errores comunes en etapa temprana con evidencia de qué salió mal y cómo corregirlo",
            "Cómo pivotar cuando los números no cuadran pero la visión sigue en pie",
        ],
        "cta_style": (
            "Orientadas a acción concreta: 'Prueba este framework esta semana', "
            "'Guarda para tu próxima reunión de equipo', 'Comparte si lo estás viviendo ahora'."
        ),
    },

    JourneyStage.growth_navigator: {
        "label": "Growth Navigator",
        "label_es": "Navegador de Crecimiento",
        "audience": (
            "Startups con tracción inicial escalando operaciones. Tienen producto validado y buscan "
            "crecer de 10x a 100x. Sus problemas: contratar bien, construir cultura bajo presión, "
            "distribuir responsabilidades, mantener el crecimiento sostenible sin perder la esencia."
        ),
        "content_goal": (
            "Proveer inteligencia estratégica para escalar sin romperse. Mostrar cómo founders reales "
            "navegaron la transición de 'hacerlo todo yo' a 'liderarlo todo a través de otros'. "
            "Casos concretos con números, no teoría."
        ),
        "tone_guidance": (
            "Sofisticado, analítico, basado en datos. El lector ya conoce los fundamentos — "
            "quiere profundidad y casos de uso específicos. Respetar su inteligencia. "
            "Usar métricas, comparaciones y decisiones con trade-offs reales."
        ),
        "content_examples": [
            "Estrategias de contratación para pasar del equipo de 5 a 50 personas",
            "Unit economics y cómo optimizarlos para escala sostenible",
            "Construcción de cultura organizacional mientras creces aceleradamente",
            "Gestión de inversionistas, board y rondas de capital Serie A/B",
        ],
        "cta_style": (
            "Orientadas a reflexión estratégica: '¿Cuál es tu mayor reto de escala ahora?', "
            "'Comparte con tu co-founder', 'Guarda para tu próxima retrospectiva de equipo'."
        ),
    },

    JourneyStage.ecosystem_leader: {
        "label": "Ecosystem Leader",
        "label_es": "Líder del Ecosistema",
        "audience": (
            "VCs, directores de aceleradoras, founders senior post-exit, policy makers y líderes de "
            "corporativos con agenda de innovación. Piensan en décadas, no en trimestres. "
            "Su moneda es la influencia, el conocimiento sistémico y la capacidad de mover ecosistemas."
        ),
        "content_goal": (
            "Posicionar a EPIC Lab como referente intelectual del ecosistema latinoamericano. "
            "Provocar conversaciones sobre tendencias macro, el futuro del emprendimiento regional, "
            "y el rol de las instituciones educativas en la creación de startups."
        ),
        "tone_guidance": (
            "Elevado, provocador, con perspectiva histórica y comparativa. Puede ser más conceptual "
            "y abstracto que otros stages. El lector quiere ser desafiado en sus supuestos, "
            "no solo informado. Citas y evidencia de fuentes de alto perfil."
        ),
        "content_examples": [
            "Tendencias macro del ecosistema emprendedor latinoamericano en 5-10 años",
            "El rol de las universidades en la formación de fundadores de clase mundial",
            "Comparativas con ecosistemas globales (Silicon Valley, Israel, Bogotá, São Paulo)",
            "Política pública y su impacto estructural en el emprendimiento regional",
        ],
        "cta_style": (
            "Orientadas a debate y amplificación: 'Comparte tu perspectiva', "
            "'Tag a alguien que debería leer esto', '¿Qué agregarías a este análisis?'."
        ),
    },
}
