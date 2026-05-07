"""Compatibility entrypoint for the legacy knowledge package."""

from __future__ import annotations

from .legacy_exports import *  # noqa: F401,F403
from .legacy_exports import __all__ as _legacy_exports_all
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
    *[
        "KnowledgeQueryEngine",
        "QueryResult",
        "query_color_meaning",
        "query_circle_interpretation",
        "identify_imbalance_types",
    ],
    "FallbackChain",
    "with_fallback",
    "safe_query",
    "LazyImporter",
    "chain_queries",
]


def __getattr__(name: str):
    if name in {
        "KnowledgeQueryEngine",
        "QueryResult",
        "query_color_meaning",
        "query_circle_interpretation",
        "identify_imbalance_types",
    }:
        from . import query_engine as _query_engine

        return getattr(_query_engine, name)
    raise AttributeError(name)
