import asyncio
from types import SimpleNamespace

from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
from app.core.pipeline.report_contracts import ReportContractAssembler
from app.core.pipeline.report_knowledge_debug import KnowledgeDebugBlockBuilder
from app.core.pipeline.structured_report_schema import get_structured_report_contract
from app.core.pipeline.store import InterpretationStore

from .test_pipeline_orchestrator import MANUAL_THREE_CIRCLES, StubCircleDetector


def _create_orchestrator(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )
    return orchestrator, image_path


def test_report_contract_assembler_builds_lite_payload(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-lite",
            theme="wealth_career",
            three_circles=MANUAL_THREE_CIRCLES,
        )
    )

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=record,
        requested_version="lite",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )
    lite_contract = get_structured_report_contract("lite")

    assert payload["version"] == "lite"
    assert payload["title"] == "慢慢亮起来的中心"
    assert tuple(payload["structured"].keys()) == lite_contract.field_names
    assert payload["structured"]["prompt_schema_validation_issues"] == []
    assert payload["structured"]["topic_context"] == {
        "topic": "wealth_career",
        "topic_label": "财富事业",
        "report_mode": "lite",
        "orientation": {
            "intro": "这份报告会从财富事业这个议题角度看这张画。",
            "focus": "这个议题通常关注你如何使用行动力、价值感、资源感和目标节奏。",
            "key_terms": [
                {
                    "term": "价值感",
                    "explanation": "你是否觉得自己的付出、能力和选择值得被看见。",
                },
                {
                    "term": "行动节奏",
                    "explanation": "你在推进目标时，是更容易稳定前进，还是在压力下收缩或过度用力。",
                },
            ],
        },
    }
    assert payload["structured"]["current_reading"] == payload["overall_impression"]
    assert payload["structured"]["visual_basis"]
    assert "留承接空间" in payload["structured"]["visual_basis"] or "往前" in payload["structured"]["visual_basis"]
    assert payload["structured"]["pattern_interpretation"]
    assert payload["structured"]["life_connection"]
    assert payload["structured"]["lite_healing_guidance"]["directions"]
    assert payload["structured"]["lite_healing_guidance"]["micro_practices"]
    assert payload["structured"]["pro_report_entry"]["title"] == "另一份更深的独立报告"
    assert "独立购买" in payload["structured"]["pro_report_entry"]["product_note"]
    assert "pro_teaser" not in payload["structured"]
    assert "story" not in payload["structured"]
    assert "theme_insights" not in payload["structured"]
    assert "self_understanding_blocks" not in payload["structured"]
    assert payload["can_upgrade"] is True
    assert payload["upgrade_price"] == orchestrator.get_upgrade_diff()


def test_report_contract_assembler_builds_pro_payload(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-pro",
            three_circles=MANUAL_THREE_CIRCLES,
        )
    )
    orchestrator.upgrade_to_pro(record.interpretation_id)

    upgraded = orchestrator.store.load(record.interpretation_id)
    assert upgraded is not None

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=upgraded,
        requested_version="pro",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )
    pro_contract = get_structured_report_contract("pro")

    assert payload["version"] == "pro"
    assert tuple(payload["structured"].keys()) == pro_contract.field_names
    assert payload["structured"]["prompt_schema_validation_issues"] == []
    assert payload["structured"]["topic_context"]["topic"] == "general"
    assert payload["structured"]["topic_context"]["topic_label"] == "全面解读"
    assert payload["structured"]["topic_context"]["report_mode"] == "pro"
    assert payload["structured"]["deep_impression"]
    assert "Lite" not in payload["structured"]["deep_impression"]
    assert "慢慢亮起来的中心" not in payload["structured"]["deep_impression"]
    assert payload["structured"]["evidence_digest"]
    assert "内圈" in payload["structured"]["evidence_digest"]
    assert "中圈" in payload["structured"]["evidence_digest"]
    assert "外圈" in payload["structured"]["evidence_digest"]
    assert "更快" in payload["structured"]["evidence_digest"] or "更稳" in payload["structured"]["evidence_digest"]
    assert payload["structured"]["imbalance_diagnosis"]
    assert payload["structured"]["root_cause_chain"]
    assert payload["structured"]["deep_structure_interpretation"]
    assert payload["structured"]["healing_plan"]
    serialized = str(payload["structured"])
    assert "{'" + "inner'" not in serialized
    assert "解锁完整" not in serialized
    assert "补全" not in serialized
    assert "升级" not in serialized
    assert "21" + "天" not in serialized
    assert "first_impression" not in payload["structured"]
    assert "core_insight_table" not in payload["structured"]
    assert "root_cause" not in payload["structured"]
    assert "healing_suggestions" not in payload["structured"]
    assert payload["can_upgrade"] is False
    assert payload["upgrade_price"] is None


