"""
主题特化知识库

七大主题：
- father_relationship: 父亲关系
- mother_relationship: 母亲关系
- intimate_relationship: 亲密关系
- parent_child_relationship: 亲子关系
- wealth_career: 财富事业
- health_wellness: 身体健康
- personal_growth: 个人成长
"""

# 导入各主题数据
from .general import (
    THEME_CONFIG as GENERAL_CONFIG,
    COLOR_MEANINGS as GENERAL_COLOR_MEANINGS,
    HEALING_PRESCRIPTIONS as GENERAL_HEALING,
    INSIGHT_TEMPLATES as GENERAL_INSIGHT_TEMPLATES,
    IMBALANCE_MAPPINGS as GENERAL_IMBALANCE_MAPPINGS,
)

from .father_relationship import (
    THEME_CONFIG as FATHER_CONFIG,
    COLOR_MEANINGS as FATHER_COLOR_MEANINGS,
    INTERACTIONS as FATHER_INTERACTIONS,
    HEALING_PRESCRIPTIONS as FATHER_HEALING,
    INSIGHT_TEMPLATES as FATHER_INSIGHT_TEMPLATES,
    IMBALANCE_MAPPINGS as FATHER_IMBALANCE_MAPPINGS,
)

from .mother_relationship import (
    THEME_CONFIG as MOTHER_CONFIG,
    COLOR_MEANINGS as MOTHER_COLOR_MEANINGS,
    INTERACTIONS as MOTHER_INTERACTIONS,
    HEALING_PRESCRIPTIONS as MOTHER_HEALING,
    INSIGHT_TEMPLATES as MOTHER_INSIGHT_TEMPLATES,
    IMBALANCE_MAPPINGS as MOTHER_IMBALANCE_MAPPINGS,
)

from .intimate_relationship import (
    THEME_CONFIG as INTIMATE_CONFIG,
    COLOR_MEANINGS as INTIMATE_COLOR_MEANINGS,
    INTERACTIONS as INTIMATE_INTERACTIONS,
    HEALING_PRESCRIPTIONS as INTIMATE_HEALING,
    INSIGHT_TEMPLATES as INTIMATE_INSIGHT_TEMPLATES,
    IMBALANCE_MAPPINGS as INTIMATE_IMBALANCE_MAPPINGS,
)

from .parent_child_relationship import (
    THEME_CONFIG as PARENT_CHILD_CONFIG,
    COLOR_MEANINGS as PARENT_CHILD_COLOR_MEANINGS,
    INTERACTIONS as PARENT_CHILD_INTERACTIONS,
    HEALING_PRESCRIPTIONS as PARENT_CHILD_HEALING,
    INSIGHT_TEMPLATES as PARENT_CHILD_INSIGHT_TEMPLATES,
    IMBALANCE_MAPPINGS as PARENT_CHILD_IMBALANCE_MAPPINGS,
)

from .wealth_career import (
    THEME_CONFIG as WEALTH_CONFIG,
    COLOR_MEANINGS as WEALTH_COLOR_MEANINGS,
    INTERACTIONS as WEALTH_INTERACTIONS,
    HEALING_PRESCRIPTIONS as WEALTH_HEALING,
    INSIGHT_TEMPLATES as WEALTH_INSIGHT_TEMPLATES,
    IMBALANCE_MAPPINGS as WEALTH_IMBALANCE_MAPPINGS,
)

from .health_wellness import (
    THEME_CONFIG as HEALTH_CONFIG,
    COLOR_MEANINGS as HEALTH_COLOR_MEANINGS,
    INTERACTIONS as HEALTH_INTERACTIONS,
    HEALING_PRESCRIPTIONS as HEALTH_HEALING,
    INSIGHT_TEMPLATES as HEALTH_INSIGHT_TEMPLATES,
    IMBALANCE_MAPPINGS as HEALTH_IMBALANCE_MAPPINGS,
)

from .personal_growth import (
    THEME_CONFIG as GROWTH_CONFIG,
    COLOR_MEANINGS as GROWTH_COLOR_MEANINGS,
    INTERACTIONS as GROWTH_INTERACTIONS,
    HEALING_PRESCRIPTIONS as GROWTH_HEALING,
    INSIGHT_TEMPLATES as GROWTH_INSIGHT_TEMPLATES,
    IMBALANCE_MAPPINGS as GROWTH_IMBALANCE_MAPPINGS,
)

# 主题配置汇总
THEME_CONFIGS = {
    "general": GENERAL_CONFIG,
    "father_relationship": FATHER_CONFIG,
    "mother_relationship": MOTHER_CONFIG,
    "intimate_relationship": INTIMATE_CONFIG,
    "parent_child_relationship": PARENT_CHILD_CONFIG,
    "wealth_career": WEALTH_CONFIG,
    "health_wellness": HEALTH_CONFIG,
    "personal_growth": GROWTH_CONFIG,
}

