"""
知识库层 - 曼陀罗解读的核心理论数据

包含：
- 五行理论（基础 + 高级生克乘侮）
- 三环结构
- 颜色含义
- 形状含义
- 直断规则
- 解读方法论
- 主题特化解读
"""

# 五行理论（基础定义 + 生克乘侮关系）
from .five_elements import (
    FIVE_ELEMENTS,
    FIVE_ELEMENTS_RELATIONS,
    ELEMENT_PROPERTIES,
    GENERATING_RELATIONS,
    RESTRAINING_RELATIONS,
    OVER_RESTRAINING_RELATIONS,
    REVERSE_RESTRAINING_RELATIONS,
    GENERATION_BECOMES_RESTRAINT,
    IMBALANCE_TYPES,
    get_element_by_color,
    analyze_color_balance,
    get_generating_interpretation,
    get_restraining_interpretation,
    get_over_restraining_interpretation,
    get_reverse_restraining_interpretation,
    get_imbalance_detail,
    get_imbalances_by_category,
    get_color_prescription,
    check_high_risk,
)

# 三环结构
from .three_circles import (
    THREE_CIRCLES,
    CIRCLE_COHERENCE_PATTERNS,
    CIRCLE_ENERGY_FLOW,
    ENERGY_FLOW_PATHS,
    ENERGY_FLOW_QUALITY,
    get_circle_interpretation,
    analyze_circle_coherence,
    analyze_energy_flow,
    evaluate_energy_quality,
    get_energy_flow_interpretation,
)

# 颜色含义
from .color_meanings import (
    COLOR_MEANINGS,
    COLOR_ALIASES,
    SPECIAL_COLORS,
    get_color_meaning,
    get_color_detailed_interpretation,
    get_special_color_meaning,
    get_element_traits,
    normalize_color_name,
    list_available_colors,
)

# 形状含义
from .shape_meanings import (
    SHAPE_ELEMENTS,
    SHAPE_MEANINGS,
    MANDALA_SPECIFIC_SHAPES,
    SHAPE_COMBINATIONS,
    SHAPE_INTENSITY,
    get_shape_element,
    get_shape_meaning,
    get_shape_combination_meaning,
    analyze_shape_distribution,
    get_recommended_shapes,
)

# 直断规则
from .direct_judgments import (
    DIRECT_JUDGMENTS,
    COLOR_DEPTH_RULES,
    WHITESPACE_ANALYSIS,
    analyze_whitespace,
    match_direct_judgments,
)

# 解读方法论
from .interpretation_methods import (
    INTERPRETATION_STEPS,
    analyze_five_elements_relationship,
    determine_proportion_type,
    check_abnormal_relations,
    resolve_color_shape_conflict,
    interpret_mandala,
    assess_energy_flow_quality,
    get_flow_based_interpretation,
    get_interpretation_guide,
    get_step_guide,
)

# 主题特化解读
from .themes import (
    THEME_CONFIGS,
    THEME_COLOR_MEANINGS,
    THEME_INTERACTIONS,
    HEALING_PRESCRIPTIONS,
    get_theme_config,
    get_theme_color_interpretation,
    get_theme_interaction,
    get_healing_prescription,
    get_element_meaning,
    get_interpretation_with_theme,
    list_themes,
    list_issue_types,
    get_healing_template,
    get_theme_summary,
)

# 查询引擎
from .query_engine import (
    KnowledgeQueryEngine,
    QueryResult,
    query_color_meaning,
    query_circle_interpretation,
    identify_imbalance_types,
)

# 工具函数
from .utils import (
    FallbackChain,
    with_fallback,
    safe_query,
    LazyImporter,
    chain_queries,
)

# 失衡类型 (SSOT)
from .imbalance_types import (
    TOC_IMBALANCE_TYPES,
    TOB_EXCLUSIVE_TYPES,
    IMBALANCE_CATEGORIES,
    is_toc_supported,
    get_toc_imbalance_types,
    get_tob_imbalance_types,
    filter_imbalances_by_version,
    get_imbalance_category,
    get_imbalance_list,
    validate_imbalance_type,
)

