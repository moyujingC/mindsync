"""Runtime entrypoints for the v2.1 knowledge system."""

from .contracts import FallbackLevel, QueryResult
from .runtime import KnowledgeRuntime, get_knowledge_runtime

__all__ = [
    "FallbackLevel",
    "KnowledgeRuntime",
    "QueryResult",
    "get_knowledge_runtime",
]