def test_pro_healing_plan_removes_truncated_raw_payload_fragments():
    assembler = ReportContractAssembler.__new__(ReportContractAssembler)
    pro_draft = SimpleNamespace(
        healing_suggestions=[
            {
                "phase": "第二步",
                "focus": ": '金色', 'middle': '红色', 'outer': '土色'}",
                "practice": "把注意力放回当下可以承接的身体节奏。",
            }
        ],
        root_cause={
            "surface": "行动节奏被外部评价牵动。",
            "deeper": "需要重新建立稳定推进感。",
            "core": "把价值感从单次结果中收回来。",
        },
        imbalance_confirmed={
            "primary": "当前主要失衡是外推动力与稳定承接之间不同步。",
        },
        narrative_plan={},
    )

    plan = assembler._build_pro_healing_plan(pro_draft)

    assert plan[0]["focus"]
    serialized = str(plan)
    assert "middle':" not in serialized
    assert "outer':" not in serialized
    assert ": '金色'" not in serialized
    assert "{'" + "inner'" not in serialized


def test_pro_root_cause_chain_and_healing_plan_use_clean_bound_topic_tied_copy():
    assembler = ReportContractAssembler.__new__(ReportContractAssembler)
    pro_draft = SimpleNamespace(
        root_cause={
            "surface": "这会让你一边想继续向外...消耗 你原本希望“理清当前职业推进中的拉扯”。",
            "deeper": "更深一层看，这更接近「金多木折」的模式。 更深一层看，这更接近「金多木折」的模式。",
            "core": "更深层的位置，是你正在重新学习：在「不配得感」这里，每个人都值得拥有丰盛的财富和成功",
        },
        imbalance_confirmed={
            "primary": "当前更接近的核心失衡是「金多木折」：完美拖延机会。",
            "summary": "追求完美方案，导致项目迟迟无法启动。",
        },
        healing_suggestions=[
            {
                "phase": "建议一",
                "focus": "围绕「完美拖延机会」先做小幅但稳定的调节。",
                "practice": "每日肯定自我价值，记录成就。",
            },
            {
                "phase": "建议二",
                "focus": "围绕「完美拖延机会」先做小幅但稳定的调节。",
                "practice": "每日肯定自我价值，记录成就。",
            },
            {
                "phase": "建议三",
                "focus": ": '金色', 'middle': '红色', 'outer': '土色'}",
                "practice": "",
            },
        ],
        narrative_plan={
            "theme_label": "财富事业",
            "sections": {
                "root_cause": {
                    "content": {
                        "surface": "职业推进里，你容易把外部评价当成行动门槛。",
                        "deeper": "形成机制是先用完美标准保护自己，再推迟真实试错。",
                        "core": "核心层是把价值感从单次结果中收回来。",
                    }
                },
                "healing_suggestions": {
                    "content": [
                        {
                            "content": {
                                "practice": "先选一个财富事业目标，把它拆成今天能完成的最小动作。",
                            }
                        },
                        {
                            "content": {
                                "practice": "完成后只记录事实进展，不立刻评价成败。",
                            }
                        },
                    ]
                },
            },
        },
    )

    root_chain = assembler._build_pro_root_cause_chain(pro_draft)
    plan = assembler._build_pro_healing_plan(pro_draft)

    serialized = str({"root": root_chain, "plan": plan})
    assert "消耗 你原本" not in serialized
    assert "..." not in serialized
    assert "更深一层看，这更接近「金多木折」的模式。 更深一层看" not in serialized
    assert "middle':" not in serialized
    assert "outer':" not in serialized
    practices = [item["practice"] for item in plan]
    assert len(practices) == len(set(practices))
    assert any("财富事业" in item["focus"] or "金多木折" in item["focus"] for item in plan)
    assert all("稳定的调节" not in item["focus"] for item in plan[1:])


