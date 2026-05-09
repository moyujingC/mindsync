"""
曼陀罗解读方法论 - 系统化解读步骤
基于《曼陀罗解读手册》的标准解读流程

核心流程（四步法）：
1. 直断（快速筛查）- 识别画面最突出的整体特征
2. 颜色分析（逐圈详细）- 深浅、面积、五行映射
3. 形状分析（整体+触发式）- 整体特征+冲突时细分析
4. 生克分析（圈级关系）- 圈内、圈间五行生克与失衡诊断
"""

from typing import List, Dict, Tuple, Optional
from .five_elements import (
    get_generating_interpretation,
    get_restraining_interpretation,
    get_element_by_color,
)
from .shape_meanings import get_shape_element
from .color_meanings import get_color_meaning
from .direct_judgments import (
    analyze_whitespace,
    match_direct_judgments,
)
from .three_circles import (
    analyze_energy_flow,
    evaluate_energy_quality,
)

# ==================== 解读步骤框架（四步法）====================

INTERPRETATION_STEPS = {
    "step1_direct_judgment": {
        "name": "第一步：直断（快速筛查）",
        "description": "基于画面整体特征的直接判断，快速抓住最突出的信息，打开案主心防",
        "actions": [
            "观察画面整体特征（涂色饱满度、颜色深浅、留白比例）",
            "识别明显的直断模式（9种）",
            "快速判断整体情绪基调（焦虑/平静/压抑/积极等）",
            "作为解读的切入点和重点提示",
        ],
        "direct_judgments": {
            "涂色很满深色为主": "焦虑担忧的情绪，除了焦虑还有恐惧",
            "整体泛白颜色偏淡": "做事无力量感，喜欢躺平",
            "思虑过重喜好操心": "大面积黄色，把心思放在别人身上",
            "喜欢分享开口来财": "明显有蓝色+绿色，喉轮+心轮敞开",
            "入不敷出热情奔放": "外圈有成片红色（相邻色非绿色），燃烧消耗",
            "关注外表过手财神": "外圈颜色五颜六色、零零碎碎、花边",
            "表里如一": "内圈和外圈颜色完全一致",
            "不想说啥无声沉默": "整张留白较多",
            "心门关闭": "外圈留白多，但里圈或中圈涂的颜色3个以上",
        },
        "color_depth_indicators": {
            "深色": "力量感强，情绪浓烈，可能压抑（太过）",
            "浅色": "力量感弱，情绪柔和，可能逃避（不足）",
            "混合": "情绪复杂，内外不一致，正在整合",
        },
        "whitespace_indicators": {
            "大量留白": "保留空间，可能缺乏表达欲或对世界失望",
            "少量留白": "充分表达，可能追求完美或焦虑",
            "无留白": "完全填满，可能有控制欲或焦虑",
        },
        "note": "直断用于快速打开局面，后续需结合详细分析验证和深化",
    },
    "step2_color_analysis": {
        "name": "第二步：颜色分析（逐圈详细）",
        "description": "逐圈分析颜色分布、深浅和面积，确定五行属性及状态",
        "actions": [
            "识别内圈、中圈、外圈的主要颜色",
            "判断每种颜色的深浅（深/中/浅）→ 对应太过/正常/不足",
            "分析各颜色面积比例",
            "颜色五行映射",
            "记录异常颜色分布（如外圈成片红色等）",
        ],
        "color_intensity_mapping": {
            "深色（太过）": "浓重、饱和度高 → 能量过度集中，可能淤堵",
            "中色（正常）": "适中、均匀 → 能量平衡健康",
            "浅色（不足）": "浅淡、饱和度低 → 能量偏弱，需要滋养",
        },
        "principles": {
            "color_priority": "颜色是主要分析维度，视觉最直接",
            "shade_matters": "同一种颜色，深浅不同含义截然不同",
            "area_matters": "面积比例决定该五行的影响力大小",
            "circle_context": "同一颜色在不同圈含义不同",
        },
        "output": "每圈的颜色分布、深浅状态、五行属性、面积比例",
    },
    "step3_shape_analysis": {
        "name": "第三步：形状分析（整体+触发式）",
        "description": "整体观察形状特征，在颜色与形状五行冲突时进行细分析",
        "actions": [
            "整体观察画面形状特征（圆润/尖锐/规则/散乱）",
            "识别主要形状及其五行属性",
            "触发式细分析：当颜色五行与形状五行明显冲突时",
            "辅助验证颜色分析的结论",
        ],
        "overall_shape_features": {
            "圆润为主": "待人接物圆融，情商较高，沟通顺畅",
            "尖锐为主": "有棱角，可能急躁、固执或自我保护强",
            "规则整齐": "追求完美，自我要求高，可能有控制欲",
            "散乱不规则": "心神不宁，思绪混乱，情绪不稳定",
        },
        "triggered_analysis": {
            "description": "当颜色与形状五行冲突时，分析内在张力",
            "color_represents": "意图/情绪/内在需求",
            "shape_represents": "行为模式/外在表现/习惯",
            "conflict_examples": {
                "红色(火) + 水滴状(水)": "情绪想要热情，但行为趋于收敛",
                "蓝色(水) + 三角(火)": "内心平静，但行为急躁冲动",
                "绿色(木) + 圆形(金)": "想要成长，但被规则/圆满束缚",
            },
        },
        "note": "形状是辅助维度，颜色分析为主；不强制每个色块都分析形状冲突",
    },
    "step4_five_elements_relations": {
        "name": "第四步：生克分析（圈级关系）",
        "description": "基于圈内的五行分布，分析生克关系、能量流向和失衡类型",
        "actions": [
            "分析每圈内部的五行生克关系",
            "分析圈与圈之间的五行流向（内圈→中圈→外圈）",
            "识别五行失衡的具体类型（相乘/相侮/生多为克）",
            "综合判断20种失衡类型",
            "给出调整建议和疗愈方向",
        ],
        "principles": {
            "generating": {
                "nature": "滋养、助推，但过犹不及",
                "effect": "助力、提携、给予、帮助",
                "note": "生得太过，对母体是消耗（如土生金过多，土被耗虚）",
            },
            "restraining": {
                "nature": "规整、梳理，必要但需适度",
                "effect": "制约、制衡、压制、管教",
                "note": "克得太过会造成伤害，克不动则反受其害",
            },
        },
        "imbalance_types": {
            "相乘（过度克制）": "如木过度克土（木多土陷）",
            "相侮（反向克制）": "如木太强反克金（木多金缺）",
            "生多为克": "生的方面积远大于被生的方（3倍以上）",
        },
        "three_circles_flow": {
            "内圈→中圈": "内在意识如何影响当下能量",
            "中圈→外圈": "当下能量如何显化为外在结果",
            "整体循环": "三圈能量是否形成正向循环",
        },
    },
}