# 主题颜色含义汇总
THEME_COLOR_MEANINGS = {
    "general": GENERAL_COLOR_MEANINGS,
    "father_relationship": FATHER_COLOR_MEANINGS,
    "mother_relationship": MOTHER_COLOR_MEANINGS,
    "intimate_relationship": INTIMATE_COLOR_MEANINGS,
    "parent_child_relationship": PARENT_CHILD_COLOR_MEANINGS,
    "wealth_career": WEALTH_COLOR_MEANINGS,
    "health_wellness": HEALTH_COLOR_MEANINGS,
    "personal_growth": GROWTH_COLOR_MEANINGS,
}

# 主题交互汇总
THEME_INTERACTIONS = {
    "father_relationship": FATHER_INTERACTIONS,
    "mother_relationship": MOTHER_INTERACTIONS,
    "intimate_relationship": INTIMATE_INTERACTIONS,
    "parent_child_relationship": PARENT_CHILD_INTERACTIONS,
    "wealth_career": WEALTH_INTERACTIONS,
    "health_wellness": HEALTH_INTERACTIONS,
    "personal_growth": GROWTH_INTERACTIONS,
}

# 疗愈方案汇总
HEALING_PRESCRIPTIONS = {
    "general": GENERAL_HEALING,
    "father_relationship": FATHER_HEALING,
    "mother_relationship": MOTHER_HEALING,
    "intimate_relationship": INTIMATE_HEALING,
    "parent_child_relationship": PARENT_CHILD_HEALING,
    "wealth_career": WEALTH_HEALING,
    "health_wellness": HEALTH_HEALING,
    "personal_growth": GROWTH_HEALING,
}

# 洞察模板汇总
INSIGHT_TEMPLATES = {
    "general": GENERAL_INSIGHT_TEMPLATES,
    "father_relationship": FATHER_INSIGHT_TEMPLATES,
    "mother_relationship": MOTHER_INSIGHT_TEMPLATES,
    "intimate_relationship": INTIMATE_INSIGHT_TEMPLATES,
    "parent_child_relationship": PARENT_CHILD_INSIGHT_TEMPLATES,
    "wealth_career": WEALTH_INSIGHT_TEMPLATES,
    "health_wellness": HEALTH_INSIGHT_TEMPLATES,
    "personal_growth": GROWTH_INSIGHT_TEMPLATES,
}

# 失衡类型映射汇总
IMBALANCE_MAPPINGS = {
    "general": GENERAL_IMBALANCE_MAPPINGS,
    "father_relationship": FATHER_IMBALANCE_MAPPINGS,
    "mother_relationship": MOTHER_IMBALANCE_MAPPINGS,
    "intimate_relationship": INTIMATE_IMBALANCE_MAPPINGS,
    "parent_child_relationship": PARENT_CHILD_IMBALANCE_MAPPINGS,
    "wealth_career": WEALTH_IMBALANCE_MAPPINGS,
    "health_wellness": HEALTH_IMBALANCE_MAPPINGS,
    "personal_growth": GROWTH_IMBALANCE_MAPPINGS,
}


def get_theme_config(theme: str) -> dict:
    """获取主题配置"""
    return THEME_CONFIGS.get(theme, {})


def get_theme_color_interpretation(
    theme: str, element: str, intensity: str, circle: str = None
) -> dict:
    """获取主题颜色解读"""
    theme_data = THEME_COLOR_MEANINGS.get(theme, {})
    element_data = theme_data.get(element, {})

    if not element_data:
        return {}

    intensity_data = element_data.get("shades", {}).get(intensity, {})

    if circle:
        return intensity_data.get("circles", {}).get(circle, {})
    return intensity_data


def get_theme_interaction(theme: str, interaction_type: str) -> dict:
    """获取主题交互解读"""
    theme_data = THEME_INTERACTIONS.get(theme, {})
    return theme_data.get(interaction_type, {})


def get_insight_templates(theme: str) -> dict:
    """获取主题6个洞察角度模板"""
    return INSIGHT_TEMPLATES.get(theme, {})


def get_imbalance_mapping(theme: str, imbalance_type: str = None) -> dict:
    """获取主题失衡类型差异化解读

    Args:
        theme: 主题ID
        imbalance_type: 失衡类型名称，如不提供则返回全部映射

    Returns:
        单个失衡类型解读或全部映射字典
    """
    theme_mappings = IMBALANCE_MAPPINGS.get(theme, {})
    if imbalance_type:
        return theme_mappings.get(imbalance_type, {})
    return theme_mappings


