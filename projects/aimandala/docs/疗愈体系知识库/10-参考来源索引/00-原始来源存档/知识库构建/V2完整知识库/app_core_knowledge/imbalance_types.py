"""
失衡类型统一定义

本模块作为失衡类型的 Single Source of Truth (SSOT)，统一提供：
1. 完整的 20 种失衡类型定义
2. ToC/ToB 版本支持标记
3. 分类查询接口

设计原则：
- 所有失衡类型数据只在这里定义一次
- five_elements.py 和 query_engine.py 都从本模块导入
- 新增/修改失衡类型只需修改本文件

ToC 版本支持说明：
- ToC 版仅支持 10 种失衡类型（相生太过 5 + 相乘 5）
- ToB 版支持全部 20 种失衡类型
"""

from typing import Dict, List, Optional, TypedDict, Literal


class ThreeCirclesInterpretation(TypedDict):
    """三环解读"""

    inner: str
    middle: str
    outer: str


class ImbalanceTypeDefinition(TypedDict, total=False):
    """
    失衡类型完整定义

    所有字段均为可选（为了灵活性），但建议完整填写
    """

    category: str
    relation: str
    mechanism: str
    color_features: str
    psychology: str
    manifestation: str
    three_circles: ThreeCirclesInterpretation
    healing_direction: str
    color_prescription: str
    warning: Optional[str]
    toc_supported: bool  # ToC 版本是否支持


# =============================================================================
# 20种失衡类型完整定义 (Single Source of Truth)
# =============================================================================

