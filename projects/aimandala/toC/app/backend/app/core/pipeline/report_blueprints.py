"""Shared report blueprints that keep migrated copy aligned with legacy V1.6."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


_TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


@dataclass(frozen=True)
class ImbalanceSelectionRule:
    type: str
    inner_gte: int | None = None
    middle_gte: int | None = None
    theme_in: tuple[str, ...] = ()


@dataclass(frozen=True)
class BlueprintValidationIssue:
    path: str
    message: str


@dataclass(frozen=True)
class LiteReportBlueprint:
    story_connectors: dict[str, str]
    story_section_headings: tuple[tuple[str, str], ...]
    story_content_templates: dict[str, str]
    awareness_titles: tuple[str, ...]
    theme_insight_templates: dict[str, str]
    theme_labels: dict[str, str]
    title_templates: dict[str, str]
    structure_labels: dict[str, str]
    narrative_templates: dict[str, str]
    awareness_content_templates: tuple[str, ...]
    six_insight_defaults: dict[str, dict[str, str]]
    six_insight_layer1_templates: dict[str, dict[str, str]]
    fallback_experiment_card: dict[str, str]
    experiment_steps: tuple[str, ...]

    def validate(self) -> tuple[BlueprintValidationIssue, ...]:
        issues: list[BlueprintValidationIssue] = []
        expected_story_keys = ("base", "contradiction", "pattern", "defense", "block", "light")
        expected_connector_keys = ("base", "contradiction", "pattern", "defense", "block")
        expected_theme_keys = ("scene", "impact", "awareness")
        expected_card_keys = ("title", "content")

        issues.extend(
            _validate_required_mapping_keys(
                "lite.story_connectors",
                self.story_connectors,
                expected_connector_keys,
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "lite.story_content_templates",
                self.story_content_templates,
                expected_story_keys,
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "lite.theme_insight_templates",
                self.theme_insight_templates,
                expected_theme_keys,
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "lite.theme_labels",
                self.theme_labels,
                (
                    "general",
                    "father_relationship",
                    "mother_relationship",
                    "intimate_relationship",
                    "parent_child_relationship",
                    "wealth_career",
                    "health_wellness",
                    "personal_growth",
                ),
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "lite.title_templates",
                self.title_templates,
                (
                    "inner_high",
                    "middle_high",
                    "father_relationship",
                    "mother_relationship",
                    "intimate_relationship",
                    "parent_child_relationship",
                    "wealth_career",
                    "health_wellness",
                    "personal_growth",
                    "default",
                ),
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "lite.structure_labels",
                self.structure_labels,
                (
                    "layer0_inner_meaning",
                    "layer0_middle_meaning",
                    "layer0_outer_meaning",
                    "layer0_color_summary",
                    "layer0_adjacent_left",
                    "layer0_adjacent_right",
                    "layer0_wrap",
                    "experiment_title",
                    "fallback_experiment_title",
                    "section_visual_elements",
                    "section_emotion_portrait",
                    "section_story",
                    "section_theme_details",
                    "section_six_insights",
                    "section_three_awareness",
                    "section_awareness_invitation",
                    "section_experiment",
                    "section_pro_teaser",
                    "theme_scene_label",
                    "theme_impact_label",
                    "theme_awareness_label",
                ),
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "lite.narrative_templates",
                self.narrative_templates,
                (
                    "overall_impression",
                    "visual_elements",
                    "emotion_portrait",
                    "circle_pattern_inner_high",
                    "circle_pattern_middle_high",
                    "circle_pattern_default",
                    "missing_story_sections",
                    "missing_awareness_lines",
                    "missing_experiment_text",
                    "missing_theme_scene",
                    "missing_theme_impact",
                    "missing_theme_awareness",
                    "user_context_from_intention",
                    "user_context_from_feeling",
                    "feeling_hint_default",
                    "feeling_hint_from_feeling",
                ),
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "lite.fallback_experiment_card",
                self.fallback_experiment_card,
                expected_card_keys,
            )
        )
        if len(self.awareness_titles) < 3:
            issues.append(
                BlueprintValidationIssue(
                    path="lite.awareness_titles",
                    message="至少需要 3 个日常小觉察标题。",
                )
            )
        if len(self.awareness_content_templates) < 3:
            issues.append(
                BlueprintValidationIssue(
                    path="lite.awareness_content_templates",
                    message="至少需要 3 个日常小觉察正文模板。",
                )
            )
        if len(self.story_section_headings) < len(expected_story_keys):
            issues.append(
                BlueprintValidationIssue(
                    path="lite.story_section_headings",
                    message="故事章节标题数量不足，无法覆盖全部 Lite 故事段落。",
                )
            )
        if not self.experiment_steps:
            issues.append(
                BlueprintValidationIssue(
                    path="lite.experiment_steps",
                    message="至少需要 1 条实验步骤文案。",
                )
            )
        return tuple(issues)


@dataclass(frozen=True)
class ProReportBlueprint:
    default_teaser: str
    report_title: str
    report_intro: str
    section_titles: dict[str, str]
    fallback_texts: dict[str, str]
    core_table_labels: tuple[tuple[str, str], ...]
    imbalance_labels: dict[str, str]
    root_cause_labels: dict[str, str]
    structure_labels: dict[str, str]
    status_messages: dict[str, str]
    narrative_templates: dict[str, str]
    imbalance_selection_rules: tuple[ImbalanceSelectionRule, ...]
    imbalance_profiles: dict[str, dict[str, str]]
    healing_suggestion_templates: dict[str, Any]

    def validate(self) -> tuple[BlueprintValidationIssue, ...]:
        issues: list[BlueprintValidationIssue] = []
        expected_sections = (
            "first_impression",
            "core_table",
            "lite_base",
            "circles",
            "micro",
            "imbalance",
            "root_cause",
            "healing",
        )
        expected_fallbacks = (
            "missing_pro_increment",
            "missing_lite_base",
            "missing_core_table",
            "missing_circle_sections",
            "missing_micro_sections",
            "missing_imbalance_sections",
            "missing_root_sections",
            "missing_healing_sections",
        )
        expected_imbalance_labels = (
            "type",
            "summary",
            "primary",
            "evidence",
            "energy_level",
            "psychological_level",
            "life_manifestation",
        )
        expected_root_labels = ("surface", "deeper", "core")
        issues.extend(
            _validate_required_mapping_keys(
                "pro.section_titles",
                self.section_titles,
                expected_sections,
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "pro.fallback_texts",
                self.fallback_texts,
                expected_fallbacks,
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "pro.imbalance_labels",
                self.imbalance_labels,
                expected_imbalance_labels,
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "pro.root_cause_labels",
                self.root_cause_labels,
                expected_root_labels,
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "pro.structure_labels",
                self.structure_labels,
                (
                    "circle_inner",
                    "circle_middle",
                    "circle_outer",
                    "micro_rhythm",
                    "micro_relationship",
                    "micro_action",
                    "core_table_dimension",
                    "core_table_content",
                    "core_table_fallback_summary",
                    "core_table_fallback_block",
                    "core_table_fallback_direction",
                    "healing_action_prefix",
                    "report_title",
                ),
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "pro.status_messages",
                self.status_messages,
                ("already_available", "generated_success"),
            )
        )
        issues.extend(
            _validate_required_mapping_keys(
                "pro.narrative_templates",
                self.narrative_templates,
                (
                    "first_impression",
                    "energy_essence",
                    "block_point",
                    "core_direction",
                    "core_healing",
                    "circle_inner_reading",
                    "circle_middle_reading",
                    "circle_outer_reading",
                    "micro_rhythm",
                    "micro_relationship",
                    "micro_action",
                    "surface_root_without_intention",
                    "surface_root_with_intention",
                    "root_deeper",
                    "root_core",
                    "healing_phase_fallback",
                    "healing_focus_fallback",
                ),
            )
        )
        if not self.default_teaser.strip():
            issues.append(
                BlueprintValidationIssue(
                    path="pro.default_teaser",
                    message="Pro teaser 不能为空。",
                )
            )
        if len(self.core_table_labels) < 5:
            issues.append(
                BlueprintValidationIssue(
                    path="pro.core_table_labels",
                    message="核心洞察表格至少需要 5 个标签。",
                )
            )
        if not self.imbalance_selection_rules:
            issues.append(
                BlueprintValidationIssue(
                    path="pro.imbalance_selection_rules",
                    message="至少需要 1 条失衡类型选择规则。",
                )
            )
        if "energy-block" not in self.imbalance_profiles:
            issues.append(
                BlueprintValidationIssue(
                    path="pro.imbalance_profiles.energy-block",
                    message="必须保留 energy-block 作为兜底失衡类型。",
                )
            )
        if "common_tail" not in self.healing_suggestion_templates:
            issues.append(
                BlueprintValidationIssue(
                    path="pro.healing_suggestion_templates.common_tail",
                    message="必须保留 common_tail 作为通用收尾建议模板。",
                )
            )
        return tuple(issues)


def _load_template(filename: str) -> dict[str, Any]:
    path = _TEMPLATES_DIR / filename
    if not path.exists():
        return {}

    return json.loads(path.read_text(encoding="utf-8"))


def _get_dict(template: dict[str, Any], key: str, default: dict[str, Any]) -> dict[str, Any]:
    value = template.get(key, default)
    return value if isinstance(value, dict) else default


def _get_list(template: dict[str, Any], key: str, default: list[Any]) -> list[Any]:
    value = template.get(key, default)
    return value if isinstance(value, list) else default


def _validate_required_mapping_keys(
    path: str,
    mapping: dict[str, Any],
    expected_keys: tuple[str, ...],
) -> list[BlueprintValidationIssue]:
    issues: list[BlueprintValidationIssue] = []
    for key in expected_keys:
        value = mapping.get(key)
        if not isinstance(value, str) or not value.strip():
            issues.append(
                BlueprintValidationIssue(
                    path=f"{path}.{key}",
                    message="缺少必需字段或内容为空。",
                )
            )
    return issues


def _normalize_pairs(raw_pairs: list[Any] | Any, default: list[tuple[str, str]]) -> tuple[tuple[str, str], ...]:
    if not isinstance(raw_pairs, list):
        return tuple(default)

    normalized: list[tuple[str, str]] = []
    for item in raw_pairs:
        if not isinstance(item, (list, tuple)) or len(item) != 2:
            continue
        left = str(item[0]).strip()
        right = str(item[1]).strip()
        if left and right:
            normalized.append((left, right))

    return tuple(normalized or default)


def _normalize_string_dict(raw_dict: dict[str, Any] | Any, default: dict[str, str]) -> dict[str, str]:
    if not isinstance(raw_dict, dict):
        return dict(default)

    normalized = {
        str(key).strip(): str(value)
        for key, value in raw_dict.items()
        if str(key).strip()
    }
    if not normalized:
        return dict(default)

    merged = dict(default)
    merged.update(normalized)
    return merged


def _normalize_nested_string_dict(
    raw_dict: dict[str, Any] | Any,
    default: dict[str, dict[str, str]],
) -> dict[str, dict[str, str]]:
    if not isinstance(raw_dict, dict):
        return {key: dict(value) for key, value in default.items()}

    normalized: dict[str, dict[str, str]] = {
        key: dict(value) for key, value in default.items()
    }
    for outer_key, inner_value in raw_dict.items():
        outer_key_str = str(outer_key).strip()
        if not outer_key_str or not isinstance(inner_value, dict):
            continue
        inner_normalized = {
            str(inner_key).strip(): str(inner_item)
            for inner_key, inner_item in inner_value.items()
            if str(inner_key).strip()
        }
        if inner_normalized:
            merged_inner = dict(normalized.get(outer_key_str, {}))
            merged_inner.update(inner_normalized)
            normalized[outer_key_str] = merged_inner

    if normalized:
        return normalized

    return {key: dict(value) for key, value in default.items()}


def _normalize_string_tuple(raw_values: list[Any] | Any, default: list[str]) -> tuple[str, ...]:
    if not isinstance(raw_values, list):
        return tuple(default)

    normalized = tuple(str(item) for item in raw_values if str(item).strip())
    return normalized or tuple(default)


def _normalize_imbalance_selection_rules(
    raw_rules: list[dict[str, Any]] | Any,
) -> tuple[ImbalanceSelectionRule, ...]:
    if not isinstance(raw_rules, list):
        return (ImbalanceSelectionRule(type="energy-block"),)

    normalized: list[ImbalanceSelectionRule] = []
    for item in raw_rules:
        if not isinstance(item, dict):
            continue
        rule_type = str(item.get("type", "energy-block")).strip() or "energy-block"
        when = item.get("when", {}) if isinstance(item.get("when", {}), dict) else {}
        theme_in = when.get("theme_in", ())
        if not isinstance(theme_in, list):
            theme_in = ()
        normalized.append(
            ImbalanceSelectionRule(
                type=rule_type,
                inner_gte=int(when["inner_gte"]) if "inner_gte" in when else None,
                middle_gte=int(when["middle_gte"]) if "middle_gte" in when else None,
                theme_in=tuple(str(theme).strip() for theme in theme_in if str(theme).strip()),
            )
        )

    return tuple(normalized or [ImbalanceSelectionRule(type="energy-block")])


_LITE_TEMPLATE = _load_template("lite_report_content.json")
_PRO_TEMPLATE = _load_template("pro_report_content.json")

_DEFAULT_LITE_STORY_CONNECTORS = {
    "base": "但与此同时...",
    "contradiction": "这种内心的拉扯，让你...",
    "pattern": "为什么你会这样呢？因为...",
    "defense": "但当这种保护成为习惯...",
    "block": "但好消息是...",
}
_DEFAULT_LITE_STORY_SECTION_HEADINGS = [
    ("base", "### 【起】你的底色"),
    ("contradiction", "### 【承】你的矛盾"),
    ("pattern", "### 【转】你的模式"),
    ("defense", "### 【转】你的防御"),
    ("block", "### 【合】你的卡点"),
    ("light", "### 【升】你的光"),
]
_DEFAULT_LITE_STORY_CONTENT_TEMPLATES = {
    "base": "你的底色里有一种很强的回到中心的能力，尤其在{theme_label}主题里，你会先确认自己是否真正站稳。",
    "contradiction": "你仍然想回应{theme_label}相关的现实任务与关系，只是你不想再用透支自己的方式去换结果。",
    "pattern": "你常常先观察、先感受、先判断安全，再决定要不要把能量真正投入进去。",
    "defense": "当外部节奏太快时，你会通过收回注意力、拉开距离或暂缓回应来保护自己。",
    "block": "真正的卡点在于：你已经知道想往哪里去，但身体和情绪还想按更慢一点的速度前进。{feeling_hint}",
    "light": "你的光在于，你已经开始知道什么是属于自己的节奏，并愿意重新安排边界、关系和投入方式。",
}
_DEFAULT_LITE_AWARENESS_TITLES = [
    "倾听身体的悄悄话",
    "给情绪一个名字",
    "观察你的自动模式",
]
_DEFAULT_LITE_THEME_INSIGHT_TEMPLATES = {
    "scene": "在{theme_label}主题下，你更容易体验到“我想推进，但我也需要先照顾自己”的双重声音。",
    "impact": "这会让你在关键决定前更反复，也更需要确认安全感、边界感和节奏感。",
    "awareness": "当你不再逼自己立刻进入最优状态，反而更容易找到真正可持续的推进方式。",
}
_DEFAULT_LITE_THEME_LABELS = {
    "general": "通用解读",
    "father_relationship": "与父亲的关系",
    "mother_relationship": "与母亲的关系",
    "intimate_relationship": "亲密关系",
    "parent_child_relationship": "亲子关系",
    "wealth_career": "财富事业",
    "health_wellness": "身体健康",
    "personal_growth": "个人成长",
}
_DEFAULT_LITE_TITLE_TEMPLATES = {
    "inner_high": "{theme_label}里的守心者",
    "middle_high": "{theme_label}中的重连者",
    "father_relationship": "父影里的回声",
    "mother_relationship": "还想靠近的地方",
    "intimate_relationship": "关系里的慢热光",
    "parent_child_relationship": "牵挂中的边界感",
    "wealth_career": "向前先稳住的人",
    "health_wellness": "身体在说的话",
    "personal_growth": "回潮时刻的自己",
    "default": "慢慢亮起来的中心",
}
_DEFAULT_LITE_STRUCTURE_LABELS = {
    "layer0_inner_meaning": "核心自我",
    "layer0_middle_meaning": "关系场域",
    "layer0_outer_meaning": "外在呈现",
    "layer0_color_summary": "当前颜色分析会按逐圈颜色、面积与深浅状态输出正式证据。",
    "layer0_adjacent_left": "中心收束",
    "layer0_adjacent_right": "外层舒展",
    "layer0_wrap": "保护自己后再重新连接外界",
    "experiment_title": "曼曼的疗愈仪式：给自己一个稳稳的小空间",
    "fallback_experiment_title": "今天的小实验",
    "section_visual_elements": "## 画面元素",
    "section_emotion_portrait": "## 情绪画像",
    "section_story": "## 你的心灵画像故事",
    "section_theme_details": "## 在「{theme_label}」中的具体表现",
    "section_six_insights": "## 六个核心洞察",
    "section_three_awareness": "## 三个日常小觉察",
    "section_awareness_invitation": "### 曼曼的温柔邀请",
    "section_experiment": "## 今天的小实验",
    "section_pro_teaser": "## 给你的一个小预告",
    "theme_scene_label": "**典型场景**：",
    "theme_impact_label": "**具体影响**：",
    "theme_awareness_label": "**一个小小的觉察点**：",
}
_DEFAULT_LITE_NARRATIVE_TEMPLATES = {
    "overall_impression": "你的画面像是在提醒你：此刻最重要的，不是立刻把所有事情推向前，而是先让内在的中心重新稳定下来。在{theme_label}主题里，这种“先收回、再展开”的节奏尤其明显。内圈约 {inner}%、中圈约 {middle}% 的分配，也让这幅画带着一种既谨慎又正在慢慢恢复流动的气质。",
    "visual_elements": "从当前 `{theme}` 主题的三圈结构来看，内圈约 {inner}%，中圈约 {middle}%。{circle_pattern} 这让整张画呈现出一种先向内聚拢、再决定如何与外界恢复连接的组织方式。{context_hint}",
    "emotion_portrait": "你并不是没有力量，而是正处在一个需要重新分配能量的阶段。在{theme_label}主题里，你会更敏感地感到“我想继续往前，但我也需要先照顾自己”的双重声音。{feeling_hint} 这不是退后，而是在为下一次真正稳的前进做准备。",
    "circle_pattern_inner_high": "这说明你当前更强调把能量先留给自己，再慢慢判断是否要向外打开。",
    "circle_pattern_middle_high": "这说明你虽然仍在保护自己，但已经开始尝试把能量重新放回外部关系。",
    "circle_pattern_default": "这说明你仍优先保护核心边界，再逐步恢复向外连接。",
    "missing_story_sections": "当前缺少故事结构。",
    "missing_awareness_lines": "当前缺少日常小觉察。",
    "missing_experiment_text": "给自己 24 小时，只保留一件最重要的推进动作，其余先记录，不要求立刻完成。",
    "missing_theme_scene": "当前你更像在过渡期里重新分配注意力。",
    "missing_theme_impact": "会出现既想推进又想先稳住自己的拉扯。",
    "missing_theme_awareness": "先确认什么是你真正想保留的节奏。",
    "user_context_from_intention": "你在创作前提到“{intention}”，这说明你当时已经在主动寻找一个新的落点。",
    "user_context_from_feeling": "创作时你感受到“{feeling}”，这让画面里那种既收束又试探着向外打开的张力更明显。",
    "feeling_hint_default": "这通常意味着身体感受和现实推进速度暂时没有对齐。",
    "feeling_hint_from_feeling": "你提到的“{feeling}”也说明身体层面还在追赶外部节奏。",
}
_DEFAULT_LITE_AWARENESS_CONTENT_TEMPLATES = [
    "今天先留意身体在哪些时刻悄悄收紧。那种紧绷不是你做错了什么，而是身体在提醒你：这里也许需要更多安全感和边界感。",
    "当情绪浮上来时，先别急着处理它，只试着为它取一个名字。被看见的情绪，往往就不会那么急着用力撞你。",
    "观察你在压力出现时最容易自动做出的那个动作，也许是立刻答应、立刻逃开，或立刻要求自己振作。看见它，就是改变的开始。",
]
_DEFAULT_LITE_SIX_INSIGHT_DEFAULTS = {
    "base": {
        "title": "你的底色：先稳住中心的人",
        "content": "你真正的稳定感来自先回到自己，而不是先回应所有外部期待。",
    },
    "contradiction": {
        "title": "你的矛盾：想向前，也想先停一下",
        "content": "你并不是不愿意行动，而是内在节奏和外部节奏暂时没有完全对齐。",
    },
    "pattern": {
        "title": "你的模式：先观察，再决定投入多少",
        "content": "你习惯先判断是否安全，再决定要不要把能量真正放出去。",
    },
    "defense": {
        "title": "你的防御：用边界保护珍贵的感受力",
        "content": "当外界太快、太杂时，你会本能地先收回来，这其实是在保护自己。",
    },
    "block": {
        "title": "你的卡点：恢复中的自己还不想被催促",
        "content": "真正让你卡住的，不是没有方向，而是还没有找到一个可持续的推进速度。",
    },
    "light": {
        "title": "你的光：你已经开始知道自己真正需要什么",
        "content": "这份能觉察、能调整的能力，就是你重新组织生活和关系的起点。",
    },
}
_DEFAULT_LITE_SIX_INSIGHT_LAYER1_TEMPLATES = {
    "base": {
        "title": "你的底色：先稳住中心的人",
        "content": "你的稳定感并不来自外界立刻给出回应，而来自你能先回到自己。特别是在{theme_label}主题里，这种“先站稳再行动”的底色很明显。",
        "summary": "你的底色是先回到自己，再决定如何向外投入。",
    },
    "contradiction": {
        "title": "你的矛盾：想往前，也想先喘口气",
        "content": "你并不是不想推进{theme_label}相关的事情，而是内在还需要一点时间整合，所以会出现既想继续、又想先缓一缓的拉扯。",
        "summary": "你既想推进，也需要先让自己缓下来。",
    },
    "pattern": {
        "title": "你的模式：先感受，再决定投入多少",
        "content": "你会先观察场域、感受自己的状态，再决定今天要向外投入多少能量。这种模式让你不容易盲目消耗，但也会让节奏显得偏慢。",
        "summary": "你的模式是先观察和感受，再决定是否真正投入。",
    },
    "defense": {
        "title": "你的防御：用边界保护感受力",
        "content": "当环境太快、太满、太吵时，你会本能地收回来，用距离感、暂停和边界感保护自己。这不是问题，而是你保护珍贵感受力的方式。",
        "summary": "你会通过边界和暂时收回来保护自己。",
    },
    "block": {
        "title": "你的卡点：恢复中的自己不想再被催促",
        "content": "卡点不在于你没有方向，而在于外部要求和你真正能承受的节奏还没完全对上。{feeling_hint}",
        "summary": "卡点是外部节奏和你内在恢复速度还没对齐。",
    },
    "light": {
        "title": "你的光：你已经知道什么更适合自己",
        "content": "你的光不一定是马上爆发出来，而是你已经越来越能分辨：什么关系值得继续、什么任务值得投入、什么节奏才真正适合你。",
        "summary": "你的光在于已经能辨认并重整自己的选择。",
    },
}
_DEFAULT_LITE_FALLBACK_EXPERIMENT_CARD = {
    "title": "今天的小实验：只保留一件关键事",
    "content": "接下来 24 小时，只保留一件最重要的推进动作，其余事项先记录，不要求立刻完成。",
}
_DEFAULT_LITE_EXPERIMENT_STEPS = [
    "准备：白纸、喜欢的笔，舒适坐姿，双脚踩地，深呼吸三次，对自己说“这 5 分钟，只属于我”。",
    "步骤一：先写下此刻在「{theme_label}」里最牵动你的一个念头，只写一句，不急着分析。",
    "步骤二：把手放回胸口或腹部，感受身体哪里最紧，再用一条线、一个圈或一个小色块把它画出来。",
    "步骤三：看着这张小纸片，问自己“如果今天只做一件更温柔也更稳的事，它会是什么？”，然后把那个动作写在角落里。",
    "曼曼的祝福：慢慢来，不着急。{title}不是要一下子把一切都梳开，而是先让你重新听见自己的节奏。",
]

_DEFAULT_PRO_TEASER = (
    "你的画中，还藏着更深的线索：这种模式为什么总会重复出现，它在日常生活里还会如何影响你，"
    "以及你当前最需要看见的失衡类型与对应疗愈建议。这些答案，都在「一梳」完整版里等你。"
)
_DEFAULT_PRO_SECTION_TITLES = {
    "first_impression": "第一眼直觉",
    "core_table": "核心洞察表格",
    "lite_base": "Lite 版心灵画像故事",
    "circles": "三圈深度诊断",
    "micro": "微观能量分析",
    "imbalance": "失衡识别",
    "root_cause": "根源探索",
    "healing": "疗愈建议",
}
_DEFAULT_PRO_FALLBACK_TEXTS = {
    "missing_pro_increment": "当前缺少 Pro 增量内容。",
    "missing_lite_base": "当前缺少 Lite 基础内容。",
    "missing_core_table": "当前缺少核心洞察。",
    "missing_circle_sections": "当前缺少三圈能量画像。",
    "missing_micro_sections": "当前缺少微观分析。",
    "missing_imbalance_sections": "当前缺少失衡识别。",
    "missing_root_sections": "当前缺少根源分析。",
    "missing_healing_sections": "当前缺少调节建议。",
}
_DEFAULT_PRO_CORE_TABLE_LABELS = [
    ("能量本质", "能量本质"),
    ("核心失衡", "核心失衡"),
    ("关键卡点", "关键卡点"),
    ("转化方向", "转化方向"),
    ("疗愈核心", "疗愈核心"),
]
_DEFAULT_PRO_IMBALANCE_LABELS = {
    "type": "当前状态",
    "summary": "整体判断",
    "primary": "主要失衡类型",
    "evidence": "判断依据",
    "energy_level": "能量层面",
    "psychological_level": "心理层面",
    "life_manifestation": "生活表现",
}
_DEFAULT_PRO_ROOT_CAUSE_LABELS = {
    "surface": "表面现象",
    "deeper": "深层模式",
    "core": "核心信念",
}
_DEFAULT_PRO_STRUCTURE_LABELS = {
    "circle_inner": "内圈",
    "circle_middle": "中圈",
    "circle_outer": "外圈",
    "micro_rhythm": "节奏关系",
    "micro_relationship": "关系模式",
    "micro_action": "行动模式",
    "core_table_dimension": "维度",
    "core_table_content": "内容",
    "core_table_fallback_summary": "当前失衡",
    "core_table_fallback_block": "主要卡点",
    "core_table_fallback_direction": "接下来方向",
    "healing_action_prefix": "可执行动作：",
    "report_title": "一梳 Pro 版报告",
}
_DEFAULT_PRO_STATUS_MESSAGES = {
    "already_available": "一梳 Pro 版报告已可查看。",
    "generated_success": "一梳 Pro 版报告已生成，可继续查看完整结果。",
}
_DEFAULT_PRO_NARRATIVE_TEMPLATES = {
    "first_impression": "第一眼看这张画，我感受到一种“慢慢回到自己”的力量。画面现在更清楚地显出：你不是停住了，而是在重新决定，什么样的推进方式才真正适合现在的你。{lite_contradiction}{context_hint}",
    "energy_essence": "{theme_label}主题下的核心动力，仍围绕“先稳住中心，再逐步恢复向外连接”。内圈 {inner}%、中圈 {middle}% 的分配，说明现在最重要的不是更快，而是更稳。",
    "block_point": "{lite_block}{primary}让你很难一边往前推进，一边仍然感觉自己是安全的。真正的卡点不是没有方向，而是你还在学习：如何不靠透支自己，也能把事情往前推进。{feeling_hint}",
    "core_direction": "先稳住中心感，再把能量逐步放回{theme_label}相关的关系、行动与表达，而不是一次性全部打开。",
    "core_healing": "通过边界、身体感受和稳定的小步行动，重建“我可以安全地往前走”的内在体验。",
    "circle_inner_reading": "当前内圈约 {inner}%，说明你的核心自我仍在优先确认安全感。你不是没有力量，而是在先守住最重要的内在秩序。",
    "circle_middle_reading": "当前中圈约 {middle}%，说明你已经开始把能量重新放回关系和现实任务，但这种恢复仍然带着明显的谨慎与试探。",
    "circle_outer_reading": "外圈更像是一层有意识的边界管理。你并非拒绝世界，而是在学习决定什么值得继续开放、什么需要先保留距离。",
    "micro_rhythm": "整体节奏呈现出“先收束、再试探、再缓慢展开”的顺序，这说明恢复不是线性的，而是一种螺旋式回到自己。",
    "micro_relationship": "你对外部关系并非彻底抽离，而是在不断校准：哪些关系会消耗我，哪些关系能让我保持真实。",
    "micro_action": "当前更适合通过小步完成来恢复行动感，而不是靠一次高强度爆发证明自己已经准备好了。",
    "surface_root_without_intention": "{lite_contradiction}最近的外部任务与内部恢复节奏不一致。",
    "surface_root_with_intention": "{lite_contradiction}你原本希望“{intention}”，但现实推进方式和这个期待之间还存在落差。",
    "root_deeper": "你已经知道需要变化，但身体和情绪还在追赶新的步调，因此会在想前进与想保护自己之间来回摆动。",
    "root_core": "更深层的位置，是你正在重新学习：我不需要靠透支、讨好或过度证明，才能换来前进和被看见。",
    "healing_phase_fallback": "当前阶段",
    "healing_focus_fallback": "当前建议如下。",
}


def _build_lite_blueprint(template: dict[str, Any]) -> LiteReportBlueprint:
    return LiteReportBlueprint(
        story_connectors=_normalize_string_dict(
            _get_dict(template, "story_connectors", _DEFAULT_LITE_STORY_CONNECTORS),
            _DEFAULT_LITE_STORY_CONNECTORS,
        ),
        story_section_headings=_normalize_pairs(
            _get_list(template, "story_section_headings", _DEFAULT_LITE_STORY_SECTION_HEADINGS),
            _DEFAULT_LITE_STORY_SECTION_HEADINGS,
        ),
        story_content_templates=_normalize_string_dict(
            _get_dict(template, "story_content_templates", _DEFAULT_LITE_STORY_CONTENT_TEMPLATES),
            _DEFAULT_LITE_STORY_CONTENT_TEMPLATES,
        ),
        awareness_titles=_normalize_string_tuple(
            _get_list(template, "awareness_titles", _DEFAULT_LITE_AWARENESS_TITLES),
            _DEFAULT_LITE_AWARENESS_TITLES,
        ),
        theme_insight_templates=_normalize_string_dict(
            _get_dict(template, "theme_insight_templates", _DEFAULT_LITE_THEME_INSIGHT_TEMPLATES),
            _DEFAULT_LITE_THEME_INSIGHT_TEMPLATES,
        ),
        theme_labels=_normalize_string_dict(
            _get_dict(template, "theme_labels", _DEFAULT_LITE_THEME_LABELS),
            _DEFAULT_LITE_THEME_LABELS,
        ),
        title_templates=_normalize_string_dict(
            _get_dict(template, "title_templates", _DEFAULT_LITE_TITLE_TEMPLATES),
            _DEFAULT_LITE_TITLE_TEMPLATES,
        ),
        structure_labels=_normalize_string_dict(
            _get_dict(template, "structure_labels", _DEFAULT_LITE_STRUCTURE_LABELS),
            _DEFAULT_LITE_STRUCTURE_LABELS,
        ),
        narrative_templates=_normalize_string_dict(
            _get_dict(template, "narrative_templates", _DEFAULT_LITE_NARRATIVE_TEMPLATES),
            _DEFAULT_LITE_NARRATIVE_TEMPLATES,
        ),
        awareness_content_templates=_normalize_string_tuple(
            _get_list(template, "awareness_content_templates", _DEFAULT_LITE_AWARENESS_CONTENT_TEMPLATES),
            _DEFAULT_LITE_AWARENESS_CONTENT_TEMPLATES,
        ),
        six_insight_defaults=_normalize_nested_string_dict(
            _get_dict(template, "six_insight_defaults", _DEFAULT_LITE_SIX_INSIGHT_DEFAULTS),
            _DEFAULT_LITE_SIX_INSIGHT_DEFAULTS,
        ),
        six_insight_layer1_templates=_normalize_nested_string_dict(
            _get_dict(template, "six_insight_layer1_templates", _DEFAULT_LITE_SIX_INSIGHT_LAYER1_TEMPLATES),
            _DEFAULT_LITE_SIX_INSIGHT_LAYER1_TEMPLATES,
        ),
        fallback_experiment_card=_normalize_string_dict(
            _get_dict(template, "fallback_experiment_card", _DEFAULT_LITE_FALLBACK_EXPERIMENT_CARD),
            _DEFAULT_LITE_FALLBACK_EXPERIMENT_CARD,
        ),
        experiment_steps=_normalize_string_tuple(
            _get_list(template, "experiment_steps", _DEFAULT_LITE_EXPERIMENT_STEPS),
            _DEFAULT_LITE_EXPERIMENT_STEPS,
        ),
    )


def _build_pro_blueprint(template: dict[str, Any]) -> ProReportBlueprint:
    return ProReportBlueprint(
        default_teaser=str(template.get("default_teaser", _DEFAULT_PRO_TEASER)),
        report_title=str(template.get("report_title", "一梳 Pro 版报告")),
        report_intro=str(
            template.get(
                "report_intro",
                "这份 Pro 报告会独立展开这张画更深一层的结构、根源与调节方向。",
            )
        ),
        section_titles=_normalize_string_dict(
            _get_dict(template, "section_titles", _DEFAULT_PRO_SECTION_TITLES),
            _DEFAULT_PRO_SECTION_TITLES,
        ),
        fallback_texts=_normalize_string_dict(
            _get_dict(template, "fallback_texts", _DEFAULT_PRO_FALLBACK_TEXTS),
            _DEFAULT_PRO_FALLBACK_TEXTS,
        ),
        core_table_labels=_normalize_pairs(
            _get_list(template, "core_table_labels", _DEFAULT_PRO_CORE_TABLE_LABELS),
            _DEFAULT_PRO_CORE_TABLE_LABELS,
        ),
        imbalance_labels=_normalize_string_dict(
            _get_dict(template, "imbalance_labels", _DEFAULT_PRO_IMBALANCE_LABELS),
            _DEFAULT_PRO_IMBALANCE_LABELS,
        ),
        root_cause_labels=_normalize_string_dict(
            _get_dict(template, "root_cause_labels", _DEFAULT_PRO_ROOT_CAUSE_LABELS),
            _DEFAULT_PRO_ROOT_CAUSE_LABELS,
        ),
        structure_labels=_normalize_string_dict(
            _get_dict(template, "structure_labels", _DEFAULT_PRO_STRUCTURE_LABELS),
            _DEFAULT_PRO_STRUCTURE_LABELS,
        ),
        status_messages=_normalize_string_dict(
            _get_dict(template, "status_messages", _DEFAULT_PRO_STATUS_MESSAGES),
            _DEFAULT_PRO_STATUS_MESSAGES,
        ),
        narrative_templates=_normalize_string_dict(
            _get_dict(template, "narrative_templates", _DEFAULT_PRO_NARRATIVE_TEMPLATES),
            _DEFAULT_PRO_NARRATIVE_TEMPLATES,
        ),
        imbalance_selection_rules=_normalize_imbalance_selection_rules(
            _get_list(template, "imbalance_selection_rules", [])
        ),
        imbalance_profiles=_normalize_nested_string_dict(
            _get_dict(template, "imbalance_profiles", {}),
            {},
        ),
        healing_suggestion_templates=_get_dict(template, "healing_suggestion_templates", {}),
    )


LITE_REPORT_BLUEPRINT = _build_lite_blueprint(_LITE_TEMPLATE)
PRO_REPORT_BLUEPRINT = _build_pro_blueprint(_PRO_TEMPLATE)

# Backward-compatible aliases for existing orchestrator imports.
LITE_STORY_CONNECTORS = LITE_REPORT_BLUEPRINT.story_connectors
LITE_STORY_SECTION_HEADINGS = LITE_REPORT_BLUEPRINT.story_section_headings
LITE_STORY_CONTENT_TEMPLATES = LITE_REPORT_BLUEPRINT.story_content_templates
LITE_AWARENESS_TITLES = LITE_REPORT_BLUEPRINT.awareness_titles
LITE_THEME_INSIGHT_TEMPLATES = LITE_REPORT_BLUEPRINT.theme_insight_templates
LITE_THEME_LABELS = LITE_REPORT_BLUEPRINT.theme_labels
LITE_TITLE_TEMPLATES = LITE_REPORT_BLUEPRINT.title_templates
LITE_STRUCTURE_LABELS = LITE_REPORT_BLUEPRINT.structure_labels
LITE_NARRATIVE_TEMPLATES = LITE_REPORT_BLUEPRINT.narrative_templates
LITE_AWARENESS_CONTENT_TEMPLATES = LITE_REPORT_BLUEPRINT.awareness_content_templates
LITE_SIX_INSIGHT_DEFAULTS = LITE_REPORT_BLUEPRINT.six_insight_defaults
LITE_SIX_INSIGHT_LAYER1_TEMPLATES = LITE_REPORT_BLUEPRINT.six_insight_layer1_templates
LITE_FALLBACK_EXPERIMENT_CARD = LITE_REPORT_BLUEPRINT.fallback_experiment_card

DEFAULT_PRO_TEASER = PRO_REPORT_BLUEPRINT.default_teaser
PRO_REPORT_TITLE = PRO_REPORT_BLUEPRINT.report_title
PRO_REPORT_INTRO = PRO_REPORT_BLUEPRINT.report_intro
PRO_SECTION_TITLES = PRO_REPORT_BLUEPRINT.section_titles
PRO_FALLBACK_TEXTS = PRO_REPORT_BLUEPRINT.fallback_texts
PRO_CORE_TABLE_LABELS = PRO_REPORT_BLUEPRINT.core_table_labels
PRO_IMBALANCE_LABELS = PRO_REPORT_BLUEPRINT.imbalance_labels
PRO_ROOT_CAUSE_LABELS = PRO_REPORT_BLUEPRINT.root_cause_labels
PRO_STRUCTURE_LABELS = PRO_REPORT_BLUEPRINT.structure_labels
PRO_STATUS_MESSAGES = PRO_REPORT_BLUEPRINT.status_messages
PRO_NARRATIVE_TEMPLATES = PRO_REPORT_BLUEPRINT.narrative_templates
PRO_IMBALANCE_SELECTION_RULES = PRO_REPORT_BLUEPRINT.imbalance_selection_rules
PRO_IMBALANCE_PROFILES = PRO_REPORT_BLUEPRINT.imbalance_profiles
PRO_HEALING_SUGGESTION_TEMPLATES = PRO_REPORT_BLUEPRINT.healing_suggestion_templates

BLUEPRINT_VALIDATION_ISSUES = (
    *LITE_REPORT_BLUEPRINT.validate(),
    *PRO_REPORT_BLUEPRINT.validate(),
)


def build_lite_experiment_content(*, theme_label: str, title: str) -> str:
    """Return a migration-safe experiment card closer to the legacy Lite ritual."""

    return "\n".join(
        step.format(theme_label=theme_label, title=title)
        for step in LITE_REPORT_BLUEPRINT.experiment_steps
    )


def render_lite_template_text(template: str, **context: str) -> str:
    return template.format(**context)


def render_template_text(template: str, **context: str) -> str:
    return template.format(**context)