def get_experiment_template(theme: str) -> str:
    """获取主题实验建议模板"""
    # 动态导入对应主题模块获取实验模板
    module_map = {
        "general": ".general",
        "father_relationship": ".father_relationship",
        "mother_relationship": ".mother_relationship",
        "intimate_relationship": ".intimate_relationship",
        "parent_child_relationship": ".parent_child_relationship",
        "wealth_career": ".wealth_career",
        "health_wellness": ".health_wellness",
        "personal_growth": ".personal_growth",
    }
    try:
        import importlib

        module_path = module_map.get(theme)
        if module_path:
            module = importlib.import_module(module_path, package=__name__)
            if hasattr(module, "get_experiment_template"):
                return module.get_experiment_template()
    except Exception:
        pass

    # 默认实验模板
    return """
💡 一个小实验
这周观察一次自己在【具体场景】中的自动反应，
不做改变，只是觉察。
记录你看到了什么。
"""


def get_pro_upgrade_teaser(theme: str) -> str:
    """获取主题Pro版引导文案"""
    # 动态导入对应主题模块获取引导文案
    module_map = {
        "general": ".general",
        "father_relationship": ".father_relationship",
        "mother_relationship": ".mother_relationship",
        "intimate_relationship": ".intimate_relationship",
        "parent_child_relationship": ".parent_child_relationship",
        "wealth_career": ".wealth_career",
        "health_wellness": ".health_wellness",
        "personal_growth": ".personal_growth",
    }
    try:
        import importlib

        module_path = module_map.get(theme)
        if module_path:
            module = importlib.import_module(module_path, package=__name__)
            if hasattr(module, "get_pro_upgrade_teaser"):
                return module.get_pro_upgrade_teaser()
    except Exception:
        pass

    # 默认引导文案
    return """
还有更多深层洞察，包括：
- 这种模式与童年经历的深层连接
- 更完整的结构、根因与疗愈视角
"""


def get_healing_prescription(theme: str, issue_type: str = None) -> dict:
    """获取疗愈方案"""
    theme_data = HEALING_PRESCRIPTIONS.get(theme, {})

    if issue_type:
        return theme_data.get("issue_types", {}).get(issue_type, {})
    return theme_data


def get_element_meaning(theme: str, element: str) -> dict:
    """获取主题元素含义"""
    return THEME_COLOR_MEANINGS.get(theme, {}).get(element, {})


def get_interpretation_with_theme(
    element: str, intensity: str, circle: str, theme: str = None
) -> dict:
    """统一查询接口（带主题）"""
    if theme and theme in THEME_COLOR_MEANINGS:
        theme_interp = get_theme_color_interpretation(theme, element, intensity, circle)
        if theme_interp:
            return theme_interp

    # Fallback到基础版
    from ..color_meanings import COLOR_MEANINGS

    element_data = COLOR_MEANINGS.get(element, {})
    intensity_data = element_data.get("shades", {}).get(intensity, {})
    return intensity_data.get("circles", {}).get(circle, {})


def list_themes() -> list:
    """列出所有主题"""
    return list(THEME_CONFIGS.keys())


def list_issue_types(theme: str) -> list:
    """列出主题下的问题类型"""
    theme_data = HEALING_PRESCRIPTIONS.get(theme, {})
    return list(theme_data.get("issue_types", {}).keys())


def get_healing_template(template_type: str = "standard") -> dict:
    """获取疗愈模板"""
    templates = {
        "standard": {
            "phases": ["觉察", "接纳", "转化", "巩固"],
            "duration_days": 21,
            "daily_practice": ["绘画", "书写", "冥想"],
        },
        "intensive": {
            "phases": ["危机干预", "稳定化", "深度工作", "整合"],
            "duration_days": 40,
            "daily_practice": ["绘画", "书写", "冥想", "身体练习"],
        },
    }
    return templates.get(template_type, templates["standard"])


def get_theme_summary(theme: str) -> dict:
    """获取主题摘要"""
    config = get_theme_config(theme)
    # 兼容不同字段名（theme_name_cn vs name）
    name = config.get("theme_name_cn") or config.get("name", "")
    description = config.get("description", "")
    core_issues = config.get("core_issues", [])
    return {
        "name": name,
        "description": description,
        "core_issues": core_issues,
        "focus_element": config.get("focus_element", ""),
        "related_circles": config.get("related_circles", []),
        "issue_type_count": len(list_issue_types(theme)),
    }


__all__ = [
    "THEME_CONFIGS",
    "THEME_COLOR_MEANINGS",
    "THEME_INTERACTIONS",
    "HEALING_PRESCRIPTIONS",
    "INSIGHT_TEMPLATES",
    "IMBALANCE_MAPPINGS",
    "get_theme_config",
    "get_theme_color_interpretation",
    "get_theme_interaction",
    "get_healing_prescription",
    "get_element_meaning",
    "get_interpretation_with_theme",
    "get_insight_templates",
    "get_imbalance_mapping",
    "get_experiment_template",
    "get_pro_upgrade_teaser",
    "list_themes",
    "list_issue_types",
    "get_healing_template",
    "get_theme_summary",
]
