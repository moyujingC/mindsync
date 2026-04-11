"""Runtime-backed compatibility helpers for the legacy knowledge package."""

from app.core.knowledge_runtime.runtime import get_knowledge_runtime


def _runtime():
    return get_knowledge_runtime()


def get_theme_config(theme: str) -> dict:
    return _runtime().theme_service.get_theme_config(theme)


def get_theme_color_interpretation(
    theme: str,
    element: str,
    intensity: str,
    circle: str = None,
) -> dict:
    return _runtime().theme_service.get_theme_color_interpretation(
        theme,
        element,
        intensity,
        circle,
    )


def get_healing_prescription(theme: str, issue_type: str = None) -> dict:
    return _runtime().healing_service.get_healing_prescription(theme, issue_type)


def get_element_meaning(theme: str, element: str) -> dict:
    return _runtime().theme_service.get_element_meaning(theme, element)


def get_insight_templates(theme: str) -> dict:
    return _runtime().narrative_service.get_insight_templates(theme)


def get_pro_upgrade_teaser(theme: str) -> str:
    return _runtime().narrative_service.get_pro_upgrade_teaser(theme)


def list_themes() -> list:
    return _runtime().theme_service.list_themes()


def list_issue_types(theme: str) -> list:
    return _runtime().theme_service.list_issue_types(theme)


def get_healing_template(template_type: str = "standard") -> dict:
    templates = _runtime().repository.get_assets("healing").get(
        "healing.templates",
        {},
    ).get("payload", {}).get("templates", {})
    if template_type in templates:
        return templates[template_type]
    return _runtime().healing_service.get_healing_template("general")


def get_theme_summary(theme: str) -> dict:
    return _runtime().theme_service.get_theme_summary(theme)


__all__ = [
    "get_theme_config",
    "get_theme_color_interpretation",
    "get_healing_prescription",
    "get_element_meaning",
    "get_insight_templates",
    "get_pro_upgrade_teaser",
    "list_themes",
    "list_issue_types",
    "get_healing_template",
    "get_theme_summary",
]
