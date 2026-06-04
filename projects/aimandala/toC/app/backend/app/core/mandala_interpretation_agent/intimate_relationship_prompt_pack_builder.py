"""Compatibility wrapper for the intimate relationship topic prompt pack."""

from __future__ import annotations

from .topic_prompt_pack_builder import TopicPromptPack as IntimateRelationshipPromptPack
from .topic_prompt_pack_builder import TopicPromptPackBuilder
from .topic_prompt_pack_registry import get_topic_config


class IntimateRelationshipPromptPackBuilder(TopicPromptPackBuilder):
    """Build the intimate relationship topic pack via the generic topic builder."""

    def __init__(self, **kwargs) -> None:
        super().__init__(config=get_topic_config("intimate-relationship"), **kwargs)