# ==================== 颜色+形状综合判断 ====================


def determine_element_from_color_shape(color: str, shape: Optional[str] = None) -> Dict:
    """
    综合颜色和形状判断五行属性

    Args:
        color: 颜色名称
        shape: 形状名称（可选）

    Returns:
        {
            "element": "五行元素",
            "confidence": "high/medium/low",
            "color_element": "颜色对应的五行",
            "shape_element": "形状对应的五行（如有）",
            "reasoning": "判断理由"
        }
    """
    # 获取颜色的五行
    color_info = get_element_by_color(color)
    color_element = color_info["element"] if color_info else None

    # 获取形状的五行
    shape_element = get_shape_element(shape) if shape else None

    # 综合判断
    if color_element and shape_element:
        if color_element == shape_element:
            return {
                "element": color_element,
                "confidence": "high",
                "color_element": color_element,
                "shape_element": shape_element,
                "reasoning": f"颜色和形状都对应{color_element}，高度一致",
            }
        else:
            # 颜色为主，形状为辅
            return {
                "element": color_element,
                "confidence": "medium",
                "color_element": color_element,
                "shape_element": shape_element,
                "reasoning": f"颜色对应{color_element}，形状对应{shape_element}，以颜色为主进行判断",
            }
    elif color_element:
        return {
            "element": color_element,
            "confidence": "medium",
            "color_element": color_element,
            "shape_element": None,
            "reasoning": f"根据颜色判断为{color_element}，无形状信息辅助",
        }
    elif shape_element:
        return {
            "element": shape_element,
            "confidence": "low",
            "color_element": None,
            "shape_element": shape_element,
            "reasoning": f"无法识别颜色，根据形状判断为{shape_element}，建议结合颜色重新判断",
        }
    else:
        return {
            "element": None,
            "confidence": "none",
            "color_element": None,
            "shape_element": None,
            "reasoning": "无法从颜色和形状判断五行属性",
        }


