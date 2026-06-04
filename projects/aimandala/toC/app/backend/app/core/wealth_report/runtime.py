"""Native wealth report routing backed by generated prompt packs."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.core.mandala_interpretation_agent.wealth_prompt_pack_builder import (
    WealthPromptPackBuilder,
)


SEMANTIC_ROUTE_RULES: dict[str, list[list[list[str]]]] = {
    "outer_red_or_fire_excess": [
        [["外圈", "外围", "边缘", "outer"], ["红", "火", "热", "橙"]]
    ],
    "weak_fire_many": [
        [["弱火", "火弱", "淡红", "粉色", "粉红", "浅红", "玫红"]]
    ],
    "metal_excess": [
        [["金多", "金性"]],
        [["白色", "留白", "空白", "浅色", "灰色"], ["多", "明显", "大片", "大量", "主要", "边界"]],
    ],
    "weak_or_fragmented_earth": [
        [["土弱", "土零散", "不成片"]],
        [["黄色", "棕色", "咖色", "褐色", "土"], ["零散", "分散", "碎", "不成片", "断开"]],
    ],
    "water_fire_conflict": [
        [["水火", "水火相冲", "冲突"]],
        [["蓝色", "水"], ["红色", "粉色", "火"], ["冲突", "拉扯", "对比", "交错"]],
    ],
    "rootless_wood": [
        [["木无根", "无根"]],
        [["绿色", "叶子", "枝条", "木"], ["漂", "无根", "断开", "缺少根基"]],
    ],
    "fragmented_white_or_metal_cut": [
        [["白色", "留白", "浅色", "金"], ["割裂", "截断", "分割", "分隔", "切开"]],
    ],
    "outer_world_closed_or_blank": [
        [["外圈", "外围", "边缘", "outer"], ["留白", "空白", "浅色", "浅色背景", "未填满", "表达弱", "单一"]],
    ],
    "inner_contracted_outer_strong": [
        [["内圈", "里圈", "inner"], ["收缩", "紧凑", "集中"], ["外圈", "外围", "边缘", "outer"]],
    ],
    "middle_tangled_relationship_pull": [
        [["中圈", "中间", "middle"], ["缠绕", "拉扯", "断裂", "卷曲", "打结", "交错"]],
    ],
    "outer_boundary_broken": [
        [["外圈", "外围", "边缘", "边界", "outer"], ["缺口", "破损", "断裂", "漏空", "不完整"]],
    ],
    "outer_boundary_thick_closed": [
        [["外圈", "外围", "边缘", "边界", "outer"], ["边界", "边框", "边界线"], ["闭合", "完整", "厚重", "框定", "保护"]],
    ],
    "fragmented_dots_scattered_energy": [
        [["碎点", "小点", "点缀", "零散"]],
        [["能量", "方向", "目标", "颜色", "图案"], ["分散", "零散", "散", "杂乱"]],
    ],
    "center_clear_outer_weak": [
        [["中心", "内圈", "inner"], ["清晰", "稳定", "聚焦", "焦点"], ["外圈", "外围", "边缘", "outer"], ["留白", "空白", "浅色", "弱", "单一", "简单"]],
    ],
    "heavy_overfilled_composition": [
        [["厚重", "过满", "填满", "压迫", "密集", "拥挤", "负担"]],
    ],
    "color_blocks_split": [
        [["色块", "颜色", "区域", "图案"], ["分割", "分区", "分隔", "交替", "对比"]],
    ],
}


ROUTE_TABLE: tuple[dict[str, Any], ...] = (
    {
        "signal_id": "visual.outer_red_or_fire_excess",
        "candidate_clauses": ("wealth.emotional_spending", "wealth.low_action"),
        "candidate_modules": ("wealth.emotion_spending_protective_habits", "wealth.body_fear_action"),
        "report_boundary": "只能说可能存在外放、消耗或情绪带动消费，不能直接断言用户现实漏财。",
    },
    {
        "signal_id": "visual.weak_fire_many",
        "candidate_clauses": ("wealth.approval_driven_earning", "wealth.emotional_spending"),
        "candidate_modules": ("wealth.deservingness_self_worth", "wealth.emotion_spending_protective_habits"),
        "report_boundary": "适合表达渴望被看见、被认可或被情绪影响，不能写成固定人格结论。",
    },
    {
        "signal_id": "visual.metal_excess",
        "candidate_clauses": ("wealth.low_deservingness", "wealth.approval_driven_earning"),
        "candidate_modules": ("wealth.deservingness_self_worth", "wealth.career_value_exchange"),
        "report_boundary": "适合表达标准、评判和证明压力，不能否定用户努力和现实目标。",
    },
    {
        "signal_id": "visual.weak_or_fragmented_earth",
        "candidate_clauses": ("wealth.low_capacity", "wealth.scarcity_and_insecurity"),
        "candidate_modules": ("wealth.safety_scarcity_control", "wealth.body_fear_action"),
        "report_boundary": "只能说承接、稳定和资源容器可能需要加强，不能预测存款或财富结果。",
    },
    {
        "signal_id": "visual.water_fire_conflict",
        "candidate_clauses": ("wealth.low_action", "wealth.emotional_spending", "wealth.scarcity_and_insecurity"),
        "candidate_modules": (
            "wealth.body_fear_action",
            "wealth.emotion_spending_protective_habits",
            "wealth.safety_scarcity_control",
        ),
        "report_boundary": "适合表达热情与恐惧、行动与情绪之间的拉扯，不能写成医学或心理诊断。",
    },
    {
        "signal_id": "visual.rootless_wood",
        "candidate_clauses": ("wealth.low_action", "wealth.low_capacity"),
        "candidate_modules": ("wealth.body_fear_action", "wealth.passion_needs_abundance"),
        "report_boundary": "适合表达成长动力有但滋养不足，不能写成用户没有能力。",
    },
    {
        "signal_id": "visual.fragmented_white_or_metal_cut",
        "candidate_clauses": ("wealth.approval_driven_earning", "wealth.low_action"),
        "candidate_modules": ("wealth.deservingness_self_worth", "wealth.body_fear_action"),
        "report_boundary": "适合表达标准、信息或行动被打断，不能只凭截断信号生成财富结论。",
    },
    {
        "signal_id": "visual.outer_world_closed_or_blank",
        "candidate_clauses": ("wealth.low_world_connection", "wealth.low_action"),
        "candidate_modules": ("wealth.world_connection_market", "wealth.career_value_exchange"),
        "report_boundary": "适合表达现实连接、行动或价值交换不足，不能把内向、学习或灵性倾向写成问题。",
    },
    {
        "signal_id": "visual.inner_contracted_outer_strong",
        "candidate_clauses": ("wealth.success_visibility_threat", "wealth.low_deservingness", "wealth.low_capacity"),
        "candidate_modules": (
            "wealth.deservingness_self_worth",
            "wealth.body_fear_action",
            "wealth.world_connection_market",
        ),
        "report_boundary": "适合表达想向外发展但内在承接紧张，不能断言用户害怕成功。",
    },
    {
        "signal_id": "visual.middle_tangled_relationship_pull",
        "candidate_clauses": (
            "wealth.exchange_boundary_imbalance",
            "wealth.receiving_and_pricing_pressure",
            "wealth.emotional_spending",
        ),
        "candidate_modules": (
            "wealth.world_connection_market",
            "wealth.career_value_exchange",
            "wealth.emotion_spending_protective_habits",
        ),
        "report_boundary": "适合把关系拉扯回译为交换边界、开价压力或情绪消耗，不能展开成亲密关系报告。",
    },
    {
        "signal_id": "visual.outer_boundary_broken",
        "candidate_clauses": ("wealth.resource_leakage", "wealth.exchange_boundary_imbalance", "wealth.low_world_connection"),
        "candidate_modules": (
            "wealth.safety_scarcity_control",
            "wealth.world_connection_market",
            "wealth.career_value_exchange",
        ),
        "report_boundary": "适合表达资源边界和现实承接不稳，不能判断用户真实存款、支出或债务。",
    },
    {
        "signal_id": "visual.outer_boundary_thick_closed",
        "candidate_clauses": (
            "wealth.difficulty_receiving_support",
            "wealth.scarcity_and_insecurity",
            "wealth.success_visibility_threat",
        ),
        "candidate_modules": (
            "wealth.safety_scarcity_control",
            "wealth.world_connection_market",
            "wealth.parents_family_money_scripts",
        ),
        "report_boundary": "适合表达防御、谨慎和支持通道收紧，不能把自我保护写成问题。",
    },
    {
        "signal_id": "visual.fragmented_dots_scattered_energy",
        "candidate_clauses": ("wealth.scattered_goals", "wealth.resource_leakage", "wealth.low_action"),
        "candidate_modules": ("wealth.body_fear_action", "wealth.passion_needs_abundance", "wealth.safety_scarcity_control"),
        "report_boundary": "适合表达目标、行动或资源分散，不能替用户做职业或商业取舍。",
    },
    {
        "signal_id": "visual.center_clear_outer_weak",
        "candidate_clauses": ("wealth.value_expression_block", "wealth.low_world_connection", "wealth.low_action"),
        "candidate_modules": (
            "wealth.career_value_exchange",
            "wealth.world_connection_market",
            "wealth.passion_needs_abundance",
        ),
        "report_boundary": "适合表达内在价值尚未充分外化，不能承诺市场反馈、客户或成交结果。",
    },
    {
        "signal_id": "visual.heavy_overfilled_composition",
        "candidate_clauses": ("wealth.hardship_earning_belief", "wealth.scarcity_and_insecurity", "wealth.low_capacity"),
        "candidate_modules": ("wealth.safety_scarcity_control", "wealth.body_fear_action", "wealth.money_beliefs"),
        "report_boundary": "适合表达用力、负担和休息困难，不能否定用户现实努力或责任。",
    },
    {
        "signal_id": "visual.color_blocks_split",
        "candidate_clauses": ("wealth.scattered_goals", "wealth.low_action", "wealth.success_visibility_threat"),
        "candidate_modules": ("wealth.body_fear_action", "wealth.passion_needs_abundance", "wealth.deservingness_self_worth"),
        "report_boundary": "适合表达取舍两难和行动主线不清，不能替用户做现实选择。",
    },
)


NEXT_EXPLORATION_MAPPINGS: tuple[dict[str, Any], ...] = (
    {
        "id": "wealth.next.self_worth",
        "recommended_topic": "自我价值 / 配得感",
        "recommended_intention": "我想探索：我是否允许自己的价值被看见、被支付，并稳定接住回报。",
        "trigger_signals": ("内圈收缩", "中心空缺", "金多", "白色切分", "价值线索被压低"),
        "why_not_expand_now": "本次只翻译到财富中的收钱、定价和接收能力。",
        "avoid": ("不说用户没有价值感。",),
    },
    {
        "id": "wealth.next.safety_scarcity",
        "recommended_topic": "安全感 / 匮乏感",
        "recommended_intention": "我想探索：金钱在我的生命里承担了哪些安全感功能。",
        "trigger_signals": ("厚重", "深色", "收缩", "外圈防御", "过满", "用户提到紧张或怕不够"),
        "why_not_expand_now": "本次只说明财富紧绷和承载压力，不展开完整安全感议题。",
        "avoid": ("不判断现实贫穷或心理问题。",),
    },
    {
        "id": "wealth.next.relationship_boundary",
        "recommended_topic": "关系与交换边界 / 人际关系",
        "recommended_intention": "我想探索：我在关系、合作和人情往来中如何交换价值与资源。",
        "trigger_signals": ("中圈缠绕", "中圈拉扯", "中圈断裂", "留白切分", "外圈缺口", "用户提到合作或人情压力"),
        "why_not_expand_now": "本次只回到财富中的交换边界，不展开完整关系报告。",
        "avoid": ("不把关系状态写成财富问题原因。",),
    },
)


QUALITY_CHECKS = (
    "是否明确 user_theme 为财富。",
    "是否至少引用一个可见画面信号。",
    "是否说明选中的财富模块或条款。",
    "是否保留 Lite / Pro 边界。",
    "是否避免财务建议、心理诊断和确定性承诺。",
)


SAFETY_BOUNDARIES = (
    "不判断用户收入、资产、债务、投资前景或职业成败。",
    "不给买卖、辞职、创业、借贷、融资等决策建议。",
    "不把父母、家庭、身体或画面符号写成确定因果。",
    "不对创伤、成瘾、债务危机、家庭暴力或自伤风险做 AI 单独处理。",
)


@dataclass(frozen=True)
class WealthRouteMatch:
    """Selected wealth report routing result for one visual input."""

    selected_signal_ids: tuple[str, ...]
    selected_clause_ids: tuple[str, ...]
    selected_module_ids: tuple[str, ...]
    selected_next_explorations: tuple[dict[str, Any], ...]
    boundaries: tuple[str, ...]


class WealthReportRuntime:
    """Query wealth report routing from generated deploy-time knowledge.

    The old YAML files are intentionally not runtime inputs. This runtime requires
    the generated wealth prompt pack to exist, then uses the compact routing table
    kept in code for deterministic pre-routing.
    """

    def __init__(self, *, generated_root: Path | None = None) -> None:
        self._pack_builder = WealthPromptPackBuilder(generated_root=generated_root)
        self._prompt_pack = None

    def load_prompt_pack(self):
        if self._prompt_pack is None:
            self._prompt_pack = self._pack_builder.build()
        return self._prompt_pack

    def get_topic_context(self, *, report_mode: str) -> dict[str, Any]:
        """Return the product-facing topic context for native wealth reports."""

        self.load_prompt_pack()
        return {
            "topic": "wealth",
            "topic_label": "财富议题",
            "report_mode": report_mode,
            "orientation": {
                "intro": "这份报告会从财富议题角度看这张画。",
                "focus": "财富议题关注人与金钱、价值、资源、世界和行动之间的关系，不直接判断用户有没有钱或能不能赚钱。",
                "key_terms": [
                    {
                        "term": "金钱关系",
                        "explanation": "你如何感受、使用、保存和流动金钱。",
                    },
                    {
                        "term": "价值交换",
                        "explanation": "你是否允许自己的能力、服务和创造被看见并被支付。",
                    },
                    {
                        "term": "承载力",
                        "explanation": "机会、收入或资源进入时，你能否稳定接住并保存。",
                    },
                ],
            },
        }

    def get_quality_controls(self) -> tuple[str, ...]:
        self.load_prompt_pack()
        return QUALITY_CHECKS

    def get_safety_boundaries(self) -> tuple[str, ...]:
        self.load_prompt_pack()
        return SAFETY_BOUNDARIES

    def route_visual_observations(
        self,
        observations: dict[str, Any],
        *,
        report_mode: str = "lite",
    ) -> WealthRouteMatch:
        """Select candidate wealth clauses/modules from structured observations."""

        self.load_prompt_pack()
        max_clauses = 2 if report_mode == "lite" else 4
        max_modules = 2 if report_mode == "lite" else 5
        signal_ids: list[str] = []
        clause_ids: list[str] = []
        module_ids: list[str] = []
        boundaries: list[str] = []
        observation_text = self._flatten_observations(observations)

        for route in ROUTE_TABLE:
            signal_id = str(route.get("signal_id") or "")
            if not self._semantic_route_matches_observation(signal_id, observation_text):
                continue
            signal_ids.append(signal_id)
            clause_ids.extend(self._string_items(route.get("candidate_clauses", ())))
            module_ids.extend(self._string_items(route.get("candidate_modules", ())))
            boundary = str(route.get("report_boundary") or "").strip()
            if boundary:
                boundaries.append(boundary)

        return WealthRouteMatch(
            selected_signal_ids=tuple(self._unique(signal_ids)),
            selected_clause_ids=tuple(self._unique(clause_ids)[:max_clauses]),
            selected_module_ids=tuple(self._unique(module_ids)[:max_modules]),
            selected_next_explorations=tuple(
                self._select_next_explorations(
                    observation_text,
                    report_mode=report_mode,
                )
            ),
            boundaries=tuple(self._unique(boundaries)),
        )

    def get_clause(self, clause_id: str) -> dict[str, Any]:
        self.load_prompt_pack()
        return {"id": clause_id} if clause_id else {}

    def get_module(self, module_id: str) -> dict[str, Any]:
        self.load_prompt_pack()
        return {"module_id": module_id} if module_id else {}

    def _semantic_route_matches_observation(
        self,
        signal_id: str,
        observation_text: str,
    ) -> bool:
        normalized_text = self._normalize_observation_text(observation_text)
        for rule_key, alternatives in SEMANTIC_ROUTE_RULES.items():
            if rule_key not in signal_id:
                continue
            return any(
                all(
                    any(term in normalized_text for term in term_group)
                    for term_group in alternative
                )
                for alternative in alternatives
            )
        return False

    def _select_next_explorations(
        self,
        observation_text: str,
        *,
        report_mode: str,
    ) -> list[dict[str, Any]]:
        mode_limit = 1 if report_mode == "lite" else 2
        normalized_text = self._normalize_observation_text(observation_text)
        candidates: list[dict[str, Any]] = []
        for item in NEXT_EXPLORATION_MAPPINGS:
            trigger_signals = self._string_items(item.get("trigger_signals", ()))
            matched = [
                signal
                for signal in trigger_signals
                if self._next_exploration_signal_matches(signal, normalized_text)
            ]
            if not matched:
                continue
            candidates.append(
                {
                    "id": item.get("id"),
                    "recommended_topic": item.get("recommended_topic"),
                    "recommended_intention": item.get("recommended_intention"),
                    "matched_signals": matched[:3],
                    "why_not_expand_now": item.get("why_not_expand_now"),
                    "avoid": self._string_items(item.get("avoid", ()))[:2],
                }
            )
        return candidates[: max(mode_limit, 0)]

    def _next_exploration_signal_matches(self, signal: str, normalized_text: str) -> bool:
        if signal in normalized_text:
            return True
        signal = signal.replace("收束", "收缩")
        text = normalized_text.replace("收束", "收缩")
        circle_terms = ("内圈", "中圈", "外圈")
        for circle in circle_terms:
            if signal.startswith(circle):
                tail = signal.removeprefix(circle)
                return bool(tail and circle in text and tail in text)
        return signal in text

    def _normalize_observation_text(self, text: str) -> str:
        replacements = {
            "inner_circle": "内圈",
            "inner": "内圈",
            "里圈": "内圈",
            "中心区域": "内圈",
            "middle_circle": "中圈",
            "middle": "中圈",
            "中间层": "中圈",
            "中间区域": "中圈",
            "outer_circle": "外圈",
            "outer": "外圈",
            "外围": "外圈",
            "边缘": "外圈",
        }
        normalized = text
        for source, target in replacements.items():
            normalized = normalized.replace(source, target)
        return normalized

    def _flatten_observations(self, observations: dict[str, Any]) -> str:
        parts: list[str] = []

        def collect(value: Any) -> None:
            if isinstance(value, dict):
                for key, child in value.items():
                    parts.append(str(key))
                    collect(child)
            elif isinstance(value, (list, tuple, set)):
                for child in value:
                    collect(child)
            elif value is not None:
                parts.append(str(value))

        collect(observations)
        return " ".join(parts)

    def _string_items(self, value: Any) -> list[str]:
        if not isinstance(value, (list, tuple)):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    def _unique(self, values: list[str]) -> list[str]:
        return list(dict.fromkeys(values))


@lru_cache(maxsize=1)
def get_wealth_report_runtime() -> WealthReportRuntime:
    return WealthReportRuntime()
