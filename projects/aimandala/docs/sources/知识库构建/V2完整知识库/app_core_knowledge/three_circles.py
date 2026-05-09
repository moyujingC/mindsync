"""
三环结构 - 曼陀罗解读框架
核心解读维度：内圈、中圈、外圈

三圈能量循环模型：
- 正向流动：内圈(意识) → 中圈(能量) → 外圈(物质) → 反馈 → 内圈
- 反向流动：当正向受阻时，外界压力倒灌或情绪反噬
- 圈层内部：每圈内部也有五行生克微循环
"""

from typing import TypedDict, List, Dict

# =============================================================================
# TypedDict 类型定义
# =============================================================================


class CircleInterpretation(TypedDict):
    """圈层解读详情"""

    description: str
    focus: List[str]


class Circle(TypedDict):
    """圈层类型定义"""

    name: str
    alias: List[str]
    dimension: str
    time: str
    aspect: str
    interpretation: CircleInterpretation
    resonance_state: str
    psychological_level: str


# =============================================================================
# 三环结构定义
# =============================================================================

THREE_CIRCLES: Dict[str, Circle] = {
    "内圈": {
        "name": "内圈（里圈）",
        "alias": ["里圈", "中心", "内核"],
        "dimension": "意识",
        "time": "过去",
        "aspect": "灵",
        "interpretation": {
            "description": "自我关系、原生家庭、过往伤痛、自我价值",
            "focus": [
                "对自己的看法和自我认知",
                "原生家庭带来的创伤或滋养",
                "过往伤痛的疗愈状态",
                "自我价值感的强弱",
            ],
        },
        "resonance_state": "意识共振状态",
        "psychological_level": "认知层面",
    },
    "中圈": {
        "name": "中圈",
        "alias": ["中环", "中间层"],
        "dimension": "能量",
        "time": "现在",
        "aspect": "心",
        "interpretation": {
            "description": "亲密关系、爱人/闺蜜/亲朋",
            "focus": [
                "当前情感状态",
                "与亲密他人的关系质量",
                "情感表达方式",
                "情绪管理能力",
            ],
        },
        "resonance_state": "能量共振状态",
        "psychological_level": "情绪层面",
    },
    "外圈": {
        "name": "外圈",
        "alias": ["外环", "外层", "边缘"],
        "dimension": "物质",
        "time": "未来",
        "aspect": "身",
        "interpretation": {
            "description": "与世界的关系、物质/事业、身体/财富",
            "focus": [
                "对外在世界的态度",
                "事业发展方向",
                "身体健康状况",
                "财富观念和能力",
            ],
        },
        "resonance_state": "物质共振状态",
        "psychological_level": "具体呈现层面",
    },
}

# ==================== 三圈能量流动模型 ====================

CIRCLE_ENERGY_FLOW = {
    "正向流动": {
        "description": "意识 → 能量 → 物质的顺畅转化",
        "path": "内圈 → 中圈 → 外圈 → 反馈 → 内圈",
        "quality": "healthy",
        "indicators": [
            "三圈颜色和谐统一或自然过渡",
            "内圈有颜色表达（非大量留白）",
            "外圈有适当表达（非完全留白）",
        ],
        "interpretation": "内在意识能够顺畅转化为情感表达，进而显化为外在结果，形成正向循环",
    },
    "反向流动": {
        "description": "外界压力倒灌或情绪反噬自我",
        "paths": {
            "外圈→中圈": {
                "name": "外界压力倒灌",
                "pattern": "外圈颜色过于浓重或杂乱",
                "effect": "工作或环境压力导致情绪失控",
                "example": "外圈大片红色 → 中圈焦虑不安",
            },
            "中圈→内圈": {
                "name": "情绪反噬自我",
                "pattern": "中圈颜色深且杂，内圈留白或浅色",
                "effect": "关系创伤内化为自我否定",
                "example": "中圈冲突色 → 内圈自我怀疑",
            },
            "外圈→内圈": {
                "name": "物质与意识脱节",
                "pattern": "外圈丰富但内圈空虚",
                "effect": "追求外在成就但内心空虚",
                "example": "外圈五颜六色，内圈留白",
            },
        },
        "quality": "blocked",
        "interpretation": "能量流动受阻，某圈能量过强倒灌或跳过正常流动路径",
    },
    "跳跃流动": {
        "description": "跳过中间圈层直接表达",
        "patterns": {
            "内圈→外圈": {
                "name": "意识直接显化",
                "pattern": "内圈和外圈丰富，中圈留白",
                "effect": "想法直接变为行动，缺乏情感缓冲",
                "risk": "冲动行事，情绪管理弱",
            }
        },
        "quality": "unstable",
        "interpretation": "能量流动不经过正常中间环节，表达直接但可能缺乏深度",
    },
}