def analyze_color_shape_combination(color: str, shape: str, circle: str) -> Dict:
    """
    分析颜色+形状组合的特殊含义

    例如：
    - 红色（火）+ 圆形（金）→ 火克金，热情与圆满的冲突/融合
    - 绿色（木）+ 三角形（火）→ 木生火，生长与上升的协同

    Args:
        color: 颜色名称
        shape: 形状名称
        circle: 圈层（内圈/中圈/外圈）

    Returns:
        组合解读字典
    """
    color_info = get_color_meaning(color)
    shape_elem = get_shape_element(shape)
    color_elem = color_info.get("element") if color_info else None

    result = {
        "color": color,
        "shape": shape,
        "color_element": color_elem,
        "shape_element": shape_elem,
        "circle": circle,
        "relationship": None,
        "interpretation": "",
    }

    if not color_elem or not shape_elem:
        result["interpretation"] = "无法完成组合分析，缺少颜色或形状的五行信息"
        return result

    # 判断生克关系
    GENERATING_CHAIN = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
    RESTRAINING_CHAIN = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}

    if color_elem == shape_elem:
        result["relationship"] = "同元素强化"
        result["interpretation"] = (
            f"{color_elem}的颜色和形状相互强化，{color_elem}特质非常明显"
        )
    elif GENERATING_CHAIN.get(color_elem) == shape_elem:
        result["relationship"] = "颜色生形状"
        result["interpretation"] = (
            f"{color_elem}（颜色）生{shape_elem}（形状），能量正向流动"
        )
    elif GENERATING_CHAIN.get(shape_elem) == color_elem:
        result["relationship"] = "形状生颜色"
        result["interpretation"] = (
            f"{shape_elem}（形状）生{color_elem}（颜色），能量正向流动"
        )
    elif RESTRAINING_CHAIN.get(color_elem) == shape_elem:
        result["relationship"] = "颜色克形状"
        result["interpretation"] = (
            f"{color_elem}（颜色）克{shape_elem}（形状），存在内在张力"
        )
    elif RESTRAINING_CHAIN.get(shape_elem) == color_elem:
        result["relationship"] = "形状克颜色"
        result["interpretation"] = (
            f"{shape_elem}（形状）克{color_elem}（颜色），存在内在张力"
        )

    return result


def resolve_color_shape_conflict(
    color: str,
    shape: str,
    color_element: str,
    shape_element: str,
    relationship: str,
    color_area: float = 0.3,
    color_intensity: str = "中",
    shape_size: str = "中",
) -> Dict:
    """
    解决颜色与形状生克关系冲突的综合判断

    核心逻辑：
    - 颜色代表：意图/情绪/内在需求
    - 形状代表：行为模式/外在表现/习惯
    - 冲突意味着：想做的和实际做的不一致

    Args:
        color: 颜色名称
        shape: 形状名称
        color_element: 颜色对应的五行
        shape_element: 形状对应的五行
        relationship: 生克关系类型（颜色克形状/形状克颜色）
        color_area: 颜色面积比例（0-1）
        color_intensity: 颜色深浅（深/中/浅）
        shape_size: 形状大小（大/中/小）

    Returns:
        综合判断结果
    """
    result = {
        "dominant_factor": None,  # 主导因素：color/shape/balanced
        "dominant_element": None,  # 主导的五行
        "inner_conflict": False,  # 是否存在内在冲突
        "interpretation": "",
        "psychology": "",
        "recommendation": "",
    }

    # 计算权重
    color_weight = color_area
    if color_intensity == "深":
        color_weight *= 1.3  # 深色权重增加
    elif color_intensity == "浅":
        color_weight *= 0.7  # 浅色权重降低

    shape_weight = 0.3  # 基础权重
    if shape_size == "大":
        shape_weight = 0.5
    elif shape_size == "小":
        shape_weight = 0.15

    if relationship == "颜色克形状":
        result["inner_conflict"] = True
        result["psychology"] = "情绪/意图想要表达，但被行为模式限制"

        if color_weight > shape_weight:
            result["dominant_factor"] = "color"
            result["dominant_element"] = color_element
            result["interpretation"] = (
                f"{color}（{color_element}）的情绪强烈，想要突破表达，"
                f"但{shape}（{shape_element}）的行为模式形成了限制。"
                f"虽然外在表现受约束，但内在情绪占据主导，"
                f"可能会有'想要改变但做不到'的挫败感。"
            )
            result["recommendation"] = (
                f"先处理{color_element}的情绪，再逐步调整{shape_element}的行为模式"
            )
        else:
            result["dominant_factor"] = "shape"
            result["dominant_element"] = shape_element
            result["interpretation"] = (
                f"虽然有{color}（{color_element}）的内在冲动，"
                f"但{shape}（{shape_element}）的行为惯性更强大。"
                f"长期的行为模式压制了情绪表达，"
                f"形成了'心口不一'或'知行分离'的状态。"
            )
            result["recommendation"] = (
                f"从调整{shape_element}的行为习惯入手，逐步释放{color_element}的情绪"
            )

    elif relationship == "形状克颜色":
        result["inner_conflict"] = True
        result["psychology"] = "行为模式压制了真实情绪的表达"

        if shape_weight > color_weight:
            result["dominant_factor"] = "shape"
            result["dominant_element"] = shape_element
            result["interpretation"] = (
                f"{shape}（{shape_element}）的行为模式已经成为惯性，"
                f"即使内心{color}（{color_element}）有不同的需求，"
                f"也会被习惯性的行为所覆盖。"
                f"呈现出'身不由己'或'控制不住自己'的状态。"
            )
            result["recommendation"] = (
                f"重点调整{shape_element}的行为模式，建立新的习惯来替代"
            )
        else:
            result["dominant_factor"] = "color"
            result["dominant_element"] = color_element
            result["interpretation"] = (
                f"虽然{shape}（{shape_element}）的行为模式在起作用，"
                f"但{color}（{color_element}）的内在需求更强烈。"
                f"内心正在酝酿改变，行为模式即将被打破，"
                f"处于'想要改变但还在挣扎'的过渡期。"
            )
            result["recommendation"] = (
                f"强化{color_element}的内在动力，支持行为模式的转变"
            )

    else:
        # 非冲突关系
        result["inner_conflict"] = False
        result["dominant_factor"] = "balanced"
        result["dominant_element"] = color_element  # 颜色为主
        result["interpretation"] = "颜色与形状和谐一致，内外统一"
        result["recommendation"] = "保持当前状态，继续深化"

    return result


