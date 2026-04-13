from enum import Enum


class TalkStatus(str, Enum):
    pending = "pending"
    transcribing = "transcribing"
    extracting = "extracting"
    completed = "completed"
    failed = "failed"


class Platform(str, Enum):
    linkedin = "linkedin"
    x = "x"
    instagram_carousel = "instagram_carousel"
    short_form_video = "short_form_video"


class JourneyStage(str, Enum):
    curious_explorer = "curious_explorer"
    first_builder = "first_builder"
    growth_navigator = "growth_navigator"
    ecosystem_leader = "ecosystem_leader"
