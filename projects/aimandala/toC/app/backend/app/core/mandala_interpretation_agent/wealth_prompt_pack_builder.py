"""Compatibility wrapper for the wealth relationship topic prompt pack."""

from __future__ import annotations

from .topic_prompt_pack_builder import TopicPromptPack as WealthPromptPack
from .topic_prompt_pack_builder import TopicPromptPackBuilder
from .topic_prompt_pack_registry import get_topic_config


class WealthPromptPackBuilder(TopicPromptPackBuilder):
    """Build the wealth relationship topic pack via the generic topic builder."""

    def __init__(self, **kwargs) -> None:
        super().__init__(config=get_topic_config("wealth-relationship"), **kwargs)