# ==================== 生克判断辅助函数 ====================


def analyze_five_elements_relationship(elements_in_circle: List[str]) -> List[Dict]:
    """
    分析一个圈内的五行关系

    Args:
        elements_in_circle: 圈内按顺序排列的五行元素，如 ["木", "火", "土"]

    Returns:
        关系列表
    """
    relationships = []

    # 生成关系链
    GENERATING_CHAIN = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
    RESTRAINING_CHAIN = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}

    for i in range(len(elements_in_circle)):
        current = elements_in_circle[i]
        next_elem = elements_in_circle[(i + 1) % len(elements_in_circle)]

        # 检查相生
        if GENERATING_CHAIN.get(current) == next_elem:
            relationships.append(
                {
                    "from": current,
                    "to": next_elem,
                    "type": "相生",
                    "description": f"{current}生{next_elem}",
                }
            )

        # 检查相克
        elif RESTRAINING_CHAIN.get(current) == next_elem:
            relationships.append(
                {
                    "from": current,
                    "to": next_elem,
                    "type": "相克",
                    "description": f"{current}克{next_elem}",
                }
            )

    return relationships


def analyze_enveloping_relationship(
    center_element: str,
    surround_element: str,
    center_area: float = 0.2,
    surround_area: float = 0.5,
) -> Optional[Dict]:
    """
    分析圈内包裹关系（中心元素被外围元素包围）

    包裹是相邻关系的一种特殊情况：
    - 空间上：一个元素位于圈内中心，被另一个元素包围
    - 能量上：外围元素对中心元素形成生克影响

    例如：内圈中心是红色（火），外围一圈是蓝色（水）
         → 水包裹火，水克火，中心能量被抑制

    Args:
        center_element: 中心元素（被包围的）
        surround_element: 外围元素（包围者）
        center_area: 中心元素面积比例
        surround_area: 外围元素面积比例

    Returns:
        包裹关系描述，如果没有显著关系则返回None
    """
    # 生成和克制链
    GENERATING_CHAIN = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
    RESTRAINING_CHAIN = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}

    # 只有外围面积明显大于中心时才构成有效包裹（至少2倍）
    if surround_area < center_area * 2:
        return None

    # 判断生克关系
    relation_type = None
    description = ""
    effect = ""

    # 外围生中心（外围滋养中心）
    if GENERATING_CHAIN.get(surround_element) == center_element:
        relation_type = "外围生中心"
        description = f"{surround_element}（外围）包裹并生{center_element}（中心）"
        effect = "外围能量滋养中心，环境支持核心发展"

    # 外围克中心（外围克制中心）
    elif RESTRAINING_CHAIN.get(surround_element) == center_element:
        relation_type = "外围克中心"
        description = f"{surround_element}（外围）包裹并克{center_element}（中心）"
        effect = "外围能量压制中心，环境约束核心表达"

    # 中心生外围（中心滋养外围，但被包裹导致消耗）
    elif GENERATING_CHAIN.get(center_element) == surround_element:
        relation_type = "中心生外围"
        description = f"{center_element}（中心）被{surround_element}（外围）包裹并生之"
        effect = "中心能量被外围消耗，核心付出滋养环境"

    # 中心克外围（中心克制外围，但被包裹形成对抗）
    elif RESTRAINING_CHAIN.get(center_element) == surround_element:
        relation_type = "中心克外围"
        description = f"{center_element}（中心）被{surround_element}（外围）包裹并克之"
        effect = "中心想要改变外围，但被包围形成内在对抗"

    else:
        # 无直接生克关系
        return None

    return {
        "spatial_type": "包裹关系",
        "relation_type": relation_type,
        "description": description,
        "effect": effect,
        "strength": "strong" if surround_area > center_area * 3 else "moderate",
        "center_element": center_element,
        "surround_element": surround_element,
        "area_ratio": surround_area / center_area if center_area > 0 else float("inf"),
    }