__all__ = [
    # 五行理论（基础 + 生克乘侮）
    "FIVE_ELEMENTS",
    "FIVE_ELEMENTS_RELATIONS",
    "ELEMENT_PROPERTIES",
    "GENERATING_RELATIONS",
    "RESTRAINING_RELATIONS",
    "OVER_RESTRAINING_RELATIONS",
    "REVERSE_RESTRAINING_RELATIONS",
    "GENERATION_BECOMES_RESTRAINT",
    "IMBALANCE_TYPES",
    "get_element_by_color",
    "analyze_color_balance",
    "get_generating_interpretation",
    "get_restraining_interpretation",
    "get_over_restraining_interpretation",
    "get_reverse_restraining_interpretation",
    "get_imbalance_detail",
    "get_imbalances_by_category",
    "get_color_prescription",
    "check_high_risk",
    # 失衡类型 (SSOT)
    "TOC_IMBALANCE_TYPES",
    "TOB_EXCLUSIVE_TYPES",
    "IMBALANCE_CATEGORIES",
    "is_toc_supported",
    "get_toc_imbalance_types",
    "get_tob_imbalance_types",
    "filter_imbalances_by_version",
    "get_imbalance_category",
    "get_imbalance_list",
    "validate_imbalance_type",
    # 三环
    "THREE_CIRCLES",
    "CIRCLE_COHERENCE_PATTERNS",
    "CIRCLE_ENERGY_FLOW",
    "ENERGY_FLOW_PATHS",
    "ENERGY_FLOW_QUALITY",
    "get_circle_interpretation",
    "analyze_circle_coherence",
    "analyze_energy_flow",
    "evaluate_energy_quality",
    "get_energy_flow_interpretation",
    # 颜色
    "COLOR_MEANINGS",
    "COLOR_ALIASES",
    "SPECIAL_COLORS",
    "get_color_meaning",
    "get_color_detailed_interpretation",
    "get_special_color_meaning",
    "get_element_traits",
    "normalize_color_name",
    "list_available_colors",
    # 形状
    "SHAPE_ELEMENTS",
    "SHAPE_MEANINGS",
    "MANDALA_SPECIFIC_SHAPES",
    "SHAPE_COMBINATIONS",
    "SHAPE_INTENSITY",
    "get_shape_element",
    "get_shape_meaning",
    "get_shape_combination_meaning",
    "analyze_shape_distribution",
    "get_recommended_shapes",
    # 直断
    "DIRECT_JUDGMENTS",
    "COLOR_DEPTH_RULES",
    "WHITESPACE_ANALYSIS",
    "analyze_whitespace",
    "match_direct_judgments",
    # 方法论
    "INTERPRETATION_STEPS",
    "analyze_five_elements_relationship",
    "determine_proportion_type",
    "check_abnormal_relations",
    "resolve_color_shape_conflict",
    "interpret_mandala",
    "assess_energy_flow_quality",
    "get_flow_based_interpretation",
    "get_interpretation_guide",
    "get_step_guide",
    # 主题特化
    "THEME_CONFIGS",
    "THEME_COLOR_MEANINGS",
    "THEME_INTERACTIONS",
    "HEALING_PRESCRIPTIONS",
    "get_theme_config",
    "get_theme_color_interpretation",
    "get_theme_interaction",
    "get_healing_prescription",
    "get_element_meaning",
    "get_interpretation_with_theme",
    "list_themes",
    "list_issue_types",
    "get_healing_template",
    "get_theme_summary",
    # 查询引擎
    "KnowledgeQueryEngine",
    "QueryResult",
    "query_color_meaning",
    "query_circle_interpretation",
    "identify_imbalance_types",
    # 工具函数
    "FallbackChain",
    "with_fallback",
    "safe_query",
    "LazyImporter",
    "chain_queries",
]
