"""
形状深度解读 - 曼陀罗图形元素含义
基于五行形状理论
"""

# 形状五行映射（扩展版）
SHAPE_ELEMENTS = {
    # 木 - 生长、发展
    "长方形": "木",
    "直线": "木",
    "条形": "木",
    "竖线": "木",
    "横线": "木",
    "网格": "木",  # 修正：网格更偏向木的生长结构
    "放射状": "木",
    "树枝状": "木",
    # 火 - 能量、上升
    "三角形": "火",
    "尖角": "火",
    "星形": "火",
    "菱形": "火",
    "箭头": "火",
    "金字塔": "火",
    "火焰状": "火",
    # 土 - 稳定、承载
    "正方形": "土",
    "方形": "土",
    "矩形": "土",
    "田字格": "土",
    "十字": "土",
    "梯形": "土",
    "容器状": "土",
    # 金 - 圆满、完整
    "圆形": "金",
    "圆弧": "金",
    "弧形": "金",
    "椭圆形": "金",
    "曲线": "金",
    "环形": "金",
    "半圆": "金",
    "扇形": "金",
    # 水 - 流动、变化
    "波浪形": "水",
    "螺旋": "水",
    "不规则": "水",
    "点状": "水",
    "水滴": "水",
    "S形": "水",
    "涡旋": "水",
}

# 基础形状在三圈中的含义
SHAPE_MEANINGS = {
    "圆形": {
        "element": "金",
        "core_meaning": "圆满、完整、自我",
        "inner": "追求内在圆满，自我意识强，关注自我完整性",
        "middle": "在关系中追求和谐圆满，希望与他人建立完整连接",
        "outer": "对外展现完整自我形象，注重圆满收尾，有全局观",
        "positive": "圆满、完整、包容",
        "negative": "封闭、自恋、边界不清",
        "variations": {
            "小圆": "金的基础形态，代表小的圆满、具体目标的达成",
            "大圆": "承载更多内容，包容性强，视野开阔",
            "多层圆": "层层保护，防御机制，或层层递进的成长",
        },
    },
    "三角形": {
        "element": "火",
        "core_meaning": "向上、突破、不稳定",
        "inner": "内心有上升渴望，追求进步，但也容易焦虑",
        "middle": "在关系中积极进取，但可能给人压迫感",
        "outer": "对外展现进取心，有目标感，但也可能急功近利",
        "positive": "进取、突破、有方向",
        "negative": "冲动、不稳定、易折",
        "variations": {
            "正三角": "火向上，积极进取，事业心强",
            "倒三角": "火向下，情绪下沉，或能量内收",
            "多角星": "能量分散，多方向探索，或内心纠结",
        },
    },
    "正方形": {
        "element": "土",
        "core_meaning": "稳定、规则、约束",
        "inner": "内心追求稳定，有规则感，但可能过于保守",
        "middle": "在关系中注重界限，讲原则，但可能不够灵活",
        "outer": "对外展现可靠稳重，守规矩，但可能缺乏变通",
        "positive": "稳定、可靠、有原则",
        "negative": "固执、死板、不灵活",
        "variations": {
            "大方正": "土性强，承担多，压力大",
            "小方正": "追求小而确定的安全感",
            "多层方": "层层设防，或逐步构建安全感",
        },
    },
    "长方形": {
        "element": "木",
        "core_meaning": "生长、发展、延伸",
        "inner": "内心有成长动力，追求发展，线性思维",
        "middle": "在关系中逐步推进，循序渐进",
        "outer": "对外展现进取姿态，有计划地扩展",
        "positive": "成长、发展、有条理",
        "negative": "局限、单向、缺乏变通",
        "variations": {
            "横长": "横向发展，关注面广，或逃避深入",
            "竖长": "纵向发展，深入探索，或过于执着",
        },
    },
    "波浪形": {
        "element": "水",
        "core_meaning": "流动、变化、情绪化",
        "inner": "内心情绪波动，敏感多变，富有感受力",
        "middle": "在关系中随性而为，难以捉摸",
        "outer": "对外适应性强，但也可能缺乏定力",
        "positive": "灵活、适应、富有情感",
        "negative": "情绪化、不稳定、缺乏主见",
        "variations": {
            "大波浪": "情绪起伏大，或人生波动大",
            "小波浪": "细腻敏感，小情绪波动",
            "螺旋": "深度探索，钻牛角尖，或螺旋上升",
        },
    },
    "螺旋": {
        "element": "水",
        "core_meaning": "循环、深度、纠结",
        "inner": "内心反复思考，深入挖掘，或陷入循环",
        "middle": "在关系中螺旋式发展，需要耐心",
        "outer": "对外展现深度，但也可能过于复杂",
        "positive": "深入、持续、有深度",
        "negative": "纠结、循环、难以自拔",
        "variations": {
            "顺时针": "向外扩展，积极向上",
            "逆时针": "向内收缩，回顾反思",
            "多层螺旋": "深度探索，或多重纠结",
        },
    },
    "星形": {
        "element": "火",
        "core_meaning": "闪耀、分散、理想",
        "inner": "内心有理想主义，渴望闪耀，能量分散",
        "middle": "在关系中光芒四射，但可能忽冷忽热",
        "outer": "对外展现才华，但也可能不够聚焦",
        "positive": "才华、光芒、有梦想",
        "negative": "分散、虚荣、不稳定",
        "variations": {
            "多角星": "多方向探索，或能量分散",
            "四角星": "稳定的光芒，持续发热",
            "光芒状": "向外散发，影响力强",
        },
    },
    "十字": {
        "element": "土",
        "core_meaning": "承载、交叉、责任",
        "inner": "内心承载多，有责任感，但压力大",
        "middle": "在关系中承担连接角色，但可能不堪重负",
        "outer": "对外展现担当，但也可能承担过多",
        "positive": "承载、连接、负责任",
        "negative": "负担重、压力大、被束缚",
        "variations": {
            "等臂十字": "平衡承载，四向分担",
            "偏心十字": "某方面承担过重",
            "多线交叉": "多重责任，复杂关系",
        },
    },
    "弧形": {
        "element": "金",
        "core_meaning": "柔和、过渡、包容",
        "inner": "内心柔和，善于过渡，有耐心",
        "middle": "在关系中善于调和，圆润处事",
        "outer": "对外展现亲和力，善于沟通",
        "positive": "柔和、包容、有耐心",
        "negative": "优柔寡断、缺乏棱角",
        "variations": {
            "大弧": "大度包容，视野开阔",
            "小弧": "细腻柔和，小心翼翼",
            "波浪弧": "情绪起伏，柔韧适应",
        },
    },
    "点状": {
        "element": "水",
        "core_meaning": "开始、分散、觉察",
        "inner": "内心敏感，觉察力强，但也可能散乱",
        "middle": "在关系中多点连接，或分散注意力",
        "outer": "对外展现灵活性，但也可能缺乏重点",
        "positive": "敏锐、灵活、有觉察",
        "negative": "散乱、碎片化、缺乏聚焦",
        "variations": {
            "密集点": "焦虑、紧张、过度警觉",
            "稀疏点": "放松、随意、注意力分散",
            "规律点": "有序的节奏，规律感",
        },
    },
}