# 三圈能量流向详细定义
ENERGY_FLOW_PATHS = {
    "内圈→中圈": {
        "name": "意识显化为情绪",
        "nature": "认知影响情感",
        "description": "内在信念、自我认知如何塑造当前的情感状态",
        "generating": {  # 相生
            "木→火": "成长心态催生热情活力",
            "火→土": "热情投入转化为稳定关系",
            "土→金": "稳定滋养圆满和谐",
            "金→水": "圆满内省孕育智慧",
            "水→木": "智慧滋养新的成长",
        },
        "restraining": {  # 相克
            "木→土": "成长需求克制稳定关系",
            "土→水": "稳定压抑情感流动",
            "水→火": "冷静克制热情表达",
            "火→金": "热情破坏圆满和谐",
            "金→木": "完美主义限制成长",
        },
        "indicators": {
            "healthy": "内圈颜色自然过渡到中圈，无突兀变化",
            "blocked": "内圈颜色浓但中圈留白，或内圈与中圈颜色冲突",
        },
    },
    "中圈→外圈": {
        "name": "情绪显化为行动",
        "nature": "情感影响行为",
        "description": "当前情感状态如何影响外在行为和结果",
        "generating": {
            "木→火": "成长型情感推动积极行动",
            "火→土": "热情转化为事业成就",
            "土→金": "稳定情感带来圆满结果",
            "金→水": "完美追求导向深度探索",
            "水→木": "智慧沉淀促进持续成长",
        },
        "restraining": {
            "木→土": "成长冲动破坏稳定环境",
            "土→水": "固执限制资源流动",
            "水→火": "恐惧抑制行动热情",
            "火→金": "急躁破坏完美结果",
            "金→木": "完美要求阻碍行动",
        },
        "indicators": {
            "healthy": "中圈能量顺畅流向外圈，颜色协调",
            "blocked": "中圈丰富但外圈留白，或中圈与外圈颜色冲突",
        },
    },
    "外圈→内圈": {
        "name": "经验反馈内化",
        "nature": "结果重塑认知",
        "description": "外在结果和经验如何反馈并重塑自我认知",
        "generating": {
            "木→火": "外在成长激发内在热情",
            "火→土": "成就带来内在稳定",
            "土→金": "物质基础孕育自我圆满",
            "金→水": "圆满结果带来内在智慧",
            "水→木": "深度体验滋养内在成长",
        },
        "restraining": {
            "木→土": "外在忙碌破坏内在稳定",
            "土→水": "环境压力压抑内在流动",
            "水→火": "外部恐惧熄灭内在热情",
            "火→金": "外界冲突破坏内在和谐",
            "金→木": "外在完美要求限制内在成长",
        },
        "indicators": {
            "healthy": "外在成就支持内在成长，形成正反馈",
            "blocked": "外在成功但内心空虚，或外在失败导致内心崩溃",
        },
    },
}

# 能量流动质量评估标准
ENERGY_FLOW_QUALITY = {
    "通畅度": {
        "description": "能量在各圈流动的顺畅程度",
        "levels": {
            "high": "意识-情绪-行为高度一致，想到即能做到",
            "medium": "偶有阻滞，但基本能够自我调节",
            "low": "内心想A，做B，得C，严重不一致",
        },
    },
    "速度": {
        "description": "从意识到显化的转化速度",
        "levels": {
            "fast": "想法迅速转化为行动，执行力强",
            "moderate": "适当思考后行动，平衡考虑与执行",
            "slow": "过度思考导致行动瘫痪，拖延严重",
        },
    },
    "强度": {
        "description": "各圈能量的饱满程度",
        "levels": {
            "balanced": "三圈均有适度能量分布，无过度或不足",
            "inner_strong": "内圈过强，可能陷入过度自省",
            "middle_strong": "中圈过强，情绪主导理性",
            "outer_strong": "外圈过强，追求外在成就忽视内心",
            "weak": "某圈能量明显不足，需要滋养",
        },
    },
    "方向": {
        "description": "整体流动方向",
        "patterns": {
            "forward": "内→中→外正向流动，健康表达",
            "backward": "外→中→内倒灌，压力内化",
            "circular": "三圈形成循环，但可能原地打转",
            "scattered": "各圈独立无关联，能量分散",
        },
    },
}

