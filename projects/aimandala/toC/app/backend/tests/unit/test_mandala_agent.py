"""Baseline tests for the native mandala interpretation agent path."""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

from app.core.mandala_interpretation_agent.agent import MandalaInterpretationAgent
from app.core.mandala_interpretation_agent.contracts import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.mandala_interpretation_agent.knowledge_pack_builder import (
    KnowledgePackBuilder,
)
from app.core.mandala_interpretation_agent.quality_gate import run_quality_gate
from app.core.wealth_report import get_wealth_report_runtime


def _extract_prompt_payload(prompt: str) -> dict:
    payload_start = prompt.rfind("\n{")
    assert payload_start != -1
    return json.loads(prompt[payload_start + 1 :])


class StubMandalaLLMClient:
    def __init__(self) -> None:
        self.structured_calls: list[dict] = []
        self.text_calls: list[dict] = []
        self.last_attempt_trace = [{"model": "stub", "result": "ok"}]

    def generate_structured(self, **kwargs):
        self.structured_calls.append(kwargs)
        return self.foundation_payload()

    def foundation_payload(self):
        return {
            "foundation_image_reading": {
                "visual_observation": {
                    "overall_observation": {
                        "first_impression": "画面从内向外有收束后展开的节奏。",
                        "main_visual_content": "内圈蓝色圆形，中圈粉色花瓣和留白，外圈白色边界。",
                        "visual_atmosphere": "整体柔和，但中圈留白形成分隔。",
                        "visual_weight_and_rhythm": "重心在内圈，外圈边界清楚。",
                    },
                    "three_circle_observation": {
                        "inner": "内圈蓝色圆形收在中心。",
                        "middle": "中圈粉色花瓣之间有白色留白。",
                        "outer": "外圈白色留白边界明显。",
                        "cross_circle_visual_connection": "内圈到中圈有展开，外圈形成收束边界。",
                    },
                    "circle_visual_units": {
                        "inner": {
                            "composition_description": "内圈以蓝色圆形为中心。",
                            "visual_units": [
                                {
                                    "id": "inner-001",
                                    "unit_name": "蓝色圆形",
                                    "position": "内圈中心",
                                    "source_type": "user_painted",
                                    "color_description": "蓝色",
                                    "shape_description": "圆形",
                                    "texture_and_density": "填色集中，面积中等。",
                                    "spatial_relations": "位于中心，外侧连接中圈粉色花瓣。",
                                    "blank_space_role": "none",
                                    "energy_ratio_percent": 100,
                                    "rich_visual_description": "内圈中心可见蓝色圆形，是画面重心。",
                                }
                            ],
                        },
                        "middle": {
                            "composition_description": "中圈由粉色花瓣和花瓣间留白组成。",
                            "visual_units": [
                                {
                                    "id": "middle-001",
                                    "unit_name": "粉色花瓣",
                                    "position": "中圈",
                                    "source_type": "user_painted",
                                    "color_description": "粉色",
                                    "shape_description": "花瓣状",
                                    "texture_and_density": "重复排列，密度中等。",
                                    "spatial_relations": "同类花瓣围绕中心重复，相邻花瓣被 middle-002 留白隔开。",
                                    "blank_space_role": "none",
                                    "energy_ratio_percent": 100,
                                    "rich_visual_description": "中圈粉色花瓣重复围绕内圈展开。",
                                },
                                {
                                    "id": "middle-002",
                                    "unit_name": "花瓣间留白",
                                    "position": "中圈花瓣之间",
                                    "source_type": "blank_space",
                                    "color_description": "白色留白",
                                    "shape_description": "细缝状间隔",
                                    "texture_and_density": "重复出现，分布在花瓣之间。",
                                    "spatial_relations": "隔开相邻粉色花瓣，并切分中圈连续性。",
                                    "blank_space_role": "隔开、切分粉色花瓣。",
                                    "energy_ratio_percent": 35,
                                    "rich_visual_description": "中圈花瓣之间的白色留白把粉色元素分成独立单元。",
                                },
                            ],
                        },
                        "outer": {
                            "composition_description": "外圈由白色留白边界形成。",
                            "visual_units": [
                                {
                                    "id": "outer-001",
                                    "unit_name": "外圈白色边界",
                                    "position": "外圈",
                                    "source_type": "blank_space",
                                    "color_description": "白色留白",
                                    "shape_description": "边界状",
                                    "texture_and_density": "面积较明显，包围外圈。",
                                    "spatial_relations": "位于最外层，包围中圈和内圈。",
                                    "blank_space_role": "形成外圈边界。",
                                    "energy_ratio_percent": 100,
                                    "rich_visual_description": "外圈白色留白形成清楚的外部边界。",
                                }
                            ],
                        },
                    },
                },
                "element_sensing": {
                    "inner": {
                        "element_candidates": [
                            {
                                "visual_unit_id": "inner-001",
                                "element": "water",
                                "basis": ["蓝色"],
                                "confidence": "high",
                                "notes": "按颜色判为水。",
                            }
                        ],
                        "summary": "内圈有水元素候选。",
                    },
                    "middle": {
                        "element_candidates": [
                            {
                                "visual_unit_id": "middle-001",
                                "element": "fire",
                                "basis": ["粉色", "花瓣状"],
                                "confidence": "medium",
                                "notes": "粉色作为弱火候选。",
                            },
                            {
                                "visual_unit_id": "middle-002",
                                "element": "metal",
                                "basis": ["白色留白", "切分"],
                                "confidence": "high",
                                "notes": "留白按金处理。",
                            },
                        ],
                        "summary": "中圈有火与金元素候选。",
                    },
                    "outer": {
                        "element_candidates": [
                            {
                                "visual_unit_id": "outer-001",
                                "element": "metal",
                                "basis": ["白色留白", "边界"],
                                "confidence": "high",
                                "notes": "留白边界按金处理。",
                            }
                        ],
                        "summary": "外圈有金元素候选。",
                    },
                },
                "intra_circle_relations": {
                    "inner": {
                        "relations": [
                            {
                                "relation_id": "inner-rel-001",
                                "relation_type": "insufficient_evidence",
                                "involved_visual_unit_ids": ["inner-001"],
                                "visible_basis": "内圈只有一个主要视觉单元。",
                                "confidence": "high",
                                "notes": "不足以判断同圈生克。",
                            }
                        ],
                        "summary": "内圈同圈关系证据不足。",
                    },
                    "middle": {
                        "relations": [
                            {
                                "relation_id": "middle-rel-001",
                                "relation_type": "cut_by_metal",
                                "involved_visual_unit_ids": ["middle-001", "middle-002"],
                                "visible_basis": "白色留白隔开粉色花瓣。",
                                "confidence": "high",
                                "notes": "留白切分粉色花瓣。",
                            }
                        ],
                        "summary": "中圈有金切分火的候选。",
                    },
                    "outer": {
                        "relations": [
                            {
                                "relation_id": "outer-rel-001",
                                "relation_type": "insufficient_evidence",
                                "involved_visual_unit_ids": ["outer-001"],
                                "visible_basis": "外圈只有留白边界。",
                                "confidence": "high",
                                "notes": "不足以判断同圈生克。",
                            }
                        ],
                        "summary": "外圈同圈关系证据不足。",
                    },
                },
                "cross_circle_flow": {
                    "flow_observations": [
                        {
                            "flow_id": "flow-001",
                            "flow_type": "outer_layer_containing",
                            "involved_circles": ["inner", "middle", "outer"],
                            "visual_basis": "外圈白色边界包围内圈和中圈。",
                            "confidence": "high",
                        }
                    ],
                    "summary": "三圈由中心向外展开，外圈形成包围和收束。",
                },
                "evidence_links": [
                    {
                        "claim_id": "inner-001",
                        "claim_type": "element_sensing",
                        "claim_text": "内圈蓝色圆形为水元素候选。",
                        "visual_unit_ids": ["inner-001"],
                        "circle_observation_refs": ["visual_observation.circle_visual_units.inner"],
                        "evidence_text": "内圈中心可见蓝色圆形。",
                    },
                    {
                        "claim_id": "middle-001",
                        "claim_type": "element_sensing",
                        "claim_text": "中圈粉色花瓣为火元素候选。",
                        "visual_unit_ids": ["middle-001"],
                        "circle_observation_refs": ["visual_observation.circle_visual_units.middle"],
                        "evidence_text": "中圈粉色花瓣重复围绕内圈展开。",
                    },
                    {
                        "claim_id": "middle-002",
                        "claim_type": "element_sensing",
                        "claim_text": "中圈留白为金元素候选。",
                        "visual_unit_ids": ["middle-002"],
                        "circle_observation_refs": ["visual_observation.circle_visual_units.middle"],
                        "evidence_text": "中圈花瓣之间的白色留白把粉色元素分成独立单元。",
                    },
                    {
                        "claim_id": "outer-001",
                        "claim_type": "element_sensing",
                        "claim_text": "外圈白色边界为金元素候选。",
                        "visual_unit_ids": ["outer-001"],
                        "circle_observation_refs": ["visual_observation.circle_visual_units.outer"],
                        "evidence_text": "外圈白色留白形成清楚的外部边界。",
                    },
                    {
                        "claim_id": "inner-rel-001",
                        "claim_type": "intra_circle_relation",
                        "claim_text": "内圈同圈关系证据不足。",
                        "visual_unit_ids": ["inner-001"],
                        "circle_observation_refs": ["visual_observation.circle_visual_units.inner"],
                        "evidence_text": "内圈只有一个主要视觉单元。",
                    },
                    {
                        "claim_id": "middle-rel-001",
                        "claim_type": "intra_circle_relation",
                        "claim_text": "中圈留白切分粉色花瓣。",
                        "visual_unit_ids": ["middle-001", "middle-002"],
                        "circle_observation_refs": ["visual_observation.circle_visual_units.middle"],
                        "evidence_text": "白色留白隔开粉色花瓣。",
                    },
                    {
                        "claim_id": "outer-rel-001",
                        "claim_type": "intra_circle_relation",
                        "claim_text": "外圈同圈关系证据不足。",
                        "visual_unit_ids": ["outer-001"],
                        "circle_observation_refs": ["visual_observation.circle_visual_units.outer"],
                        "evidence_text": "外圈只有留白边界。",
                    },
                    {
                        "claim_id": "flow-001",
                        "claim_type": "cross_circle_flow",
                        "claim_text": "外圈形成包围和收束。",
                        "visual_unit_ids": ["outer-001"],
                        "circle_observation_refs": ["visual_observation.three_circle_observation"],
                        "evidence_text": "外圈白色边界包围内圈和中圈。",
                    },
                ],
            }
        }

    def generate_text(self, **kwargs):
        self.text_calls.append(kwargs)
        user_prompt = str(kwargs.get("user_prompt") or "")
        if "生成圈内五行识别、圈内关系和三圈能量流动" in user_prompt:
            foundation = self.foundation_payload()["foundation_image_reading"]
            return json.dumps(
                {
                    "element_sensing": foundation["element_sensing"],
                    "intra_circle_relations": foundation["intra_circle_relations"],
                    "cross_circle_flow": foundation["cross_circle_flow"],
                },
                ensure_ascii=False,
            )
        if "请从已有证据中选择报告切入点" in user_prompt:
            return json.dumps(
                {
                    "core_thesis": "核心主轴是先稳住，再推进。",
                    "user_facing_framing": "先从能接住的小步开始。",
                    "healing_direction": "先确认承接，再逐步打开。",
                    "evidence_refs": ["inner-001", "middle-001", "outer-001"],
                },
                ensure_ascii=False,
        )
        return (
            "# 财富议题曼陀罗解读报告\n\n"
            "## 画面证据速写\n"
            "内圈蓝色圆形呈现出收束感，中圈粉色花瓣带来情绪拉扯，外圈白色边界显示现实层面的留白与谨慎。"
            "这些画面依据共同指向一个财富主题：你并不是没有资源，而是在资源进入现实交换前，会先确认自己是否安全、是否能接住。\n\n"
            "## 五行感知\n"
            "五行只看圈内元素信号：内圈里的蓝色元素对应水，圆形形状可以辅助观察收束与稳定；中圈里的粉色花瓣元素对应弱火；"
            "外圈里的白色边界元素对应金。这里不是给整圈贴五行标签，而是把颜色和形状拆成可观察元素；同圈若有多个元素，再看它们之间是否形成生克候选。\n\n"
            "## 财富核心解读\n"
            "这份画面更像是在说，财富流动的关键不是立刻扩大规模，而是先让内在价值、情绪承接和外部边界之间形成更稳定的通道。"
            "当内圈足够稳定，中圈的拉扯被看见，外圈的边界就可以从封闭变成选择性的打开。\n\n"
            "## 温和行动建议\n"
            "接下来可以选择一个低风险的小行动：记录一次想花钱或想回避表达时的身体感受，或者把一个小价值分享给可信任的人。"
            "重点不是马上改变财富结果，而是练习让价值被看见、被回应，并观察自己是否仍然能保持稳定。"
            "如果这一步做起来仍然紧张，可以把行动再缩小：只写下一个想表达的价值点，或只发给一个最安全的人看。"
            "这样做的意义，是让财富议题从抽象的焦虑变成一次具体、可承接、可复盘的小交换。"
            "当你愿意把一个价值点放到关系里、市场里或一次真实对话里，它就不再只停留在内在判断中。"
            "这份练习会逐步建立一种新的经验：我可以带着边界进入交换，也可以在交换之后仍然保有自己的稳定。"
            "财富在这里不是单纯的收入数字，而是价值被看见、被承接、被回应之后形成的流动。"
            "如果后续还想继续观察，可以把每一次小交换前后的情绪、身体感受和现实反馈放在一起看，"
            "这样更容易区分真正的风险和习惯性的收缩。"
            "当这些记录逐渐累积，你会更清楚地看见：哪些边界是在保护你，哪些边界已经让资源停在门外。"
            "财富议题的推进就可以从这里开始，先不追求大幅改变，只让一次小而真实的流动发生。"
        )