def analyze_circle_with_positions(elements_with_position: List[Dict]) -> Dict:
    """
    分析圈内元素的相邻和包裹关系（带位置信息）

    Args:
        elements_with_position: 圈内元素列表，每个元素包含位置和面积信息
            [
                {"element": "火", "position": "center", "area": 0.2},
                {"element": "水", "position": "surround", "area": 0.5},
                {"element": "木", "position": "edge", "area": 0.3}
            ]
            position可选值: "center"(中心), "surround"(包围), "edge"(边缘)

    Returns:
        包含相邻关系和包裹关系的分析结果
    """
    # 提取元素列表（用于相邻分析）
    elements = [e["element"] for e in elements_with_position]

    # 分析相邻关系
    adjacent_relations = analyze_five_elements_relationship(elements)

    # 分析包裹关系
    enveloping_relations = []

    # 找出中心元素和外围元素
    center_elems = [e for e in elements_with_position if e.get("position") == "center"]
    surround_elems = [
        e for e in elements_with_position if e.get("position") == "surround"
    ]

    # 分析每个中心-外围配对
    for center in center_elems:
        for surround in surround_elems:
            relation = analyze_enveloping_relationship(
                center_element=center["element"],
                surround_element=surround["element"],
                center_area=center.get("area", 0.2),
                surround_area=surround.get("area", 0.5),
            )
            if relation:
                enveloping_relations.append(relation)

    return {
        "adjacent_relations": adjacent_relations,
        "enveloping_relations": enveloping_relations,
        "dominant_pattern": _determine_dominant_pattern(
            adjacent_relations, enveloping_relations
        ),
    }


def _determine_dominant_pattern(adjacent: List[Dict], enveloping: List[Dict]) -> str:
    """
    判断圈内主导关系模式

    Returns:
        主导模式描述
    """
    if not adjacent and not enveloping:
        return "无明显生克关系"

    # 如果有包裹关系，通常更显著
    if enveloping:
        strong_enveloping = [e for e in enveloping if e.get("strength") == "strong"]
        if strong_enveloping:
            return f"包裹主导：{strong_enveloping[0]['description']}"
        else:
            return f"包裹影响：{enveloping[0]['description']}"

    # 否则看相邻关系
    if adjacent:
        return f"相邻流动：{len(adjacent)}组生克关系"

    return "平衡状态"


def determine_proportion_type(area_ratios: Dict[str, float], relation_type: str) -> str:
    """
    根据面积比例确定关系类型

    Args:
        area_ratios: 各元素面积比例，如 {"木": 0.4, "火": 0.2}
        relation_type: "generating" | "restraining"

    Returns:
        比例类型
    """
    if len(area_ratios) != 2:
        return "unknown"

    items = list(area_ratios.items())
    elem1, area1 = items[0]
    elem2, area2 = items[1]

    ratio = area1 / area2 if area2 > 0 else float("inf")

    if 0.7 <= ratio <= 1.5:
        return "balanced"
    elif ratio > 1.5:
        return (
            "generator_strong" if relation_type == "generating" else "restrainer_strong"
        )
    else:  # ratio < 0.7
        return (
            "generated_strong" if relation_type == "generating" else "restrained_strong"
        )


def check_abnormal_relations(elements_with_areas: Dict[str, float]) -> List[Dict]:
    """
    检查反常的五行关系

    Args:
        elements_with_areas: 元素及其面积，如 {"木": 0.5, "火": 0.1}

    Returns:
        反常关系列表
    """
    abnormalities = []

    # 生多为克检查
    GENERATING_PAIRS = [
        ("木", "火"),
        ("火", "土"),
        ("土", "金"),
        ("金", "水"),
        ("水", "木"),
    ]

    for generator, generated in GENERATING_PAIRS:
        if generator in elements_with_areas and generated in elements_with_areas:
            gen_area = elements_with_areas[generator]
            gened_area = elements_with_areas[generated]

            # 如果生的方面积远大于被生的方（3倍以上）
            if gen_area > gened_area * 3:
                abnormalities.append(
                    {
                        "type": "生多为克",
                        "relation": f"{generator}生{generated}",
                        "description": f"{generator}过多反而成为对{generated}的克制",
                        "severity": "high" if gen_area > gened_area * 5 else "medium",
                    }
                )

    return abnormalities


# ==================== 完整解读流程（四步法）====================