def test_algorithm_fidelity_trace_scopes_raw_payload_by_report_mode():
    builder = KnowledgeDebugBlockBuilder.__new__(KnowledgeDebugBlockBuilder)
    layer0 = {
        "rule_evaluations": {
            "interpretation_method_trace": {
                "direct_judgment": {},
                "per_circle_color_analysis": {},
                "shape_analysis": {},
                "circle_relation_analysis": {},
                "final_algorithm_basis": {},
            }
        }
    }
    record = SimpleNamespace(
        layer_2_lite_final=SimpleNamespace(to_dict=lambda: {"visual_basis": "内圈偏亮，中圈偏深。"}),
        layer_3_pro_draft=SimpleNamespace(
            healing_suggestions=[
                {
                    "focus": ": '金色', 'middle': '红色', 'outer': '土色'}",
                }
            ],
            to_dict=lambda: {
                "healing_suggestions": [
                    {
                        "focus": ": '金色', 'middle': '红色', 'outer': '土色'}",
                    }
                ]
            }
        ),
    )

    lite_trace = builder._build_algorithm_fidelity_trace(
        layer0=layer0,
        narrative_plans={"lite": {"sections": {}}, "pro": {"sections": {}}},
        knowledge_projections={"lite": {}, "pro": {}},
        record=record,
        report_mode="lite",
    )
    pro_trace = builder._build_algorithm_fidelity_trace(
        layer0=layer0,
        narrative_plans={"lite": {"sections": {}}, "pro": {"sections": {}}},
        knowledge_projections={"lite": {}, "pro": {}},
        record=record,
        report_mode="pro",
    )

    assert lite_trace["scope"] == "lite"
    assert lite_trace["raw_payload_leak_found"] is False
    assert lite_trace["algorithm_fidelity_pass"] is True
    assert pro_trace["scope"] == "pro"
    assert pro_trace["raw_payload_leak_found"] is True
    assert pro_trace["algorithm_fidelity_pass"] is False


def test_review_debug_views_group_input_layer0_and_mapping_summaries():
    builder = KnowledgeDebugBlockBuilder.__new__(KnowledgeDebugBlockBuilder)
    layer0 = {
        "visual_facts": {
            "circle_boundaries": {"inner_radius": 0.35, "middle_radius": 0.65},
            "circle_colors": {
                "inner": ["gold", "green"],
                "middle": ["red"],
                "outer": ["earth"],
            },
            "weighted_element_distribution": {
                "wood": 0.18,
                "fire": 0.22,
                "earth": 0.24,
                "metal": 0.14,
                "water": 0.22,
            },
        },
        "rule_evaluations": {
            "element_states": {
                "wood": {"tutorial_state": "balanced"},
            },
            "triad_states": {
                "inner": {"circle": "inner", "dominant_element": "fire"},
            },
            "imbalance_trace": {
                "primary_candidates": [
                    {
                        "id": "water-fire-conflict",
                        "score": 0.72,
                        "toc_supported": True,
                    }
                ],
                "synthetic_signal": {
                    "id": "transition-overload",
                    "used": False,
                    "reason": "",
                },
            },
            "interpretation_method_trace": {
                "direct_judgment": {
                    "summary": "先看到中心有聚焦感，外围承接略重。",
                },
                "per_circle_color_analysis": {
                    "inner": {"summary": "内圈偏亮，金火感更突出。"},
                    "middle": {"summary": "中圈偏深，推进感里带一点压住。"},
                    "outer": {"summary": "外圈偏厚，承接比扩张更明显。"},
                },
                "shape_analysis": {
                    "summary": "形状辅助支持中心聚焦，但不是主判断。",
                },
                "circle_relation_analysis": {
                    "summary": "圈级关系更像内推与外承接不同步。",
                },
                "final_algorithm_basis": {},
            },
        },
        "theme_projection": {
            "theme": "wealth_career",
            "theme_label": "财富事业",
        },
        "fidelity_flags": ["warning:water-fire-conflict"],
        "fallback_summary": {"used": False, "levels": [], "warnings": []},
    }
    record = SimpleNamespace(
        interpretation_id="ipt-review-1",
        image_path="/tmp/review.png",
        theme="wealth_career",
        painting_intention="看清工作中的收缩和推进。",
        painting_feeling="紧绷，但想往前。",
        three_circles={"inner_radius": 0.35, "middle_radius": 0.65},
        three_circles_auto_detect=None,
        layer_0_raw=SimpleNamespace(to_dict=lambda: layer0),
        layer_2_lite_final=SimpleNamespace(
            overall_impression="你正在一边收紧、一边寻找推进感。",
            visual_elements_rendered="内圈偏亮，中圈偏深，外圈承接偏厚。",
            emotion_portrait_rendered="你更像在稳住自己之后再考虑往外推进。",
            theme_insights=SimpleNamespace(
                scene="工作场景里先稳后动。",
                impact="推进速度容易被压力门槛拖住。",
                awareness="先把价值感收回来，动作会更清楚。",
            ),
            story=SimpleNamespace(
                pattern=SimpleNamespace(content="当前更像先保护、再试探。"),
                defense=SimpleNamespace(content="你会先把门槛拉高来保护自己。"),
            ),
        ),
        layer_3_pro_draft=SimpleNamespace(
            first_impression="你有明显的中心聚焦感，但外层承接比向外扩张更强。",
            to_dict=lambda: {"healing_suggestions": []},
        ),
    )

    input_package = builder._build_input_package(record)
    layer0_summary = builder._build_review_layer0_summary(layer0)
    mapping_summary = builder._build_review_mapping_summary(record, layer0)

    assert input_package["image"]["image_ref"] == "/tmp/review.png"
    assert input_package["topic_input"]["topic"] == "wealth_career"
    assert input_package["topic_input"]["topic_label"] == "财富事业"
    assert input_package["circle_config"]["inner_radius"] == 0.35
    assert input_package["circle_config"]["middle_radius"] == 0.65
    assert input_package["circle_config"]["source"] == "user_calibrated"

    assert "中心有聚焦感" in layer0_summary["direct_judgment_summary"]
    assert "内圈偏亮" in layer0_summary["per_circle_observation_summary"]
    assert "形状辅助" in layer0_summary["shape_observation_summary"]
    assert "water-fire-conflict" in layer0_summary["candidate_summary"]

    assert "current_reading" in mapping_summary["lite_blocks"]
    assert "deep_impression" in mapping_summary["pro_blocks"]
    assert mapping_summary["lite_blocks"]["visual_basis"]["evidence_trace_refs"]


