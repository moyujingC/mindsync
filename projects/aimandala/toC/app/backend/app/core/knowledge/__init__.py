"""Compatibility entrypoint for the legacy knowledge package."""

from .legacy_exports import *  # noqa: F401,F403
from .legacy_exports import __all__ as _legacy_exports_all
from .query_engine import (
    KnowledgeQueryEngine,
    QueryResult,
    query_color_meaning,
    query_circle_interpretation,
    identify_imbalance_types,
)
from .runtime_facade import *  # noqa: F401,F403
from .runtime_facade import __all__ as _runtime_facade_all
from .utils import (
    FallbackChain,
    with_fallback,
    safe_query,
    LazyImporter,
    chain_queries,
)

__all__ = [
    *_legacy_exports_all,
    *_runtime_facade_all,
    "KnowledgeQueryEngine",
    "QueryResult",
    "query_color_meaning",
    "query_circle_interpretation",
    "identify_imbalance_types",
    "FallbackChain",
    "with_fallback",
    "safe_query",
    "LazyImporter",
    "chain_queries",
]