def interpret_mandala(
    inner_colors: List[Tuple[str, float]],  # [(颜色, 面积比例), ...]
    middle_colors: List[Tuple[str, float]],
    outer_colors: List[Tuple[str, float]],
    inner_shapes: Optional[List[str]] = None,
    middle_shapes: Optional[List[str]] = None,
    outer_shapes: Optional[List[str]] = None,
    whitespace_ratio: float = 0.0,  # 整体留白比例
    observed_features: Optional[List[str]] = None,  # 观察到的特征列表（用于直断）
) -> Dict:
    """
    完整的曼陀罗解读流程（四步法）

    流程：
    1. 直断（快速筛查）
    2. 颜色分析（逐圈详细）
    3. 形状分析（整体+触发式）
    4. 生克分析（圈级关系）

    Args:
        inner_colors: 内圈颜色及面积
        middle_colors: 中圈颜色及面积
        outer_colors: 外圈颜色及面积
        inner_shapes: 内圈形状列表（可选）
        middle_shapes: 中圈形状列表（可选）
        outer_shapes: 外圈形状列表（可选）
        whitespace_ratio: 整体留白比例（0-1）
        observed_features: 观察到的特征列表（用于直断匹配）

    Returns:
        完整解读报告
    """

    report = {"steps": {}}

    # ============== Step 1: 直断（快速筛查）==============
    direct_judgments = []

    # 基于留白比例分析
    whitespace_analysis = analyze_whitespace(whitespace_ratio)

    # 基于特征匹配直断
    if observed_features:
        matched_judgments = match_direct_judgments(observed_features)
        direct_judgments.extend(matched_judgments)

    report["steps"]["direct_judgment"] = {
        "whitespace_analysis": whitespace_analysis,
        "matched_judgments": direct_judgments,
        "key_insights": [j["meaning"] for j in direct_judgments[:3]],  # 最重要的3个洞察
    }

    # ============== Step 2: 颜色分析（逐圈详细）==============
    def analyze_circle_colors(colors_with_area, circle_name):
        """分析一圈的颜色分布"""
        color_analysis = []
        for color, area in colors_with_area:
            # 获取颜色含义
            color_info = get_color_meaning(color)

            # 判断深浅（简化逻辑，实际可能需要更复杂的判断）
            intensity = "中"  # 默认中等
            if "深" in color or "暗" in color:
                intensity = "深"
            elif "浅" in color or "淡" in color:
                intensity = "浅"

            # 映射到状态
            if intensity == "深":
                state = "太过"
            elif intensity == "浅":
                state = "不足"
            else:
                state = "正常"

            # 获取五行属性
            element_info = get_element_by_color(color)
            element = element_info.get("element") if element_info else None

            color_analysis.append(
                {
                    "color": color,
                    "area": area,
                    "intensity": intensity,
                    "state": state,
                    "element": element,
                    "core_meaning": (
                        color_info.get("core_meaning") if color_info else None
                    ),
                }
            )

        return color_analysis

    inner_color_analysis = analyze_circle_colors(inner_colors, "内圈")
    middle_color_analysis = analyze_circle_colors(middle_colors, "中圈")
    outer_color_analysis = analyze_circle_colors(outer_colors, "外圈")

    report["steps"]["color_analysis"] = {
        "内圈": inner_color_analysis,
        "中圈": middle_color_analysis,
        "外圈": outer_color_analysis,
    }

    # ============== Step 3: 形状分析（整体+触发式）==============
    shape_analysis = {"overall_features": [], "triggered_analyses": []}

    # 收集所有形状进行整体观察
    all_shapes = []
    if inner_shapes:
        all_shapes.extend(inner_shapes)
    if middle_shapes:
        all_shapes.extend(middle_shapes)
    if outer_shapes:
        all_shapes.extend(outer_shapes)

    # 整体形状特征判断（简化示例）
    if all_shapes:
        shape_elements = [get_shape_element(s) for s in all_shapes if s]
        if (
            "火" in shape_elements
            and len([e for e in shape_elements if e == "火"]) > len(shape_elements) / 2
        ):
            shape_analysis["overall_features"].append(
                "以尖锐形状为主，可能有急躁或自我保护的倾向"
            )
        elif (
            "金" in shape_elements
            and len([e for e in shape_elements if e == "金"]) > len(shape_elements) / 2
        ):
            shape_analysis["overall_features"].append(
                "以圆润形状为主，待人接物较为圆融"
            )

    # 触发式细分析：颜色与形状五行冲突时
    def check_color_shape_conflicts(colors_analysis, shapes, circle_name):
        """检查颜色与形状的冲突"""
        conflicts = []
        if not shapes:
            return conflicts

        for i, color_info in enumerate(colors_analysis):
            if i >= len(shapes) or not shapes[i]:
                continue

            shape = shapes[i]
            color_element = color_info.get("element")
            shape_element = get_shape_element(shape)

            if not color_element or not shape_element:
                continue

            # 检查是否冲突（相克关系）
            RESTRAINING_CHAIN = {
                "木": "土",
                "土": "水",
                "水": "火",
                "火": "金",
                "金": "木",
            }

            if RESTRAINING_CHAIN.get(color_element) == shape_element:
                # 颜色克形状
                conflicts.append(
                    {
                        "circle": circle_name,
                        "color": color_info["color"],
                        "shape": shape,
                        "color_element": color_element,
                        "shape_element": shape_element,
                        "relationship": "颜色克形状",
                        "interpretation": f"{color_info['color']}({color_element})的情绪想要表达，但被{shape}({shape_element})的行为模式限制",
                    }
                )
            elif RESTRAINING_CHAIN.get(shape_element) == color_element:
                # 形状克颜色
                conflicts.append(
                    {
                        "circle": circle_name,
                        "color": color_info["color"],
                        "shape": shape,
                        "color_element": color_element,
                        "shape_element": shape_element,
                        "relationship": "形状克颜色",
                        "interpretation": f"{shape}({shape_element})的行为模式压制了{color_info['color']}({color_element})的真实情绪",
                    }
                )

        return conflicts

    # 检查各圈的冲突
    inner_conflicts = check_color_shape_conflicts(
        inner_color_analysis, inner_shapes, "内圈"
    )
    middle_conflicts = check_color_shape_conflicts(
        middle_color_analysis, middle_shapes, "中圈"
    )
    outer_conflicts = check_color_shape_conflicts(
        outer_color_analysis, outer_shapes, "外圈"
    )

    shape_analysis["triggered_analyses"] = (
        inner_conflicts + middle_conflicts + outer_conflicts
    )

    report["steps"]["shape_analysis"] = shape_analysis

    # ============== Step 4: 生克分析（圈级关系）==============
    # 汇总各圈元素
    def get_elements_from_analysis(color_analysis):
        """从颜色分析中提取五行元素列表"""
        return [c["element"] for c in color_analysis if c["element"]]

    inner_elements = get_elements_from_analysis(inner_color_analysis)
    middle_elements = get_elements_from_analysis(middle_color_analysis)
    outer_elements = get_elements_from_analysis(outer_color_analysis)

    # 分析每圈的生克关系
    circle_relations = {}
    for circle_name, elements in [
        ("内圈", inner_elements),
        ("中圈", middle_elements),
        ("外圈", outer_elements),
    ]:
        relationships = analyze_five_elements_relationship(elements)

        # 添加详细解读
        detailed_relations = []
        for rel in relationships:
            if rel["type"] == "相生":
                interp = get_generating_interpretation(
                    rel["from"],
                    rel["to"],
                    proportion="balanced",
                    circle=circle_name.replace("圈", "").lower(),
                )
            else:  # 相克
                interp = get_restraining_interpretation(
                    rel["from"],
                    rel["to"],
                    proportion="balanced",
                    circle=circle_name.replace("圈", "").lower(),
                )
            detailed_relations.append({**rel, "interpretation": interp})

        circle_relations[circle_name] = detailed_relations

    # 失衡类型诊断
    all_elements_areas = {}
    for analysis in [inner_color_analysis, middle_color_analysis, outer_color_analysis]:
        for item in analysis:
            elem = item["element"]
            if elem:
                all_elements_areas[elem] = (
                    all_elements_areas.get(elem, 0) + item["area"]
                )

    abnormalities = check_abnormal_relations(all_elements_areas)

    report["steps"]["five_elements_relations"] = {
        "circle_relations": circle_relations,
        "imbalance_diagnosis": {
            "abnormal_relations": abnormalities,
            "overall_balance": "balanced" if len(abnormalities) == 0 else "unbalanced",
        },
    }

    return report