def _agent_input(tmp_path: Path, *, theme: str = "wealth") -> MandalaAgentInput:
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")
    return MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(local_path=str(image_path)),
        user_context=MandalaUserContext(
            theme=theme,
            theme_label="财富议题",
            painting_intention="想看财富为何总卡住",
            painting_feeling="有点紧",
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "manual",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def test_foundation_reading_passes_marked_image_as_second_vision_input(tmp_path):
    image_path = tmp_path / "mandala.jpg"
    marked_image_path = tmp_path / "mandala-3q.jpg"
    image_path.write_bytes(b"fake-image")
    marked_image_path.write_bytes(b"fake-marked-image")
    llm_client = StubMandalaLLMClient()
    agent_input = MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(
            local_path=str(image_path),
            marked_local_path=str(marked_image_path),
        ),
        user_context=MandalaUserContext(theme="wealth", theme_label="财富议题"),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "manual",
        },
    )

    MandalaInterpretationAgent(llm_client=llm_client).run_foundation_image_reading(
        agent_input=agent_input,
    )

    vision_call = llm_client.structured_calls[0]
    assert vision_call["image_paths"] == [str(image_path), str(marked_image_path)]
    assert "三圈标记图" in vision_call["prompt"]
    assert "内圈、中圈、外圈边界" in vision_call["prompt"]
    assert "CIRCLE_BOUNDARY_DATA" not in vision_call["prompt"]