# 曼陀罗特有形状解读
MANDALA_SPECIFIC_SHAPES = {
    "小圆": {
        "element": "金",
        "meaning": "金的基础形态，小的圆满，具体目标的达成",
        "inner": "小的自我圆满，关注具体事务",
        "middle": "小的关系圆满，重视具体人际关系",
        "outer": "小的成就，具体目标的达成",
    },
    "大圆": {
        "element": "金",
        "meaning": "承载更多，包容性强，视野开阔",
        "inner": "追求大格局的内在圆满",
        "middle": "追求关系的大和谐",
        "outer": "追求事业/生活的大圆满",
    },
    "旋转圆形": {
        "element": "金",
        "meaning": "动态的金，能量流动，生生不息",
        "positive": "生生不息，循环往复，螺旋上升",
        "negative": "原地打转，难以突破，循环往复",
        "psychology": "内心追求变化中的稳定，在循环中寻找突破",
    },
    "方形几何": {
        "element": "土",
        "meaning": "规则感强，结构化思维，追求稳定",
        "positive": "有条理，有计划，脚踏实地",
        "negative": "过于死板，缺乏灵活性，墨守成规",
    },
    "凯尔特结": {
        "element": "土/水",
        "meaning": "复杂的连接，多重关系，纠缠或深度联结",
        "positive": "深度连接，多重资源，复杂但有秩序",
        "negative": "纠缠不清，关系复杂，难以理清",
    },
    "曼陀罗花": {
        "element": "火/金",
        "meaning": "绽放的自我，美丽的展现，内在力量",
        "positive": "自信绽放，美丽展现，内在力量外显",
        "negative": "虚有其表，外在包装，缺乏内涵",
    },
    "辐射状": {
        "element": "木",
        "meaning": "向外扩展，影响力，能量发散",
        "positive": "影响力强，能量充沛，向外扩展",
        "negative": "能量过度发散，中心不稳，耗散",
    },
    "同心圆": {
        "element": "金",
        "meaning": "层层保护，或层层递进的成长",
        "inner": "核心自我需要多层保护",
        "middle": "关系中的层层界限",
        "outer": "对外展现的多层形象",
    },
    "花瓣形": {
        "element": "木",
        "meaning": "绽放，生命力，女性能量",
        "positive": "生命力旺盛，美丽绽放，柔和力量",
        "negative": "过度绽放而耗损，或虚有其表",
    },
    "网格状": {
        "element": "木",
        "meaning": "结构，规划，线性思维",
        "positive": "有条理，有规划，结构清晰",
        "negative": "被框架束缚，思维僵化，缺乏灵动",
    },
}