# ==================== 实用工具函数 ====================


def get_interpretation_guide() -> Dict:
    """获取解读指南"""
    return {"steps": INTERPRETATION_STEPS}


def get_step_guide(step_name: str) -> Optional[Dict]:
    """
    获取指定步骤的详细指南

    Args:
        step_name: 步骤名称，如 "step1_element_identification"

    Returns:
        步骤指南字典
    """
    return INTERPRETATION_STEPS.get(step_name)


# ==================== 三圈能量流动评估 ====================


def assess_energy_flow_quality(
    inner_colors: List[Tuple[str, float]],
    middle_colors: List[Tuple[str, float]],
    outer_colors: List[Tuple[str, float]],
    inner_elements: List[str],
    middle_elements: List[str],
    outer_elements: List[str],
) -> Dict:
    """
    综合评估三圈能量流动质量

    Args:
        inner_colors: 内圈颜色及面积 [(颜色, 面积), ...]
        middle_colors: 中圈颜色及面积
        outer_colors: 外圈颜色及面积
        inner_elements: 内圈五行元素
        middle_elements: 中圈五行元素
        outer_elements: 外圈五行元素

    Returns:
        能量流动质量评估结果
    """
    result = {
        "flow_assessment": {},
        "quality_metrics": {},
        "blockages": [],
        "recommendations": [],
    }

    # 1. 计算各圈总面积
    inner_area = sum(area for _, area in inner_colors) if inner_colors else 0
    middle_area = sum(area for _, area in middle_colors) if middle_colors else 0
    outer_area = sum(area for _, area in outer_colors) if outer_colors else 0

    # 2. 评估能量强度分布
    quality = evaluate_energy_quality(inner_area, middle_area, outer_area)
    result["quality_metrics"] = {
        "intensity": quality.get("intensity", {}),
        "balance": quality.get("balance"),
        "dominant_circle": quality.get("dominant_circle"),
        "weak_circle": quality.get("weak_circle"),
    }

    # 3. 分析能量流动路径
    flow_analysis = analyze_energy_flow(inner_elements, middle_elements, outer_elements)
    result["flow_assessment"] = {
        "direction": flow_analysis.get("flow_direction"),
        "quality": flow_analysis.get("flow_quality"),
        "paths": flow_analysis.get("path_analysis", {}),
    }

    # 4. 检测阻滞点
    blockages = []

    # 检查内圈→中圈阻滞
    if inner_elements and not middle_elements:
        blockages.append(
            {
                "location": "内圈→中圈",
                "type": "能量无法显化为情绪",
                "interpretation": "内在意识丰富但情感表达受阻，可能过度理性化或情感隔离",
            }
        )

    # 检查中圈→外圈阻滞
    if middle_elements and not outer_elements:
        blockages.append(
            {
                "location": "中圈→外圈",
                "type": "情绪无法转化为行动",
                "interpretation": "情感丰富但缺乏外在表达，想得多做得少，行动力不足",
            }
        )

    # 检查外圈倒灌
    if outer_area > 0.6 and inner_area < 0.3:
        blockages.append(
            {
                "location": "外圈→内圈",
                "type": "外界压力倒灌",
                "interpretation": "外在世界压力影响内在稳定，可能过度在意他人评价",
            }
        )

    # 检查整体强度不平衡
    if quality.get("balance") == "unbalanced":
        dominant = quality.get("dominant_circle")
        weak = quality.get("weak_circle")
        blockages.append(
            {
                "location": "整体",
                "type": f"{dominant}过盛，{weak}不足",
                "interpretation": f"能量过度集中于{dominant}，{weak}需要滋养和发展",
            }
        )

    result["blockages"] = blockages

    # 5. 生成综合建议
    recommendations = []

    if flow_analysis.get("flow_quality") == "healthy":
        recommendations.append("✓ 能量流动整体健康，继续保持当前状态")
    else:
        recommendations.append("• 重点疏通能量阻滞的环节，恢复自然流动")

    if quality.get("weak_circle"):
        weak = quality.get("weak_circle")
        recommendations.append(f"• 加强{weak}的能量表达，可通过绘画疗愈针对性补充")

    # 根据主导圈给出建议
    dominant = quality.get("dominant_circle")
    if dominant == "内圈":
        recommendations.append("• 内圈能量过盛：适当增加外在行动，将思考转化为实践")
    elif dominant == "中圈":
        recommendations.append("• 中圈能量过盛：关注情绪管理，避免情绪化决策")
    elif dominant == "外圈":
        recommendations.append("• 外圈能量过盛：回归内在，建立稳固的内在基础")

    result["recommendations"] = recommendations

    return result