def test_foundation_reading_generates_evidence_links_when_model_omits_them(tmp_path):
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")
    llm_client = StubMandalaLLMClient()
    original_generate_structured = llm_client.generate_structured

    def generate_structured_without_links(**kwargs):
        payload = original_generate_structured(**kwargs)
        del payload["foundation_image_reading"]["evidence_links"]
        return payload

    llm_client.generate_structured = generate_structured_without_links
    agent_input = MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(local_path=str(image_path)),
        user_context=MandalaUserContext(theme="wealth", theme_label="财富议题"),
        circle_boundaries={},
    )

    result = MandalaInterpretationAgent(llm_client=llm_client).run_foundation_image_reading(
        agent_input=agent_input,
    )

    links = result["foundation_image_reading"]["evidence_links"]
    assert links
    assert any(link["claim_type"] == "element_sensing" for link in links)


def test_mandala_agent_produces_complete_path_artifacts(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    theme_entries = knowledge_pack["entries"]["theme"]
    five_element_imbalances = knowledge_pack["entries"]["five_element_imbalances"]
    assert five_element_imbalances["status"] == "loaded"
    assert "完整五行失衡从理论上可以扩展为 30 种" in five_element_imbalances["text"]
    assert "五行失衡只用于圈内元素之间的关系判断" in five_element_imbalances["text"]
    assert theme_entries["wealth_emergent_topic_translation"]["status"] == "loaded"
    assert "emergent_topic: relationship" in theme_entries["wealth_emergent_topic_translation"]["text"]
    assert theme_entries["wealth_next_exploration_mapping"]["status"] == "loaded"
    assert "父亲关系 / 权威与成功" in theme_entries["wealth_next_exploration_mapping"]["text"]
    assert knowledge_pack["entries"]["report_style_guide"]["status"] == "loaded"
    assert knowledge_pack["entries"]["foundation_image_reading_schema"]["status"] == "loaded"
    assert "留白、真实白色、色块间空隙一律按金处理" in knowledge_pack["entries"]["foundation_image_reading_schema"]["text"]
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    assert result.agent_output["status"] == "complete"
    assert result.agent_input["user_context"]["theme"] == "wealth"
    assert result.knowledge_pack["theme"] == "wealth"
    foundation = result.stage_outputs["foundation-image-reading"]["foundation_image_reading"]
    assert foundation["visual_observation"]["circle_visual_units"]["middle"]["visual_units"][1]["source_type"] == "blank_space"
    middle_units = foundation["visual_observation"]["circle_visual_units"]["middle"]["visual_units"]
    assert sum(unit["energy_ratio_percent"] for unit in middle_units) == 100
    assert foundation["element_sensing"]["middle"]["element_candidates"][1]["element"] == "metal"
    assert foundation["intra_circle_relations"]["middle"]["relations"][0]["relation_type"] == "cut_by_metal"
    assert foundation["cross_circle_flow"]["flow_observations"][0]["flow_type"] == "outer_layer_containing"
    assert result.stage_outputs["report-branching-plan"]["report_mode"] == "lite"
    theme_route = result.stage_outputs["report-branching-plan"]["theme_route"]
    assert theme_route["theme"] == "wealth"
    assert theme_route["selected_clause_ids"]
    assert theme_route["clauses"]
    assert theme_route["next_exploration_recommendations"]
    assert (
        result.report_context_package["theme_interpretation"]["route"][
            "next_exploration_recommendations"
        ]
        == theme_route["next_exploration_recommendations"]
    )
    assert result.report_context_package["theme_interpretation"]["route"]["selected_clause_ids"]
    assert result.final_report["summary"] == "核心主轴是先稳住，再推进。"
    assert result.quality_gate["passed"] is True
    assert "stage-" not in result.final_report_md

    report_prompt_payload = _extract_prompt_payload(llm_client.text_calls[-1]["user_prompt"])
    assert report_prompt_payload["writing_inputs"]["theme_route"]["selected_clause_ids"]
    assert report_prompt_payload["writing_inputs"]["element_sensing"]["middle"]["element_candidates"][1]["element"] == "metal"
    vision_prompt = llm_client.structured_calls[0]["prompt"]
    assert "source_type" in vision_prompt
    assert "模板黑线" in vision_prompt
    assert "三圈标记线" in vision_prompt
    assert "精简知识包" not in vision_prompt
    assert "用户主题" not in vision_prompt


def test_mandala_agent_report_prompt_includes_mode_structure(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")
    agent_input = MandalaAgentInput(
        report_mode="pro",
        image=MandalaImageInput(local_path=str(image_path)),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention="想看财富为何总卡住",
            painting_feeling="有点紧",
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "manual",
        },
        output_requirements=MandalaOutputRequirements(),
    )
    MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=agent_input,
        knowledge_pack=knowledge_pack,
    )

    report_prompt = llm_client.text_calls[-1]["user_prompt"]

    assert "Pro 版结构固定为 8 段" in report_prompt
    assert "标题必须明确包含“财富议题”" in report_prompt
    assert "不要用“好的”" in report_prompt
    assert "圈内元素五行感知" in report_prompt
    assert "先写元素，再写圈层" in report_prompt
    assert "不能写跨圈五行生克" in report_prompt
    assert "不得把某一圈的五行与另一圈的五行做因果" in report_prompt
    assert "不是给整圈判定五行" in report_prompt
    assert "不要写“内圈属水”" in report_prompt
    assert "财富核心解读段不要出现木火土金水" in report_prompt
    assert "不能写成确定根因" in report_prompt
    assert "背景线索必须融入对应三圈的画面解读中" in report_prompt
    assert "不要单独设“浮现议题”段落" in report_prompt
    assert "下一次曼陀罗探索建议" in report_prompt
    assert "报告语言风格只遵循知识包中的《报告语言风格指南》" in report_prompt
    assert "报告语言风格只遵循知识包中的《报告语言风格指南》" in report_prompt