# 三环一致性分析
CIRCLE_COHERENCE_PATTERNS = {
    "表里如一": {
        "pattern": "内圈和外圈颜色完全一致",
        "interpretation": "内外一致，真实坦诚，不伪装",
        "suggestion": "保持这份真实，同时学会适当保护自己",
    },
    "心门关闭": {
        "pattern": "外圈留白多，但里圈或中圈涂的颜色3个以上",
        "interpretation": "对外界不热情，但内心丰富，有防备心理",
        "suggestion": "尝试逐步开放自己，找到安全的表达方式",
    },
    "表里不一": {
        "pattern": "内圈颜色深，外圈颜色浅/白",
        "interpretation": "内心丰富但外在表现保守，或内心困扰但外表坚强",
        "suggestion": "探索内外不一致的原因，寻求更好的整合",
    },
    "外强中干": {
        "pattern": "外圈颜色丰富，内圈留白或颜色少",
        "interpretation": "注重外在形象，但内心空虚或缺乏安全感",
        "suggestion": "关注内在成长，建立扎实的自我基础",
    },
}


def get_circle_interpretation(circle_name: str) -> dict:
    """获取指定圈层的解读框架"""
    for key, value in THREE_CIRCLES.items():
        if circle_name in [key] + value.get("alias", []):
            return value
    return None


def analyze_circle_coherence(
    inner_colors: list, middle_colors: list, outer_colors: list
) -> dict:
    """
    分析三环一致性
    """
    patterns = []

    # 检查表里如一
    if set(inner_colors) == set(outer_colors) and len(inner_colors) > 0:
        patterns.append("表里如一")

    # 检查心门关闭
    if len(outer_colors) <= 1 and len(inner_colors) >= 3:
        patterns.append("心门关闭")

    # 检查表里不一
    if len(inner_colors) > len(outer_colors):
        patterns.append("表里不一")

    # 检查外强中干
    if len(outer_colors) > len(inner_colors) and len(inner_colors) <= 2:
        patterns.append("外强中干")

    return {
        "detected_patterns": patterns,
        "inner_colors": inner_colors,
        "middle_colors": middle_colors,
        "outer_colors": outer_colors,
        "details": [CIRCLE_COHERENCE_PATTERNS.get(p) for p in patterns],
    }


def analyze_energy_flow(
    inner_elements: list, middle_elements: list, outer_elements: list
) -> dict:
    """
    分析三圈能量流动状态

    Args:
        inner_elements: 内圈五行元素列表
        middle_elements: 中圈五行元素列表
        outer_elements: 外圈五行元素列表

    Returns:
        能量流动分析结果
    """
    result = {
        "flow_direction": None,
        "flow_quality": None,
        "path_analysis": {},
        "blockages": [],
        "recommendations": [],
    }

    # 检查是否有元素
    has_inner = len(inner_elements) > 0
    has_middle = len(middle_elements) > 0
    has_outer = len(outer_elements) > 0

    # 判断流动方向
    if has_inner and has_middle and has_outer:
        result["flow_direction"] = "forward"
        result["flow_quality"] = "healthy"
    elif has_outer and not has_middle and has_inner:
        result["flow_direction"] = "jump"
        result["flow_quality"] = "unstable"
        result["blockages"].append("中圈能量薄弱，内圈直接跳跃到外圈")
    elif has_outer and has_middle and not has_inner:
        result["flow_direction"] = "backward"
        result["flow_quality"] = "blocked"
        result["blockages"].append("外圈能量倒灌，缺乏内在根基")
    elif not has_outer and has_middle and has_inner:
        result["flow_direction"] = "incomplete"
        result["flow_quality"] = "blocked"
        result["blockages"].append("能量无法显化为外在结果")

    # 分析各路径
    GENERATING_CHAIN = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
    RESTRAINING_CHAIN = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}

    # 内圈→中圈分析
    if has_inner and has_middle:
        inner_elem = inner_elements[0] if inner_elements else None
        middle_elem = middle_elements[0] if middle_elements else None

        if inner_elem and middle_elem:
            if GENERATING_CHAIN.get(inner_elem) == middle_elem:
                result["path_analysis"]["内圈→中圈"] = {
                    "status": "generating",
                    "description": f"{inner_elem}生{middle_elem}，意识顺畅显化为情绪",
                }
            elif RESTRAINING_CHAIN.get(inner_elem) == middle_elem:
                result["path_analysis"]["内圈→中圈"] = {
                    "status": "restraining",
                    "description": f"{inner_elem}克{middle_elem}，认知克制情感表达",
                }
            else:
                result["path_analysis"]["内圈→中圈"] = {
                    "status": "neutral",
                    "description": f"{inner_elem}与{middle_elem}无明显生克",
                }

    # 中圈→外圈分析
    if has_middle and has_outer:
        middle_elem = middle_elements[0] if middle_elements else None
        outer_elem = outer_elements[0] if outer_elements else None

        if middle_elem and outer_elem:
            if GENERATING_CHAIN.get(middle_elem) == outer_elem:
                result["path_analysis"]["中圈→外圈"] = {
                    "status": "generating",
                    "description": f"{middle_elem}生{outer_elem}，情绪顺畅显化为行动",
                }
            elif RESTRAINING_CHAIN.get(middle_elem) == outer_elem:
                result["path_analysis"]["中圈→外圈"] = {
                    "status": "restraining",
                    "description": f"{middle_elem}克{outer_elem}，情感克制外在表达",
                }
            else:
                result["path_analysis"]["中圈→外圈"] = {
                    "status": "neutral",
                    "description": f"{middle_elem}与{outer_elem}无明显生克",
                }

    # 生成建议
    if result["blockages"]:
        result["recommendations"].append("重点疏通能量阻滞的圈层")
    if result["flow_quality"] == "healthy":
        result["recommendations"].append("保持当前能量流动状态，继续深化")

    return result