# 形状组合解读
SHAPE_COMBINATIONS = {
    "圆形+三角形": {
        "meaning": "圆满中有突破，稳定中求发展",
        "detail": "金生火，在圆满的基础上追求上升，有目标感的整体规划",
    },
    "方形+圆形": {
        "meaning": "方圆并济，刚柔相济",
        "detail": "土生金，在规则中寻求圆满，有原则但圆融",
    },
    "波浪+螺旋": {
        "meaning": "深度情绪波动，或深层次的内在探索",
        "detail": "水+水，情绪丰富，直觉敏锐，但也容易陷入情绪",
    },
    "放射+圆形": {
        "meaning": "影响力向外扩展，自我中心化",
        "detail": "木+金，自我中心但有影响力，或向外扩展的完整自我",
    },
    "直线+曲线": {
        "meaning": "刚柔并济，理性与感性平衡",
        "detail": "木+金，有条理但圆融，理性规划但有感性表达",
    },
}

# 形状大小/数量含义
SHAPE_INTENSITY = {
    "大形状": "能量集中，影响显著，该元素特质强烈",
    "小形状": "能量分散，影响细微，或刚开始发展",
    "多形状": "能量复杂，多面向发展，或注意力分散",
    "少形状": "能量聚焦，单一面向，或发展受限",
    "整齐排列": "有序，规划性强，但也可能过于控制",
    "散乱分布": "自由，随性，但也可能缺乏条理",
    "居中": "核心关注，重要性高，能量集中",
    "靠边": "边缘化，逃避中心，或资源外放",
}


def get_shape_element(shape: str) -> str | None:
    """获取形状对应的五行元素"""
    return SHAPE_ELEMENTS.get(shape)


def get_shape_meaning(shape: str, circle: str = None) -> dict | None:
    """获取指定形状的详细含义

    Args:
        shape: 形状名称
        circle: 可选，指定三圈（inner/middle/outer）

    Returns:
        形状含义字典，如果指定circle则返回对应圈的解读
    """
    if shape not in SHAPE_MEANINGS:
        # 尝试在曼陀罗特有形状中查找
        if shape in MANDALA_SPECIFIC_SHAPES:
            meaning = MANDALA_SPECIFIC_SHAPES[shape]
            if circle and circle in meaning:
                return {"circle": circle, "meaning": meaning[circle]}
            return meaning
        return None

    meaning = SHAPE_MEANINGS[shape]

    if circle and circle in meaning:
        return {"circle": circle, "meaning": meaning[circle]}

    return meaning


def get_shape_combination_meaning(shapes: list) -> dict | None:
    """获取形状组合的含义"""
    key = "+".join(sorted(shapes))
    return SHAPE_COMBINATIONS.get(key)


def analyze_shape_distribution(shapes: list, circles: dict = None) -> dict:
    """分析形状分布

    Args:
        shapes: 形状列表
        circles: 可选，各圈的形状分布 {"inner": [...], "middle": [...], "outer": [...]}

    Returns:
        分析结果字典
    """
    element_count = {"木": 0, "火": 0, "土": 0, "金": 0, "水": 0}

    for shape in shapes:
        element = get_shape_element(shape)
        if element:
            element_count[element] += 1

    # 找出主导元素
    dominant = max(element_count, key=element_count.get)
    total = sum(element_count.values())

    result = {
        "dominant_element": dominant if element_count[dominant] > 0 else None,
        "element_distribution": element_count,
        "total_shapes": total,
    }

    # 如果有三圈信息，分析各圈特点
    if circles:
        result["circle_analysis"] = {}
        for circle_name, circle_shapes in circles.items():
            circle_elements = {}
            for shape in circle_shapes:
                elem = get_shape_element(shape)
                if elem:
                    circle_elements[elem] = circle_elements.get(elem, 0) + 1
            result["circle_analysis"][circle_name] = circle_elements

    return result


def get_recommended_shapes(element: str, purpose: str = "balance") -> list:
    """根据五行推荐形状

    Args:
        element: 目标五行元素
        purpose: 目的（balance增强/heal疗愈/ground稳定）

    Returns:
        推荐形状列表
    """
    shape_map = {
        "木": ["长方形", "直线", "放射状", "树枝状"],
        "火": ["三角形", "星形", "箭头", "火焰状"],
        "土": ["正方形", "十字", "梯形", "田字格"],
        "金": ["圆形", "圆弧", "椭圆形", "环形"],
        "水": ["波浪形", "螺旋", "点状", "S形"],
    }

    return shape_map.get(element, [])