def get_flow_based_interpretation(flow_quality: Dict) -> str:
    """
    基于能量流动质量生成解读文本

    Args:
        flow_quality: assess_energy_flow_quality 的返回结果

    Returns:
        解读文本
    """
    interpretations = []

    # 流动方向解读
    direction = flow_quality.get("flow_assessment", {}).get("direction")
    if direction == "forward":
        interpretations.append(
            "您的能量流动整体顺畅，内在意识能够自然地转化为情感表达，进而显化为外在行动。"
        )
    elif direction == "backward":
        interpretations.append(
            "当前存在外界压力倒灌的情况，外在环境的影响可能超过内在自我，需要注意建立边界。"
        )
    elif direction == "jump":
        interpretations.append(
            "您的想法常常直接转化为行动，这种跳跃式的能量流动让您执行力强，但也可能缺乏情感缓冲。"
        )

    # 质量评估解读
    balance = flow_quality.get("quality_metrics", {}).get("balance")
    if balance == "balanced":
        interpretations.append(
            "三圈能量分布均衡，内外协调，是一位能够平衡自我、关系与世界的人。"
        )
    elif balance == "unbalanced":
        dominant = flow_quality.get("quality_metrics", {}).get("dominant_circle")
        weak = flow_quality.get("quality_metrics", {}).get("weak_circle")
        interpretations.append(
            f"能量分布存在不平衡，{dominant}较为突出而{weak}相对薄弱，建议关注{weak}的发展。"
        )

    # 阻滞点解读
    blockages = flow_quality.get("blockages", [])
    if blockages:
        interpretations.append("\n**需要关注的能量卡点：**")
        for b in blockages:
            interpretations.append(f"• {b['location']}：{b['interpretation']}")

    # 建议
    recommendations = flow_quality.get("recommendations", [])
    if recommendations:
        interpretations.append("\n**调整建议：**")
        for r in recommendations:
            interpretations.append(r)

    return "\n".join(interpretations)