IMBALANCE_TYPES: Dict[str, ImbalanceTypeDefinition] = {
    # ===== 相生太过（5种）- ToC 支持 =====
    "水多木漂": {
        "category": "相生太过",
        "relation": "水生木",
        "mechanism": "水过多，木被淹没漂浮",
        "color_features": "黑色/蓝色占比过高(>50%)，绿色存在但显得漂浮",
        "psychology": "表面积极但内心恐惧，情绪容易泛滥，根基不稳",
        "manifestation": "过度的滋养变成了溺爱和控制，水太多会把木头漂走",
        "three_circles": {
            "inner": "内心恐惧、不安全感",
            "middle": "情绪波动大，容易被影响",
            "outer": "外人觉得不稳定，难以依靠",
        },
        "healing_direction": "建立内在根基，减少情绪波动",
        "color_prescription": "减少黑色，增加黄色（土制水）",
        "toc_supported": True,
    },
    "火多土焦": {
        "category": "相生太过",
        "relation": "火生土",
        "mechanism": "火过旺，土被烧焦",
        "color_features": "红色占比很高且颜色深，黄色发焦发灰",
        "psychology": "极度急躁焦虑，承载力不足，容易burnout",
        "manifestation": "火烧得太旺会把土烧焦，过度的热情反而造成伤害",
        "three_circles": {
            "inner": "内心急躁焦虑",
            "middle": "情绪急躁，容易发火",
            "outer": "承载力受损，付出过度",
        },
        "healing_direction": "降心火，补土气",
        "color_prescription": "减少红色，增加黄色和绿色",
        "toc_supported": True,
    },
    "木多火塞": {
        "category": "相生太过",
        "relation": "木生火",
        "mechanism": "木过多，堵塞火的燃烧",
        "color_features": "绿色占比很高(>50%)，红色被绿色包围压制",
        "psychology": "固执己见，自我封闭，热情无法表达，成长受阻",
        "manifestation": "木头太多反而堵塞了火的燃烧空间，过度的付出成为负担",
        "three_circles": {
            "inner": "固执、自我封闭",
            "middle": "成长受阻，听不进意见",
            "outer": "热情无法外显，外人觉得固执",
        },
        "healing_direction": "疏通木气，释放火",
        "color_prescription": "减少绿色，增加红色和白色",
        "toc_supported": True,
    },
    "土多金埋": {
        "category": "相生太过",
        "relation": "土生金",
        "mechanism": "土过多，金被掩埋",
        "color_features": "黄色占比很高(>50%)，白色/金色被黄色包围",
        "psychology": "过度承担，价值被掩盖，付出多但不被认可",
        "manifestation": "土太多会把金埋没，过度承担使价值无法显现",
        "three_circles": {
            "inner": "内心沉重，自我价值低",
            "middle": "付出多但不被看见",
            "outer": "价值无法显现，外人只看到付出",
        },
        "healing_direction": "减负，让价值显现",
        "color_prescription": "减少黄色，增加白色和金色",
        "toc_supported": True,
    },
    "金多水浊": {
        "category": "相生太过",
        "relation": "金生水",
        "mechanism": "金过多，水被污染变浑浊",
        "color_features": "白色/金属色占比很高，黑色/蓝色显得浑浊",
        "psychology": "标准过多，智慧被束缚，思维僵化，情感被压抑",
        "manifestation": "金太多会使水浑浊，过度的标准使智慧受阻",
        "three_circles": {
            "inner": "内心标准过多，自我束缚",
            "middle": "对家人要求高，挑剔",
            "outer": "智慧无法流动，外人觉得冷硬",
        },
        "healing_direction": "软化金气，恢复流动",
        "color_prescription": "减少白色，增加黑色和蓝色",
        "toc_supported": True,
    },
    # ===== 子病犯母（5种）- ToB 专用 =====
    "水多金沉": {
        "category": "子病犯母",
        "relation": "金生水",
        "mechanism": "水（子）过多，金（母）被沉没",
        "color_features": "黑色/蓝色占比很高，白色显得沉底",
        "psychology": "恐惧淹没理智，无法做决定，思维混乱，被情绪淹没",
        "manifestation": "水太多金会下沉，过度的情绪使决断力丧失",
        "three_circles": {
            "inner": "内心恐惧，理智被淹没",
            "middle": "情绪泛滥，无法思考",
            "outer": "决断力被淹没，外人觉得优柔寡断",
        },
        "healing_direction": "净化水，恢复金气",
        "color_prescription": "减少黑色，增加白色和黄色",
        "toc_supported": False,  # ToB 专用
    },
    "火多木焚": {
        "category": "子病犯母",
        "relation": "木生火",
        "mechanism": "火（子）过旺，木（母）被焚毁",
        "color_features": "红色占比很高颜色深，绿色枯萎",
        "psychology": "急躁易怒，耗竭感，成长停滞，自我毁灭倾向",
        "manifestation": "火太旺会把木头都烧尽，过度的消耗导致枯竭",
        "three_circles": {
            "inner": "内心急躁，自我消耗",
            "middle": "情绪暴躁，耗竭家人",
            "outer": "成长被烧毁，外人觉得危险",
        },
        "healing_direction": "降心火，滋养木",
        "color_prescription": "减少红色，增加绿色和黑色",
        "toc_supported": False,  # ToB 专用
    },
    "土多火晦": {
        "category": "子病犯母",
        "relation": "火生土",
        "mechanism": "土（子）过多，火（母）被掩盖",
        "color_features": "黄色占比很高，红色暗淡被掩埋",
        "psychology": "过度承担，热情被消耗，心力不足，委屈压抑",
        "manifestation": "土太多会掩盖火光，过度承担使热情消退",
        "three_circles": {
            "inner": "内心沉重，热情消退",
            "middle": "承担过多，情绪压抑",
            "outer": "热情被压制，外人觉得沉闷",
        },
        "healing_direction": "减负，重燃热情",
        "color_prescription": "减少黄色，增加红色和绿色",
        "toc_supported": False,  # ToB 专用
    },
    "金多土虚": {
        "category": "子病犯母",
        "relation": "土生金",
        "mechanism": "金（子）过旺，土（母）被耗虚",
        "color_features": "白色/金属色占比很高，黄色显得虚浮不成片",
        "psychology": "标准过高，承载力虚，挑剔自我批评，根基不稳",
        "manifestation": "金太旺反耗土气，过度追求标准使基础虚浮",
        "three_circles": {
            "inner": "标准过多，内心虚浮",
            "middle": "挑剔要求高，关系紧张",
            "outer": "承载力虚，外人觉得不踏实",
        },
        "healing_direction": "降低标准，夯实基础",
        "color_prescription": "减少白色，增加黄色和红色",
        "toc_supported": False,  # ToB 专用
    },
    "木多水缩": {
        "category": "子病犯母",
        "relation": "水生木",
        "mechanism": "木（子）过旺，水（母）被耗缩",
        "color_features": "绿色占比很高，黑色/蓝色显得干涸",
        "psychology": "固执己见，智慧枯竭，缺乏深度，表面生长",
        "manifestation": "木太旺吸干水分，过度生长使智慧源泉枯竭",
        "three_circles": {
            "inner": "固执己见，缺乏深度",
            "middle": "成长过度，表面化",
            "outer": "智慧枯竭，外人觉得肤浅",
        },
        "healing_direction": "补充水源，深化内在",
        "color_prescription": "减少绿色，增加黑色和蓝色",
        "toc_supported": False,  # ToB 专用
    },
    # ===== 相乘（5种）- ToC 支持 =====
    "水多火灭": {
        "category": "相乘",
        "relation": "水克火",
        "mechanism": "水过度克制火，火被熄灭",
        "color_features": "黑色/蓝色占比极高，红色极弱",
        "psychology": "极度恐惧压抑，热情被完全浇灭，抑郁倾向，冷漠疏离",
        "manifestation": "水太大火会被浇灭，过度的情绪淹没一切热情",
        "three_circles": {
            "inner": "内心恐惧冰冷",
            "middle": "情绪泛滥，无热情",
            "outer": "热情无法外显，外人觉得冷漠",
        },
        "healing_direction": "⚠️ 需专业支持，适度补充火",
        "color_prescription": "⚠️ 谨慎使用红色，配合专业指导",
        "warning": "⚠️ 高危抑郁信号，强烈建议转介专业心理咨询",
        "toc_supported": True,
    },
    "火多金熔": {
        "category": "相乘",
        "relation": "火克金",
        "mechanism": "火过度克制金，金融化",
        "color_features": "红色占比很高颜色深，白色/金色被熔化",
        "psychology": "极度急躁，标准被破坏，无法坚持原则，容易冲动失控",
        "manifestation": "火太旺金会被熔化，过度的冲动破坏规则",
        "three_circles": {
            "inner": "内心急躁，无原则",
            "middle": "情绪暴躁，标准混乱",
            "outer": "无法坚持，外人觉得不可靠",
        },
        "healing_direction": "降心火，重建标准",
        "color_prescription": "减少红色，增加白色和蓝色",
        "toc_supported": True,
    },
    "金多木折": {
        "category": "相乘",
        "relation": "金克木",
        "mechanism": "金过度克制木，木被折断",
        "color_features": "白色/金属色占比很高，绿色被切割断裂",
        "psychology": "自我批评严重，成长被阻碍，被挑剔伤害，自信心受损",
        "manifestation": "金太利木会被砍断，过度的规则压制成长",
        "three_circles": {
            "inner": "自我批评严重",
            "middle": "被家人挑剔，成长受阻",
            "outer": "外人觉得无法成长",
        },
        "healing_direction": "减少自我批评，重建自信",
        "color_prescription": "减少白色，增加绿色和红色",
        "toc_supported": True,
    },
    "木多土陷": {
        "category": "相乘",
        "relation": "木克土",
        "mechanism": "木过度克制土，土被压陷",
        "color_features": "绿色占比很高，黄色被压迫下陷",
        "psychology": "固执己见，承载力受损，根基不稳，过度扩张",
        "manifestation": "木太多土会被崩裂，过度生长破坏基础",
        "three_circles": {
            "inner": "固执己见",
            "middle": "过度付出，承载受损",
            "outer": "外人觉得根基不稳",
        },
        "healing_direction": "减少扩张，夯实基础",
        "color_prescription": "减少绿色，增加黄色和白色",
        "toc_supported": True,
    },
    "土多水干": {
        "category": "相乘",
        "relation": "土克水",
        "mechanism": "土过度克制水，水被吸干",
        "color_features": "黄色占比很高，黑色/蓝色干涸",
        "psychology": "过度承担，智慧被压抑，缺乏灵活性，思维僵化",
        "manifestation": "土太多水会被吸干，过度控制使智慧枯竭",
        "three_circles": {
            "inner": "内心沉重，无智慧",
            "middle": "过度承担，无流动",
            "outer": "智慧被压抑，外人觉得僵化",
        },
        "healing_direction": "减负，恢复智慧流动",
        "color_prescription": "减少黄色，增加黑色和蓝色",
        "toc_supported": True,
    },
    # ===== 相侮（5种）- ToB 专用 =====
    "木多金缺": {
        "category": "相侮",
        "relation": "金克木（反向）",
        "mechanism": "木太盛反克金，金被削弱",
        "color_features": "绿色占比极高，白色/金色极少",
        "psychology": "极度固执，不尊重规则，标准缺失，自以为是",
        "manifestation": "木太硬金会受损，过度的固执无视规范",
        "three_circles": {
            "inner": "固执己见，无标准",
            "middle": "不尊重规则",
            "outer": "外人觉得无法无天",
        },
        "healing_direction": "建立边界，尊重标准",
        "color_prescription": "减少绿色，增加白色和金色",
        "toc_supported": False,  # ToB 专用
    },
    "金多火熄": {
        "category": "相侮",
        "relation": "火克金（反向）",
        "mechanism": "金太盛反克火，火被熄灭",
        "color_features": "白色/金属色占比很高，红色被压制暗淡",
        "psychology": "标准过多，热情被抑制，冷漠挑剔，缺乏喜悦",
        "manifestation": "金太多火会被熄灭，过度的标准压制热情",
        "three_circles": {
            "inner": "标准过多，无热情",
            "middle": "挑剔压抑",
            "outer": "外人觉得冷漠",
        },
        "healing_direction": "降低标准，释放热情",
        "color_prescription": "减少白色，增加红色和粉色",
        "toc_supported": False,  # ToB 专用
    },
    "火多水灼": {
        "category": "相侮",
        "relation": "水克火（反向）",
        "mechanism": "火太盛反克水，水被蒸发",
        "color_features": "红色占比极高，黑色/蓝色极少",
        "psychology": "极度急躁，智慧被蒸发，缺乏深度，冲动失控",
        "manifestation": "烈火将水分蒸发，过度的热情无视理性",
        "three_circles": {
            "inner": "极度急躁",
            "middle": "冲动失控",
            "outer": "外人觉得缺乏智慧",
        },
        "healing_direction": "降心火，补充水源",
        "color_prescription": "减少红色，增加黑色和蓝色",
        "toc_supported": False,  # ToB 专用
    },
    "水多土荡": {
        "category": "相侮",
        "relation": "土克水（反向）",
        "mechanism": "水太盛反克土，土被冲刷",
        "color_features": "黑色/蓝色占比极高，黄色被冲刷分散",
        "psychology": "极度不稳定，根基被冲刷，缺乏承载，情绪泛滥",
        "manifestation": "洪水冲垮堤坝，过度的情绪冲垮稳定",
        "three_circles": {
            "inner": "内心不稳定",
            "middle": "情绪泛滥",
            "outer": "外人觉得无根基",
        },
        "healing_direction": "建立边界，稳固根基",
        "color_prescription": "减少黑色，增加黄色和棕色",
        "toc_supported": False,  # ToB 专用
    },
    "土多木折": {
        "category": "相侮",
        "relation": "木克土（反向）",
        "mechanism": "土太盛反克木，木被压折",
        "color_features": "黄色占比极高，绿色被压迫折断",
        "psychology": "过度承担，生长被压制，固执不变，缺乏生机",
        "manifestation": "厚重土壤压制种子，过度的稳定压制成长",
        "three_circles": {
            "inner": "内心沉重",
            "middle": "过度承担",
            "outer": "外人觉得缺乏生机",
        },
        "healing_direction": "减负，释放生长空间",
        "color_prescription": "减少黄色，增加绿色和青色",
        "toc_supported": False,  # ToB 专用
    },
}


