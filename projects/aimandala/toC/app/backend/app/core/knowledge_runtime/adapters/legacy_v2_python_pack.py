"""Export the legacy Python V2 knowledge modules into a v2.1 YAML pack."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from app.core.knowledge.color_meanings import (
    COLOR_ALIASES,
    COLOR_ELEMENT_MAPPING,
    COLOR_MEANINGS,
    SPECIAL_COLORS,
)
from app.core.knowledge.five_elements import (
    ELEMENT_PROPERTIES,
    FIVE_ELEMENTS,
    FIVE_ELEMENTS_RELATIONS,
    GENERATING_RELATIONS,
    GENERATION_BECOMES_RESTRAINT,
    OVER_RESTRAINING_RELATIONS,
    RESTRAINING_RELATIONS,
    REVERSE_RESTRAINING_RELATIONS,
)
from app.core.knowledge.imbalance_types import (
    IMBALANCE_CATEGORIES,
    IMBALANCE_TYPES,
    TOB_EXCLUSIVE_TYPES,
    TOC_IMBALANCE_TYPES,
)
from app.core.knowledge.direct_judgments import (
    COLOR_DEPTH_RULES,
    DIRECT_JUDGMENTS,
    WHITESPACE_ANALYSIS,
)
from app.core.knowledge.themes import (
    HEALING_PRESCRIPTIONS,
    IMBALANCE_MAPPINGS,
    INSIGHT_TEMPLATES,
    THEME_COLOR_MEANINGS,
    THEME_CONFIGS,
    THEME_INTERACTIONS,
    get_pro_upgrade_teaser,
)
from app.core.knowledge.three_circles import (
    CIRCLE_COHERENCE_PATTERNS,
    CIRCLE_ENERGY_FLOW,
    ENERGY_FLOW_PATHS,
    ENERGY_FLOW_QUALITY,
    THREE_CIRCLES,
)

DIRECT_JUDGMENTS_SOURCE_PATH = (
    "projects/aimandala/docs/sources/知识库构建/直断法高命中模式.md"
)

DIRECT_JUDGMENT_EVIDENCE_REQUIREMENTS = {
    "颜色浅、轻": ["整体色调浅淡", "下笔轻柔或大面积泛白", "主要颜色饱和度偏低"],
    "颜色浓郁、深重": ["整体填色密度高", "主色或大面积色块偏深", "画面大面积涂满无留白"],
    "整张大面积留白": ["整张画留白比例较高", "留白分布较均匀"],
    "外圈颜色单一且面积大": ["外圈仅有单一主色", "外圈单色占比较大"],
    "大面积黄色": ["黄色在整体或某一圈中面积显著", "黄色为主色调"],
    "外圈花边、星星点点": ["外圈颜色丰富", "外圈呈现零碎、花边、圆点或装饰性强的结构"],
    "外圈红色多": ["外圈存在成片红色", "红色相邻区域不是绿色为主"],
    "渐变色": ["画面出现色彩渐变", "相邻区域或圈层之间呈连续过渡"],
    "蓝绿搭配": ["蓝色和绿色同时明显出现"],
    "内外同色": ["内圈和外圈主色或核心色高度一致"],
    "外白内浓（心门关闭）": ["外圈留白多", "内圈或中圈颜色数量不少于3种"],
}

DIRECT_JUDGMENT_WHITESPACE_RULES = {
    "大量留白": {
        "threshold": "whitespace_ratio > 0.4",
        **WHITESPACE_ANALYSIS["大量留白"],
    },
    "适量留白": {
        "threshold": "0.15 < whitespace_ratio <= 0.4",
        "meaning": "平衡状态，有表达也有空间",
    },
    "少量留白": {
        "threshold": "0.05 < whitespace_ratio <= 0.15",
        **WHITESPACE_ANALYSIS["少量留白"],
    },
    "无留白": {
        "threshold": "whitespace_ratio <= 0.05",
        **WHITESPACE_ANALYSIS["无留白"],
    },
}

HEALING_ISSUE_MAPPINGS = {
    "father_relationship": {
        "水多木漂": {"issue_type": "父爱渴望与缺失"},
        "火多土焦": {"issue_type": "权威恐惧与自我价值受损"},
        "木多火塞": {"issue_type": "成长受阻与金克木"},
        "土多金埋": {"issue_type": "社会认同与金钱观受父辈影响"},
        "金多水浊": {"issue_type": "情绪压抑与沟通障碍"},
        "水多火灭": {"issue_type": "权威恐惧与自我价值受损"},
        "火多金熔": {"issue_type": "情绪压抑与沟通障碍"},
        "金多木折": {"issue_type": "成长受阻与金克木"},
        "木多土陷": {"issue_type": "父爱渴望与缺失"},
        "土多水干": {"issue_type": "情绪压抑与沟通障碍"},
    },
    "general": {
        "水多木漂": {"issue_type": "缺乏方向"},
        "火多土焦": {"issue_type": "能量失衡"},
        "木多火塞": {"issue_type": "情绪压抑"},
        "土多金埋": {"issue_type": "能量失衡"},
        "金多水浊": {"issue_type": "情绪压抑"},
        "水多火灭": {"issue_type": "行动力不足"},
        "火多金熔": {"issue_type": "能量失衡"},
        "金多木折": {"issue_type": "缺乏方向"},
        "木多土陷": {"issue_type": "能量失衡"},
        "土多水干": {"issue_type": "情绪压抑"},
    },
    "health_wellness": {
        "水多木漂": {"issue_type": "深层恐惧"},
        "火多土焦": {"issue_type": "焦虑失眠"},
        "木多火塞": {"issue_type": "情绪压抑"},
        "土多金埋": {"issue_type": "身体僵硬"},
        "金多水浊": {"issue_type": "情绪压抑"},
        "水多火灭": {"issue_type": "深层恐惧"},
        "火多金熔": {"issue_type": "能量耗竭"},
        "金多木折": {"issue_type": "身体僵硬"},
        "木多土陷": {"issue_type": "能量耗竭"},
        "土多水干": {"issue_type": "身体僵硬"},
    },
    "intimate_relationship": {
        "水多木漂": {"issue_type": "依恋焦虑"},
        "火多土焦": {"issue_type": "冲突模式"},
        "木多火塞": {"issue_type": "沟通障碍"},
        "土多金埋": {"issue_type": "情感冷淡"},
        "金多水浊": {"issue_type": "信任问题"},
        "水多火灭": {"issue_type": "亲密恐惧"},
        "火多金熔": {"issue_type": "边界模糊"},
        "金多木折": {"issue_type": "情感冷淡"},
        "木多土陷": {"issue_type": "边界模糊"},
        "土多水干": {"issue_type": "冲突模式"},
    },
    "mother_relationship": {
        "水多木漂": {"issue_type": "安全感不足"},
        "火多土焦": {"issue_type": "情绪冲突"},
        "木多火塞": {"issue_type": "情感压抑"},
        "土多金埋": {"issue_type": "自我价值低"},
        "金多水浊": {"issue_type": "情感压抑"},
        "水多火灭": {"issue_type": "安全感不足"},
        "火多金熔": {"issue_type": "边界模糊"},
        "金多木折": {"issue_type": "自我价值低"},
        "木多土陷": {"issue_type": "过度依赖"},
        "土多水干": {"issue_type": "情感缺失"},
    },
    "parent_child_relationship": {
        "水多木漂": {"issue_type": "孩子缺乏独立性/自信"},
        "火多土焦": {"issue_type": "养育焦虑与控制欲"},
        "木多火塞": {"issue_type": "亲子沟通模式障碍"},
        "土多金埋": {"issue_type": "对孩子的期待与失望"},
        "金多水浊": {"issue_type": "代际创伤传递"},
        "水多火灭": {"issue_type": "养育焦虑与控制欲"},
        "火多金熔": {"issue_type": "亲子沟通模式障碍"},
        "金多木折": {"issue_type": "对孩子的期待与失望"},
        "木多土陷": {"issue_type": "孩子缺乏独立性/自信"},
        "土多水干": {"issue_type": "代际创伤传递"},
    },
    "personal_growth": {
        "水多木漂": {"issue_type": "成长停滞/迷茫"},
        "火多土焦": {"issue_type": "内在冲突/焦虑"},
        "木多火塞": {"issue_type": "情绪压抑/冷漠"},
        "土多金埋": {"issue_type": "缺乏自信/恐惧"},
        "金多水浊": {"issue_type": "情绪压抑/冷漠"},
        "水多火灭": {"issue_type": "缺乏自信/恐惧"},
        "火多金熔": {"issue_type": "内在冲突/焦虑"},
        "金多木折": {"issue_type": "缺乏自信/恐惧"},
        "木多土陷": {"issue_type": "成长停滞/迷茫"},
        "土多水干": {"issue_type": "情绪压抑/冷漠"},
    },
    "wealth_career": {
        "水多木漂": {"issue_type": "事业停滞"},
        "火多土焦": {"issue_type": "事业停滞"},
        "木多火塞": {"issue_type": "事业停滞"},
        "土多金埋": {"issue_type": "不配得感"},
        "金多水浊": {"issue_type": "投资恐惧"},
        "水多火灭": {"issue_type": "财富焦虑"},
        "火多金熔": {"issue_type": "消费冲动"},
        "金多木折": {"issue_type": "不配得感"},
        "木多土陷": {"issue_type": "财务混乱"},
        "土多水干": {"issue_type": "事业停滞"},
    },
}

_TRANSITION_OVERLOAD_IMBALANCE = {
    "category": "阶段迁移",
    "relation": "旧节奏与新节奏切换",
    "mechanism": "旧有模式尚未完全退出，新阶段的拉力又提前进入，导致内在承载出现拥堵",
    "color_features": "主导元素正在切换，三圈推进速度不一致，常见于画面节奏处在重新整理的阶段",
    "psychology": "既想继续往前，又担心自己暂时接不住变化，容易在推进与回撤之间来回拉扯",
    "manifestation": "过渡期里会先想稳住安全感，再决定是否继续行动，因此常呈现想靠近又先后退的状态",
    "three_circles": {
        "inner": "内心仍在确认新的安全感和承载边界",
        "middle": "与关系或任务的连接方式正在重组，容易出现节奏卡顿",
        "outer": "对外表达开始调整，但旧惯性还会把你拉回熟悉模式",
    },
    "healing_direction": "先稳住承载，再分段推进，让新节奏有空间慢慢落地",
    "color_prescription": "增加黄色和绿色稳定根基，辅以少量蓝色帮助过渡期降噪",
    "toc_supported": True,
}

_TRANSITION_OVERLOAD_THEME_MAPPINGS = {
    "general": {
        "核心矛盾": "新旧节奏暂时不同步",
        "具体表现": "一部分自己已经想往前走，另一部分自己还在回头确认安全感",
        "转变方向": "先稳住节奏，再让变化分段落地",
    },
    "father_relationship": {
        "核心矛盾": "想靠近却又先退回",
        "具体表现": "关系节奏正在变化，但你和父亲都还没找到新的相处方式",
        "转变方向": "先稳定沟通节奏，再让新的连接慢慢落地",
    },
    "mother_relationship": {
        "核心矛盾": "依赖与独立同时拉扯",
        "具体表现": "旧的依赖方式在退出，但新的边界和亲密方式还没完全建立",
        "转变方向": "允许关系缓慢重组，用更稳定的节奏表达真实需要",
    },
    "intimate_relationship": {
        "核心矛盾": "想靠近又怕失衡",
        "具体表现": "关系节奏在切换时，你会一边想推进亲密，一边又先把自己收回来",
        "转变方向": "先把感受说清楚，再让靠近和退回都变得可沟通",
    },
    "parent_child_relationship": {
        "核心矛盾": "旧养育节奏跟不上孩子变化",
        "具体表现": "孩子的阶段在变化，但家庭沟通和支持方式还停留在旧模式里",
        "转变方向": "先更新沟通方式，再逐步调整期待和边界",
    },
    "wealth_career": {
        "核心矛盾": "旧节奏退出时承载跟不上",
        "具体表现": "旧项目或旧路径正在退场，但新阶段真正推进前你又会先迟疑和回撤",
        "转变方向": "先稳住基本盘，把变化拆成可承接的小步动作",
    },
    "health_wellness": {
        "核心矛盾": "身体节奏切换时承载超负荷",
        "具体表现": "作息、压力或生活方式正在变化，身体还没完成适配，容易感到疲惫和卡顿",
        "转变方向": "先降噪和减负，让身体有空间重新建立稳定节律",
    },
    "personal_growth": {
        "核心矛盾": "旧身份放不下，新自我又还没站稳",
        "具体表现": "你已经察觉自己要进入下一个阶段，但行动和内在认同还没有完全同步",
        "转变方向": "先允许自己处在过渡期，再用小实验把新节奏慢慢坐实",
    },
}

_TRANSITION_OVERLOAD_HEALING_MAPPINGS = {
    "father_relationship": {"issue_type": "情绪压抑与沟通障碍"},
    "general": {"issue_type": "能量失衡"},
    "health_wellness": {"issue_type": "能量耗竭"},
    "intimate_relationship": {"issue_type": "沟通障碍"},
    "mother_relationship": {"issue_type": "情绪冲突"},
    "parent_child_relationship": {"issue_type": "亲子沟通模式障碍"},
    "personal_growth": {"issue_type": "成长停滞/迷茫"},
    "wealth_career": {"issue_type": "事业停滞"},
}

EXPORTED_IMBALANCE_TYPES = {
    **IMBALANCE_TYPES,
    "transition-overload": _TRANSITION_OVERLOAD_IMBALANCE,
}
EXPORTED_TOC_IMBALANCE_TYPES = [*TOC_IMBALANCE_TYPES, "transition-overload"]
EXPORTED_IMBALANCE_CATEGORIES = {
    **IMBALANCE_CATEGORIES,
    "阶段迁移": ["transition-overload"],
}
EXPORTED_IMBALANCE_MAPPINGS = {
    theme_id: {
        **theme_mappings,
        **(
            {"transition-overload": _TRANSITION_OVERLOAD_THEME_MAPPINGS[theme_id]}
            if theme_id in _TRANSITION_OVERLOAD_THEME_MAPPINGS
            else {}
        ),
    }
    for theme_id, theme_mappings in IMBALANCE_MAPPINGS.items()
}
EXPORTED_HEALING_ISSUE_MAPPINGS = {
    theme_id: {
        **theme_mappings,
        **(
            {"transition-overload": _TRANSITION_OVERLOAD_HEALING_MAPPINGS[theme_id]}
            if theme_id in _TRANSITION_OVERLOAD_HEALING_MAPPINGS
            else {}
        ),
    }
    for theme_id, theme_mappings in HEALING_ISSUE_MAPPINGS.items()
}


def _build_direct_judgment_records() -> list[dict[str, Any]]:
    slug_by_name = {
        "颜色浅、轻": "light_pale_whitish",
        "颜色浓郁、深重": "heavy_dark_filled",
        "整张大面积留白": "overall_whitespace",
        "外圈颜色单一且面积大": "outer_single_color_large_mass",
        "大面积黄色": "large_yellow_mass",
        "外圈花边、星星点点": "outer_decorative_fragmented",
        "外圈红色多": "outer_red_mass",
        "渐变色": "gradient_transition",
        "蓝绿搭配": "blue_green_expression",
        "内外同色": "inner_outer_same_color",
        "外白内浓（心门关闭）": "closed_heart",
    }
    records: list[dict[str, Any]] = []
    for name, judgment in DIRECT_JUDGMENTS.items():
        record = {
            "id": f"direct_judgment.{slug_by_name.get(name, name)}",
            "name": name,
            "visual_pattern": judgment.get("pattern", ""),
            "meaning": judgment.get("meaning", ""),
            "detail": judgment.get("detail", ""),
            "principle": judgment.get("principle", ""),
            "suggestion": judgment.get("suggestion", ""),
            "severity": judgment.get("severity", ""),
            "evidence_requirements": DIRECT_JUDGMENT_EVIDENCE_REQUIREMENTS.get(name, []),
        }
        records.append(record)
    return records


def _asset(
    *,
    asset_id: str,
    asset_type: str,
    payload: dict[str, Any],
    relations: dict[str, Any] | None = None,
    source: str = "legacy_v2_python",
    review_status: str = "migrated",
) -> dict[str, Any]:
    return {
        "id": asset_id,
        "type": asset_type,
        "version": "v2.1",
        "status": "active",
        "source": source,
        "review_status": review_status,
        "payload": payload,
        "relations": relations or {},
    }


@dataclass
class LegacyV2PythonPackExporter:
    """One-time exporter from the current Python V2 knowledge modules."""

    pack_root: Path | None = None

    def __post_init__(self) -> None:
        if self.pack_root is None:
            self.pack_root = (
                Path(__file__).resolve().parents[6] / "data" / "knowledge" / "packs" / "v2.1"
            )

    def export(self) -> dict[str, Any]:
        assert self.pack_root is not None
        self._ensure_dirs()
        entries = self._write_assets()
        manifest = {
            "pack_id": "aimandala-v2.1",
            "schema_version": "v2.1",
            "status": "active",
            "source": "legacy_v2_python",
            "description": "Exported from current Python V2 knowledge modules for the v2.1 runtime",
            "entries": entries,
        }
        self._write_yaml(self.pack_root / "manifest.yaml", manifest)
        return {"pack_root": str(self.pack_root), "manifest": manifest}

    def _ensure_dirs(self) -> None:
        for category in ["elements", "circles", "themes", "rules", "healing", "narrative"]:
            (self.pack_root / category).mkdir(parents=True, exist_ok=True)

    def _write_assets(self) -> dict[str, list[str]]:
        entries: dict[str, list[str]] = {
            "elements": [],
            "circles": [],
            "themes": [],
            "rules": [],
            "healing": [],
            "narrative": [],
        }

        element_assets = {
            "elements/five_elements.yaml": _asset(
                asset_id="element.five_elements",
                asset_type="element",
                payload={
                    "five_elements": FIVE_ELEMENTS,
                    "element_properties": ELEMENT_PROPERTIES,
                    "relations": {
                        "five_elements_relations": FIVE_ELEMENTS_RELATIONS,
                        "generating_relations": GENERATING_RELATIONS,
                        "restraining_relations": RESTRAINING_RELATIONS,
                        "over_restraining_relations": OVER_RESTRAINING_RELATIONS,
                        "reverse_restraining_relations": REVERSE_RESTRAINING_RELATIONS,
                        "generation_becomes_restraint": GENERATION_BECOMES_RESTRAINT,
                    },
                },
            ),
            "elements/color_meanings.yaml": _asset(
                asset_id="element.color_meanings",
                asset_type="element",
                payload={
                    "color_meanings": COLOR_MEANINGS,
                    "color_aliases": COLOR_ALIASES,
                    "color_element_mapping": COLOR_ELEMENT_MAPPING,
                    "special_colors": SPECIAL_COLORS,
                },
            ),
        }
        for rel_path, payload in element_assets.items():
            self._write_yaml(self.pack_root / rel_path, payload)
            entries["elements"].append(rel_path)

        circle_asset = _asset(
            asset_id="circle.three_circles",
            asset_type="circle",
            payload={
                "three_circles": THREE_CIRCLES,
                "coherence_patterns": CIRCLE_COHERENCE_PATTERNS,
                "energy_flow": CIRCLE_ENERGY_FLOW,
                "energy_flow_paths": ENERGY_FLOW_PATHS,
                "energy_flow_quality": ENERGY_FLOW_QUALITY,
            },
        )
        self._write_yaml(self.pack_root / "circles/three_circles.yaml", circle_asset)
        entries["circles"].append("circles/three_circles.yaml")

        for theme_id in sorted(THEME_CONFIGS.keys()):
            theme_payload = {
                **THEME_CONFIGS.get(theme_id, {}),
                "theme_id": THEME_CONFIGS.get(theme_id, {}).get("theme_id", theme_id),
                "color_meanings": THEME_COLOR_MEANINGS.get(theme_id, {}),
                "interactions": THEME_INTERACTIONS.get(theme_id, {}),
                "imbalance_mappings": IMBALANCE_MAPPINGS.get(theme_id, {}),
            }
            theme_asset = _asset(
                asset_id=f"theme.{theme_id}",
                asset_type="theme",
                payload=theme_payload,
                relations={
                    "healing_asset": f"healing.{theme_id}",
                    "narrative_asset": f"narrative.{theme_id}",
                },
            )
            theme_rel_path = f"themes/{theme_id}.yaml"
            self._write_yaml(self.pack_root / theme_rel_path, theme_asset)
            entries["themes"].append(theme_rel_path)

            healing_asset = _asset(
                asset_id=f"healing.{theme_id}",
                asset_type="healing",
                payload={
                    "theme_id": theme_id,
                    "healing_prescriptions": HEALING_PRESCRIPTIONS.get(theme_id, {}),
                    "healing_template": THEME_CONFIGS.get(theme_id, {}).get("healing_template", {}),
                },
                relations={"theme": f"theme.{theme_id}"},
            )
            healing_rel_path = f"healing/{theme_id}.yaml"
            self._write_yaml(self.pack_root / healing_rel_path, healing_asset)
            entries["healing"].append(healing_rel_path)

            narrative_asset = _asset(
                asset_id=f"narrative.{theme_id}",
                asset_type="narrative",
                payload={
                    "theme_id": theme_id,
                    "insight_templates": INSIGHT_TEMPLATES.get(theme_id, {}),
                    "pro_upgrade_teaser": get_pro_upgrade_teaser(theme_id),
                },
                relations={"theme": f"theme.{theme_id}"},
            )
            narrative_rel_path = f"narrative/{theme_id}.yaml"
            self._write_yaml(self.pack_root / narrative_rel_path, narrative_asset)
            entries["narrative"].append(narrative_rel_path)

        rules_assets = {
            "rules/direct_judgments.yaml": _asset(
                asset_id="rule.direct_judgments",
                asset_type="rule",
                source=DIRECT_JUDGMENTS_SOURCE_PATH,
                review_status="source_aligned",
                payload={
                    "source_of_truth": {
                        "path": DIRECT_JUDGMENTS_SOURCE_PATH,
                        "title": "直断特征 - 快速识别关键心理特征",
                        "note": "直断知识只以此 Markdown 为原始真值源；本 YAML 是运行时知识包投影。",
                    },
                    "catalog_version": "direct_judgments.v2.1",
                    "usage": {
                        "stage": "stage-04-direct-judgment-high-hit-check",
                        "purpose": "检查画作是否命中高命中特征，作为后续逐圈解读的提示线索。",
                        "boundary": "直断结果不是最终结论，必须被逐圈颜色、形状、五行生克和能量流动继续验证。",
                    },
                    "judgments": _build_direct_judgment_records(),
                    "color_depth_rules": COLOR_DEPTH_RULES,
                    "whitespace_rules": DIRECT_JUDGMENT_WHITESPACE_RULES,
                },
                relations={
                    "source_markdown": [DIRECT_JUDGMENTS_SOURCE_PATH],
                    "related_runtime": [
                        "projects/aimandala/toC/app/backend/app/core/knowledge/direct_judgments.py"
                    ],
                },
            ),
            "rules/imbalance_types.yaml": _asset(
                asset_id="rule.imbalance_types",
                asset_type="rule",
                payload={
                    "imbalances": EXPORTED_IMBALANCE_TYPES,
                    "toc_supported": EXPORTED_TOC_IMBALANCE_TYPES,
                    "tob_exclusive": TOB_EXCLUSIVE_TYPES,
                    "categories": EXPORTED_IMBALANCE_CATEGORIES,
                },
            ),
            "rules/theme_mappings.yaml": _asset(
                asset_id="rule.theme_mappings",
                asset_type="rule",
                payload={"mappings": EXPORTED_IMBALANCE_MAPPINGS},
            ),
            "rules/healing_issue_mappings.yaml": _asset(
                asset_id="rule.healing_issue_mappings",
                asset_type="rule",
                payload={"mappings": EXPORTED_HEALING_ISSUE_MAPPINGS},
            ),
            "healing/templates.yaml": _asset(
                asset_id="healing.templates",
                asset_type="healing",
                payload={
                    "templates": {
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
                },
            ),
        }
        for rel_path, payload in rules_assets.items():
            self._write_yaml(self.pack_root / rel_path, payload)
            if rel_path.startswith("rules/"):
                entries["rules"].append(rel_path)
            else:
                entries["healing"].append(rel_path)

        entries["elements"].sort()
        entries["circles"].sort()
        entries["themes"].sort()
        entries["rules"].sort()
        entries["healing"].sort()
        entries["narrative"].sort()
        return entries

    def _write_yaml(self, path: Path, payload: dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            yaml.safe_dump(
                payload,
                allow_unicode=True,
                sort_keys=False,
                default_flow_style=False,
            ),
            encoding="utf-8",
        )