def test_mandala_agent_foundation_reading_keeps_intra_circle_relations(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    foundation = result.stage_outputs["foundation-image-reading"]["foundation_image_reading"]
    middle_sensing = foundation["element_sensing"]["middle"]
    middle_relations = foundation["intra_circle_relations"]["middle"]

    assert middle_sensing["element_candidates"]
    assert middle_relations["relations"]
    assert {"visual_unit_id", "element", "basis", "confidence", "notes"} <= set(
        middle_sensing["element_candidates"][0].keys()
    )


def test_mandala_agent_quality_gate_rejects_internal_leaks(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md="这里泄漏了 stage-。",
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "final_report_internal_text_leak" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_empty_visual_evidence(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    stage_outputs = deepcopy(result.stage_outputs)
    stage_outputs["foundation-image-reading"]["foundation_image_reading"]["visual_observation"][
        "circle_visual_units"
    ] = {}

    quality = run_quality_gate(
        stage_outputs=stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=result.final_report_md,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "missing_foundation_visual_units" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_invalid_visual_unit_source_type(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    stage_outputs = deepcopy(result.stage_outputs)
    stage_outputs["foundation-image-reading"]["foundation_image_reading"]["visual_observation"][
        "circle_visual_units"
    ]["inner"]["visual_units"][0]["source_type"] = "template_line"

    quality = run_quality_gate(
        stage_outputs=stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=result.final_report_md,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "invalid_foundation_image_reading_schema" in quality["failure_ids"]
    assert "inner_0_invalid_source_type" in quality["details"]["visual_schema_issues"]


def test_mandala_agent_quality_gate_rejects_missing_evidence_link(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    stage_outputs = deepcopy(result.stage_outputs)
    stage_outputs["foundation-image-reading"]["foundation_image_reading"]["evidence_links"] = []

    quality = run_quality_gate(
        stage_outputs=stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=result.final_report_md,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "invalid_foundation_image_reading_schema" in quality["failure_ids"]
    assert "evidence_links_missing" in quality["details"]["visual_schema_issues"]


def test_mandala_agent_quality_gate_rejects_financial_promises(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md="这份报告提供投资建议和收益预测。",
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "final_report_internal_text_leak" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_short_report_shape(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md="# 财富议题\n\n太短。",
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "invalid_final_report_shape" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_report_without_five_element_analysis(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = "# 财富议题曼陀罗解读报告\n\n" + "画面依据与财富解读。" * 80

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "missing_visible_five_element_analysis" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_cross_circle_five_element_relations(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = (
        "# 财富议题曼陀罗解读报告\n\n"
        "## 五行感知\n"
        "五行中的水与火是当前画面依据。\n\n"
        "## 三圈分层解读\n"
        "这里错误地写成内圈水生中圈木，混淆了三圈联动和五行生克。"
        + "画面依据与财富解读。" * 80
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "cross_circle_five_element_relation_leak" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_cross_circle_element_tension(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = (
        "# 财富议题曼陀罗解读报告\n\n"
        "## 五行感知\n"
        "五行中的土与木是当前画面依据。\n\n"
        "## 财富核心解读\n"
        "主要财富卡点在于内圈本源层的土性稳定需求与中圈木性想要向外流动之间互相拉扯。"
        + "画面依据与财富解读。" * 80
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "cross_circle_five_element_relation_leak" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_whole_circle_element_label(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = (
        "# 财富议题曼陀罗解读报告\n\n"
        "## 五行感知\n"
        "五行元素里，颜色和形状都需要逐个拆看，但这里错误地写成内圈属水。"
        + "画面依据与财富解读。" * 80
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "cross_circle_five_element_relation_leak" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_methods_leak_into_wealth_core(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = (
        "# 财富议题曼陀罗解读报告\n\n"
        "## 五行感知\n"
        "五行元素里，颜色和形状都需要逐个拆看。\n\n"
        "## 财富核心解读\n"
        "这里错误地把木火土金水又写进了财富主轴，所以应该失败。"
        + "画面依据与财富解读。" * 80
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "wealth_core_method_leak" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_deterministic_family_cause(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = (
        "# 财富议题曼陀罗解读报告\n\n"
        "## 五行感知\n"
        "五行中的土与金是当前画面依据。\n\n"
        "## 三圈分层解读\n"
        "这份紧绷很可能与早期家庭中学到的承担方式有关。"
        + "画面依据与财富解读。" * 80
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "deterministic_cause_claim" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_non_h1_title(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = "### 财富议题曼陀罗解读报告\n\n" + "画面依据与财富解读。" * 80

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "title_missing_wealth_topic" in quality["details"]["report_shape_issues"]


def test_mandala_agent_quality_gate_rejects_generic_opening(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = "# 财富议题曼陀罗解读报告\n\n你好，感谢你的信任。" + "画面依据与财富解读。" * 80

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "generic_greeting_opening" in quality["details"]["report_shape_issues"]


def test_mandala_agent_quality_gate_rejects_overlong_lite_report(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    report = "# 财富议题曼陀罗解读报告\n\n## 五行感知\n五行中的水与金是当前画面依据。\n\n" + "画面依据与财富解读。" * 160

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=report,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "too_long_max_1600" in quality["details"]["report_shape_issues"]


def test_mandala_agent_quality_gate_allows_boundary_disclaimer(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md="本报告用于个人觉察参考，不构成投资建议或心理诊断。",
        report_context_package=result.report_context_package,
    )

    assert "final_report_internal_text_leak" not in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_unstructured_foundation_observation(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    stage_outputs = deepcopy(result.stage_outputs)
    stage_outputs["foundation-image-reading"]["foundation_image_reading"]["visual_observation"][
        "circle_visual_units"
    ] = {
        "inner": {"composition_description": "中心红色星形。", "visual_units": []},
        "middle": {"composition_description": "中圈绿色叶片。", "visual_units": []},
        "outer": {"composition_description": "外圈边界闭合。", "visual_units": []},
    }

    quality = run_quality_gate(
        stage_outputs=stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=result.final_report_md,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "invalid_foundation_image_reading_schema" in quality["failure_ids"]


def test_wealth_runtime_routes_and_context():
    runtime = get_wealth_report_runtime()

    context = runtime.get_topic_context(report_mode="pro")
    route = runtime.route_visual_observations(
        {
            "outer_circle": "外圈红色很多，边界留白也多",
            "middle_circle": "中圈有断裂感",
            "inner_circle": "里圈偏收缩",
        },
        report_mode="lite",
    )

    assert context["topic"] == "wealth"
    assert context["topic_label"] == "财富议题"
    assert route.selected_clause_ids
    assert route.selected_module_ids
    assert route.selected_next_explorations
    assert route.selected_next_explorations[0]["recommended_topic"]