# =============================================================================
# 分类常量 (便于查询和验证)
# =============================================================================

# ToC 版支持的失衡类型列表（10种）
TOC_IMBALANCE_TYPES: List[str] = [
    # 相生太过 (5)
    "水多木漂",
    "火多土焦",
    "木多火塞",
    "土多金埋",
    "金多水浊",
    # 相乘 (5)
    "水多火灭",
    "火多金熔",
    "金多木折",
    "木多土陷",
    "土多水干",
]

# ToB 版额外支持的失衡类型（10种）
TOB_EXCLUSIVE_TYPES: List[str] = [
    # 子病犯母 (5)
    "水多金沉",
    "火多木焚",
    "土多火晦",
    "金多土虚",
    "木多水缩",
    # 相侮 (5)
    "木多金缺",
    "金多火熄",
    "火多水灼",
    "水多土荡",
    "土多木折",
]

# 按类别分组的失衡类型
IMBALANCE_CATEGORIES: Dict[str, List[str]] = {
    "相生太过": ["水多木漂", "火多土焦", "木多火塞", "土多金埋", "金多水浊"],
    "子病犯母": ["水多金沉", "火多木焚", "土多火晦", "金多土虚", "木多水缩"],
    "相乘": ["水多火灭", "火多金熔", "金多木折", "木多土陷", "土多水干"],
    "相侮": ["木多金缺", "金多火熄", "火多水灼", "水多土荡", "土多木折"],
}