def test_report_contract_assembler_keeps_lite_contract_after_pro_upgrade(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-lite-after-pro",
            three_circles=MANUAL_THREE_CIRCLES,
        )
    )
    orchestrator.upgrade_to_pro(record.interpretation_id)

    upgraded = orchestrator.store.load(record.interpretation_id)
    assert upgraded is not None

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=upgraded,
        requested_version="lite",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )

    assert payload["version"] == "lite"
    assert payload["structured"]["current_reading"] == payload["overall_impression"]
    assert payload["structured"]["prompt_schema_validation_issues"] == []
    assert payload["structured"]["pro_report_entry"]["summary"]
    assert payload["can_upgrade"] is False
    assert payload["upgrade_price"] is None


def test_orchestrator_prefers_best_available_report_version(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-best-version",
            three_circles=MANUAL_THREE_CIRCLES,
        )
    )

    lite_payload = orchestrator.get_report(record.interpretation_id)
    assert lite_payload is not None
    assert lite_payload["version"] == "lite"

    orchestrator.upgrade_to_pro(record.interpretation_id)
    best_available_payload = orchestrator.get_report(record.interpretation_id)

    assert best_available_payload is not None
    assert best_available_payload["version"] == "pro"
    assert best_available_payload["structured"]["prompt_schema_validation_issues"] == []
    assert best_available_payload["can_upgrade"] is False


def test_report_contract_assembler_rejects_unsupported_version(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-invalid",
            three_circles=MANUAL_THREE_CIRCLES,
        )
    )

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=record,
        requested_version="unknown",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )

    assert payload == {
        "version": "unknown",
        "error": "unsupported version: unknown",
        "can_upgrade": False,
        "upgrade_price": None,
    }


def test_structured_report_contract_defines_required_fields():
    lite_contract = get_structured_report_contract("lite")
    pro_contract = get_structured_report_contract("pro")

    assert lite_contract.schema_version == "2026-04-18"
    assert lite_contract.required_field_names == (
        "prompt_schema_validation_issues",
        "topic_context",
        "current_reading",
        "visual_basis",
        "pattern_interpretation",
        "life_connection",
        "lite_healing_guidance",
        "pro_report_entry",
    )
    assert pro_contract.required_field_names == (
        "prompt_schema_validation_issues",
        "topic_context",
        "deep_impression",
        "evidence_digest",
        "imbalance_diagnosis",
        "root_cause_chain",
        "deep_structure_interpretation",
        "healing_plan",
    )