def evaluate_energy_quality(
    inner_area: float, middle_area: float, outer_area: float
) -> dict:
    """
    评估三圈能量质量

    Args:
        inner_area: 内圈涂色面积比例（0-1）
        middle_area: 中圈涂色面积比例（0-1）
        outer_area: 外圈涂色面积比例（0-1）

    Returns:
        能量质量评估结果
    """
    result = {
        "intensity": {},
        "balance": None,
        "dominant_circle": None,
        "weak_circle": None,
        "interpretation": "",
    }

    # 评估各圈强度
    def get_intensity_level(area):
        if area < 0.2:
            return "不足"
        elif area < 0.5:
            return "适中"
        elif area < 0.8:
            return "饱满"
        else:
            return "过盛"

    result["intensity"] = {
        "内圈": get_intensity_level(inner_area),
        "中圈": get_intensity_level(middle_area),
        "外圈": get_intensity_level(outer_area),
    }

    # 判断主导圈和弱势圈
    areas = {"内圈": inner_area, "中圈": middle_area, "外圈": outer_area}
    result["dominant_circle"] = max(areas, key=areas.get)
    result["weak_circle"] = min(areas, key=areas.get)

    # 评估平衡性
    max_area = max(areas.values())
    min_area = min(areas.values())
    if max_area - min_area < 0.3:
        result["balance"] = "balanced"
        result["interpretation"] = "三圈能量分布较为均衡，内外协调"
    elif max_area > 0.7 and min_area < 0.2:
        result["balance"] = "unbalanced"
        result["interpretation"] = (
            f"{result['dominant_circle']}能量过盛，{result['weak_circle']}能量不足，需要调整"
        )
    else:
        result["balance"] = "moderate"
        result["interpretation"] = "三圈能量有一定差异，但整体尚可接受"

    return result


def get_energy_flow_interpretation(
    flow_path: str, from_element: str, to_element: str
) -> dict:
    """
    获取特定能量流动的详细解读

    Args:
        flow_path: 流动路径，如 "内圈→中圈"
        from_element: 起始元素
        to_element: 目标元素

    Returns:
        详细解读字典
    """
    path_info = ENERGY_FLOW_PATHS.get(flow_path, {})

    if not path_info:
        return {"error": "未知的流动路径"}

    # 判断生克关系
    GENERATING_CHAIN = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
    RESTRAINING_CHAIN = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}

    if GENERATING_CHAIN.get(from_element) == to_element:
        relation = "相生"
        description = path_info.get("generating", {}).get(
            f"{from_element}→{to_element}", ""
        )
    elif RESTRAINING_CHAIN.get(from_element) == to_element:
        relation = "相克"
        description = path_info.get("restraining", {}).get(
            f"{from_element}→{to_element}", ""
        )
    else:
        relation = "中性"
        description = f"{from_element}与{to_element}无直接生克关系"

    return {
        "path": flow_path,
        "from": from_element,
        "to": to_element,
        "relation": relation,
        "description": description,
        "nature": path_info.get("nature", ""),
        "path_description": path_info.get("description", ""),
    }