# =============================================================================
# 查询函数
# =============================================================================


def get_imbalance_definition(imbalance_type: str) -> Optional[ImbalanceTypeDefinition]:
    """
    获取失衡类型完整定义

    Args:
        imbalance_type: 失衡类型名称

    Returns:
        失衡类型定义，不存在则返回 None
    """
    return IMBALANCE_TYPES.get(imbalance_type)


def is_toc_supported(imbalance_type: str) -> bool:
    """
    检查失衡类型是否被 ToC 版本支持

    Args:
        imbalance_type: 失衡类型名称

    Returns:
        True 如果 ToC 支持，否则 False
    """
    definition = get_imbalance_definition(imbalance_type)
    if definition:
        return definition.get("toc_supported", False)
    return False


def get_toc_imbalance_types() -> List[str]:
    """
    获取所有 ToC 支持的失衡类型

    Returns:
        ToC 支持的失衡类型列表
    """
    return [
        name
        for name, defn in IMBALANCE_TYPES.items()
        if defn.get("toc_supported", False)
    ]


def get_tob_imbalance_types() -> List[str]:
    """
    获取所有 ToB 专属（ToC 不支持）的失衡类型

    Returns:
        ToB 专属的失衡类型列表
    """
    return [
        name
        for name, defn in IMBALANCE_TYPES.items()
        if not defn.get("toc_supported", False)
    ]


