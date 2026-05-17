"""
知识库查询引擎 - 统一查询接口

功能:
1. 封装所有知识库查询逻辑
2. 支持主题特化查询降级（主题特化→通用解读）
3. 批量查询接口（一次获取所有需要的数据）
4. 缓存机制优化性能
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from functools import lru_cache

# 直接从子模块导入，避免循环导入

from .three_circles import (
    get_circle_interpretation,
    analyze_energy_flow,
)

from .color_meanings import (
    get_color_meaning,
    get_color_detailed_interpretation,
)


from .themes import (
    get_theme_config,
    get_theme_color_interpretation,
    get_healing_prescription,
    list_themes,
)

# 导入失衡类型定义 (SSOT)
from .imbalance_types import (
    get_imbalance_definition,
    filter_imbalances_by_version,
    get_imbalance_list,
)

# 导入工具函数
from .utils import FallbackChain


@dataclass
class QueryResult:
    """查询结果包装器"""

    data: Any
    found: bool = True
    fallback_used: bool = False
    source: str = "primary"  # primary, fallback, cache

    @classmethod
    def not_found(cls, message: str = "未找到") -> "QueryResult":
        """创建未找到结果"""
        return cls(data=message, found=False, fallback_used=True, source="none")

    @classmethod
    def from_fallback(cls, data: Any) -> "QueryResult":
        """创建降级结果"""
        return cls(data=data, fallback_used=True, source="fallback")

    @classmethod
    def cached(cls, data: Any) -> "QueryResult":
        """创建缓存结果"""
        return cls(data=data, source="cache")


class KnowledgeQueryEngine:
    """
    知识库查询引擎

    提供统一的知识库查询接口，支持降级策略和缓存
    """

    def __init__(self, enable_cache: bool = True, version: str = "toc"):
        """
        初始化查询引擎

        Args:
            enable_cache: 是否启用缓存
            version: 版本模式 "toc" 或 "tob"，影响失衡类型识别范围
        """
        self.enable_cache = enable_cache
        self.version = version
        self._fallback_chain = FallbackChain(cache_enabled=enable_cache)

    # ============ 颜色相关查询 ============

    def get_color_meaning(
        self, color: str, element: Optional[str] = None, theme: str = "general"
    ) -> QueryResult:
        """
        获取颜色含义

        降级策略: 主题特化 → 通用含义 → 基础五行含义

        Args:
            color: 颜色名称
            element: 五行元素（可选）
            theme: 主题

        Returns:
            QueryResult: 查询结果
        """
        cache_key = f"color:{color}:{element}:{theme}"

        # 定义查询源
        sources = []

        # 1. 主题特化解读
        if theme != "general":
            sources.append(
                (
                    lambda: get_theme_color_interpretation(theme, color, element or ""),
                    "theme",
                    False,
                )
            )

        # 2. 通用颜色含义
        sources.append((lambda: get_color_meaning(color), "general", False))

        # 3. 元素基础含义（降级）
        if element:
            basic_meanings = {
                "木": "生长、舒展、生发",
                "火": "热情、活力、光明",
                "土": "稳定、包容、承载",
                "金": "收敛、清晰、决断",
                "水": "智慧、流动、深邃",
            }
            sources.append(
                (lambda: basic_meanings.get(element, "未知元素"), "fallback", True)
            )

        # 执行降级查询
        result, source, is_fallback = self._fallback_chain.query(cache_key, *sources)

        if result is None:
            return QueryResult.not_found("暂无解读")

        return QueryResult(data=result, fallback_used=is_fallback, source=source)

    def get_color_detailed(
        self, color: str, element: Optional[str] = None
    ) -> QueryResult:
        """
        获取颜色详细解读

        Args:
            color: 颜色名称
            element: 五行元素

        Returns:
            QueryResult: 详细解读
        """
        try:
            detail = get_color_detailed_interpretation(color, element)
            return QueryResult(detail, found=bool(detail))
        except Exception as e:
            return QueryResult(f"查询失败: {str(e)}", found=False)

    # ============ 三环相关查询 ============

    def get_circle_interpretation(
        self, circle: str, dominant_element: str, theme: str = "general"
    ) -> QueryResult:
        """
        获取圈的解读

        Args:
            circle: 圈名称（内圈/中圈/外圈）
            dominant_element: 主导元素
            theme: 主题

        Returns:
            QueryResult: 解读结果
        """
        cache_key = f"circle:{circle}:{dominant_element}:{theme}"

        # 定义查询源
        sources = [
            # 1. 标准解读
            (
                lambda: get_circle_interpretation(circle, dominant_element),
                "primary",
                False,
            ),
        ]

        # 2. 元素特性构建基础解读（降级）
        element_traits = {
            "木": "生长、发展、拓展",
            "火": "热情、表达、活跃",
            "土": "稳定、滋养、平衡",
            "金": "收敛、精炼、清晰",
            "水": "流动、智慧、深度",
        }
        circle_names = {"内圈": "核心自我", "中圈": "情感关系", "外圈": "外部适应"}
        base_interp = f"{circle_names.get(circle, circle)}呈现{element_traits.get(dominant_element, dominant_element)}特质"
        sources.append((lambda: base_interp, "fallback", True))

        # 执行降级查询
        result, source, is_fallback = self._fallback_chain.query(cache_key, *sources)

        if result is None:
            return QueryResult.not_found("暂无解读")

        return QueryResult(data=result, fallback_used=is_fallback, source=source)

    def analyze_energy_flow(
        self, inner_element: str, middle_element: str, outer_element: str
    ) -> QueryResult:
        """
        分析圈间能量流动

        Args:
            inner_element: 内圈主导元素
            middle_element: 中圈主导元素
            outer_element: 外圈主导元素

        Returns:
            QueryResult: 能量流动分析
        """
        try:
            flow = analyze_energy_flow(inner_element, middle_element, outer_element)
            return QueryResult(flow, source="primary")
        except Exception as e:
            return QueryResult(f"分析失败: {str(e)}", found=False)

    # ============ 失衡类型查询 ============

    def identify_imbalances(
        self, color_analysis: Dict, circle_elements: Dict
    ) -> List[str]:
        """
        识别失衡类型

        根据颜色分布和圈元素识别可能的失衡类型

        Args:
            color_analysis: 颜色分析结果
            circle_elements: 圈元素分布

        Returns:
            List[str]: 识别出的失衡类型列表
        """
        imbalances = []

        # 提取元素占比
        element_props = {}
        for color, data in color_analysis.items():
            if isinstance(data, dict):
                element = data.get("element")
                prop = data.get("proportion", 0)
            else:
                element = data
                prop = 0.2  # 默认值

            if element:
                element_props[element] = element_props.get(element, 0) + prop

        # 检查极端比例
        for element, prop in element_props.items():
            if prop > 0.5:  # 某元素超过50%
                # 根据五行关系推断失衡
                if element == "水":
                    imbalances.extend(["水多木漂", "水多火灭", "水多金沉", "水多土荡"])
                elif element == "火":
                    imbalances.extend(["火多土焦", "火多金熔", "火多木焚", "火多水灼"])
                elif element == "木":
                    imbalances.extend(["木多火塞", "木多土陷", "木多水缩", "木多金缺"])
                elif element == "土":
                    imbalances.extend(["土多金埋", "土多火晦", "土多水干", "土多木折"])
                elif element == "金":
                    imbalances.extend(["金多水浊", "金多火熄", "金多土虚", "金多木折"])

        # 去重并根据版本过滤
        unique_imbalances = list(dict.fromkeys(imbalances))
        filtered_imbalances = filter_imbalances_by_version(
            unique_imbalances, self.version
        )
        return filtered_imbalances[:3]

    def get_imbalance_detail(self, imbalance_type: str) -> QueryResult:
        """
        获取失衡类型详细解读

        Args:
            imbalance_type: 失衡类型名称

        Returns:
            QueryResult: 详细解读
        """
        definition = get_imbalance_definition(imbalance_type)
        if definition:
            return QueryResult(
                {
                    "type": imbalance_type,
                    "category": definition.get("category"),
                    "description": definition.get("manifestation"),
                    "manifestations": definition.get("psychology", "").split("，")[:3],
                    "healing_direction": definition.get("healing_direction"),
                    "toc_supported": definition.get("toc_supported", False),
                }
            )

        return QueryResult(None, found=False)

    # ============ 疗愈方案查询 ============

    def get_healing_plan(
        self, imbalance_type: str, theme: str = "general"
    ) -> QueryResult:
        """
        获取疗愈方案

        Args:
            imbalance_type: 失衡类型
            theme: 主题

        Returns:
            QueryResult: 疗愈方案
        """
        cache_key = f"healing:{imbalance_type}:{theme}"

        # 定义查询源
        sources = []

        # 1. 主题特化疗愈
        if theme != "general":
            sources.append(
                (
                    lambda: get_healing_prescription(theme, imbalance_type),
                    "theme",
                    False,
                )
            )

        # 2. 通用疗愈方案（降级）
        def get_default_plan():
            direction = self._get_healing_direction(imbalance_type)
            return {
                "imbalance": imbalance_type,
                "direction": direction,
                "daily_practices": [
                    "每日冥想15分钟，关注呼吸",
                    "记录情绪日记，觉察能量变化",
                    "选择对应颜色的物品或服饰",
                ],
                "weekly_focus": [
                    "第一周：觉察当前能量状态",
                    "第二周：引入平衡元素的活动",
                    "第三周：巩固新的能量模式",
                ],
            }

        sources.append((get_default_plan, "fallback", True))

        # 执行降级查询
        result, source, is_fallback = self._fallback_chain.query(cache_key, *sources)

        if result is None:
            return QueryResult.not_found("暂无疗愈方案")

        return QueryResult(data=result, fallback_used=is_fallback, source=source)

    # ============ 批量查询接口 ============

    def batch_query(
        self, colors: List[str], circles: List[str], theme: str = "general"
    ) -> Dict[str, Any]:
        """
        批量查询接口

        一次获取所有需要的知识库数据

        Args:
            colors: 颜色列表
            circles: 圈列表
            theme: 主题

        Returns:
            Dict: 批量查询结果
        """
        results = {
            "color_meanings": {},
            "circle_interpretations": {},
            "theme_config": None,
        }

        # 查询颜色含义
        for color in colors:
            result = self.get_color_meaning(color, theme=theme)
            results["color_meanings"][color] = result.data

        # 查询圈解读（简化版）
        for circle in circles:
            # 使用默认元素
            result = self.get_circle_interpretation(circle, "土", theme)
            results["circle_interpretations"][circle] = result.data

        # 查询主题配置
        if theme != "general":
            try:
                theme_config = get_theme_config(theme)
                results["theme_config"] = theme_config
            except Exception:
                pass

        return results

    # ============ 列表查询 ============

    def list_themes(self) -> List[Dict]:
        """
        获取可用主题列表

        Returns:
            List[Dict]: 主题列表
        """
        try:
            themes = list_themes()
            return [{"id": t, "name": t} for t in themes]
        except Exception:
            # 返回默认主题列表
            return [
                {"id": "general", "name": "通用解读"},
                {"id": "career", "name": "事业发展"},
                {"id": "relationship", "name": "情感关系"},
                {"id": "health", "name": "身体健康"},
                {"id": "growth", "name": "个人成长"},
            ]

    def list_imbalances(self, version: str = None) -> List[Dict]:
        """
        获取失衡类型列表

        Args:
            version: 版本过滤 "toc"/"tob"/None(全部)

        Returns:
            List[Dict]: 失衡类型列表
        """
        use_version = version or self.version
        return get_imbalance_list(version=use_version)

    # ============ 缓存管理 ============

    def clear_cache(self):
        """清空缓存"""
        self._fallback_chain.clear_cache()

    def get_cache_stats(self) -> Dict:
        """获取缓存统计"""
        return self._fallback_chain.get_cache_stats()


# ============ 便捷函数 ============


@lru_cache(maxsize=128)
def query_color_meaning(
    color: str, element: Optional[str] = None, theme: str = "general"
) -> str:
    """
    便捷函数：查询颜色含义（带缓存）

    Args:
        color: 颜色名称
        element: 五行元素（可选）
        theme: 主题

    Returns:
        颜色含义文本

    Note:
        使用 lru_cache 缓存结果，最多缓存 128 个不同参数组合的结果
    """
    engine = KnowledgeQueryEngine()
    result = engine.get_color_meaning(color, element, theme)
    return result.data if result.found else "暂无解读"


@lru_cache(maxsize=128)
def query_circle_interpretation(
    circle: str, dominant_element: str, theme: str = "general"
) -> str:
    """
    便捷函数：查询圈解读（带缓存）

    Args:
        circle: 圈名称
        dominant_element: 主导元素
        theme: 主题

    Returns:
        圈解读文本

    Note:
        使用 lru_cache 缓存结果，最多缓存 128 个不同参数组合的结果
    """
    engine = KnowledgeQueryEngine()
    result = engine.get_circle_interpretation(circle, dominant_element, theme)
    return result.data if result.found else "暂无解读"


def identify_imbalance_types(
    color_analysis: Dict, circle_elements: Dict, version: str = "toc"
) -> List[str]:
    """
    便捷函数：识别失衡类型

    Args:
        color_analysis: 颜色分析结果
        circle_elements: 圈元素分布
        version: 版本模式 "toc" 或 "tob"

    Returns:
        失衡类型列表
    """
    engine = KnowledgeQueryEngine(version=version)
    return engine.identify_imbalances(color_analysis, circle_elements)
