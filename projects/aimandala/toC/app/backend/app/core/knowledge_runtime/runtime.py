"""Service container for the v2.1 knowledge runtime."""

from __future__ import annotations

from dataclasses import dataclass

from app.core.llm.runtime import LLMClient, create_llm_client_from_env

from .compiler import KnowledgePackCompiler
from .repository import KnowledgeRepository, resolve_build_dir
from .services.circle_service import CircleService
from .services.element_service import ElementService
from .services.healing_service import HealingService
from .services.imbalance_service import ImbalanceService
from .services.layer0_assembler import Layer0Assembler
from .services.narrative_context_service import NarrativeContextService
from .services.theme_service import ThemeService
from .validators import KnowledgePackValidator


@dataclass
class KnowledgeRuntime:
    """Container for all v2.1 knowledge services."""

    repository: KnowledgeRepository
    element_service: ElementService
    circle_service: CircleService
    theme_service: ThemeService
    imbalance_service: ImbalanceService
    healing_service: HealingService
    narrative_service: NarrativeContextService
    layer0_assembler: Layer0Assembler


_runtime: KnowledgeRuntime | None = None


def create_knowledge_runtime(
    *,
    build_selector: str = "current",
    llm_client: LLMClient | None = None,
) -> KnowledgeRuntime:
    """Create a runtime bound to a specific compiled build selector."""

    validator = KnowledgePackValidator()
    compiler = KnowledgePackCompiler(
        validator=validator,
        build_dir=resolve_build_dir(build_selector),
    )
    repository = KnowledgeRepository(
        build_selector=build_selector,
        compiler=compiler,
    )
    theme_service = ThemeService(repository)
    element_service = ElementService(repository)
    circle_service = CircleService(repository)
    imbalance_service = ImbalanceService(repository)
    healing_service = HealingService(repository)
    narrative_service = NarrativeContextService(
        repository=repository,
        theme_service=theme_service,
        healing_service=healing_service,
        imbalance_service=imbalance_service,
    )
    layer0_assembler = Layer0Assembler(
        repository=repository,
        element_service=element_service,
        circle_service=circle_service,
        theme_service=theme_service,
        imbalance_service=imbalance_service,
        llm_client=llm_client or create_llm_client_from_env(),
    )
    return KnowledgeRuntime(
        repository=repository,
        element_service=element_service,
        circle_service=circle_service,
        theme_service=theme_service,
        imbalance_service=imbalance_service,
        healing_service=healing_service,
        narrative_service=narrative_service,
        layer0_assembler=layer0_assembler,
    )


def get_knowledge_runtime() -> KnowledgeRuntime:
    """Return the shared runtime instance for the current build."""

    global _runtime
    if _runtime is None:
        _runtime = create_knowledge_runtime(build_selector="current")
    return _runtime