def get_imbalances_by_category(category: str, toc_only: bool = False) -> List[str]:
    """
    按类别获取失衡类型

    Args:
        category: 类别名称（相生太过/子病犯母/相乘/相侮）
        toc_only: 是否只返回 ToC 支持的类型

    Returns:
        该类别下的失衡类型列表
    """
    types = IMBALANCE_CATEGORIES.get(category, [])
    if toc_only:
        return [t for t in types if is_toc_supported(t)]
    return types


def filter_imbalances_by_version(
    imbalances: List[str], version: Literal["toc", "tob"] = "toc"
) -> List[str]:
    """
    根据版本过滤失衡类型

    Args:
        imbalances: 待过滤的失衡类型列表
        version: "toc" 或 "tob"

    Returns:
        过滤后的失衡类型列表

    Example:
        >>> detected = ["水多火灭", "水多金沉", "火多金熔"]
        >>> filter_imbalances_by_version(detected, "toc")
        ["水多火灭", "火多金熔"]  # 水多金沉被过滤
    """
    if version == "tob":
        return imbalances

    # toc: 只保留 toc_supported 的类型
    return [imb for imb in imbalances if is_toc_supported(imb)]


def get_imbalance_category(imbalance_type: str) -> Optional[str]:
    """
    获取失衡类型的类别

    Args:
        imbalance_type: 失衡类型名称

    Returns:
        类别名称，不存在则返回 None
    """
    definition = get_imbalance_definition(imbalance_type)
    if definition:
        return definition.get("category")
    return None


def get_imbalance_list(
    version: Literal["all", "toc", "tob"] = "all", category: Optional[str] = None
) -> List[Dict]:
    """
    获取失衡类型列表（带详细信息）

    Args:
        version: "all"(全部), "toc"(仅ToC), "tob"(仅ToB)
        category: 按类别过滤，None 表示全部

    Returns:
        失衡类型详情列表
    """
    result = []

    for name, defn in IMBALANCE_TYPES.items():
        # 版本过滤
        if version == "toc" and not defn.get("toc_supported", False):
            continue
        if version == "tob" and defn.get("toc_supported", False):
            continue

        # 类别过滤
        if category and defn.get("category") != category:
            continue

        result.append(
            {
                "name": name,
                "category": defn.get("category"),
                "toc_supported": defn.get("toc_supported", False),
                "description": defn.get("manifestation", ""),
                "healing_direction": defn.get("healing_direction", ""),
            }
        )

    return result


def validate_imbalance_type(imbalance_type: str) -> tuple[bool, Optional[str]]:
    """
    验证失衡类型名称是否有效

    Args:
        imbalance_type: 失衡类型名称

    Returns:
        (是否有效, 错误信息)
    """
    if imbalance_type in IMBALANCE_TYPES:
        return True, None

    # 提供相似建议
    suggestions = [
        name
        for name in IMBALANCE_TYPES
        if imbalance_type in name or name in imbalance_type
    ]
    if suggestions:
        return False, f"未知失衡类型。您是否指: {', '.join(suggestions[:3])}?"
    return False, f"未知失衡类型: {imbalance_type}"


# =============================================================================
# 导出
# =============================================================================

__all__ = [
    # 数据
    "IMBALANCE_TYPES",
    "TOC_IMBALANCE_TYPES",
    "TOB_EXCLUSIVE_TYPES",
    "IMBALANCE_CATEGORIES",
    # 类型
    "ImbalanceTypeDefinition",
    "ThreeCirclesInterpretation",
    # 查询函数
    "get_imbalance_definition",
    "is_toc_supported",
    "get_toc_imbalance_types",
    "get_tob_imbalance_types",
    "get_imbalances_by_category",
    "filter_imbalances_by_version",
    "get_imbalance_category",
    "get_imbalance_list",
    "validate_imbalance_type",
]
