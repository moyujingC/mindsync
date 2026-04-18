"""Unit tests for the minimal migrated V2 orchestrator shell."""

import asyncio
import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.analysis.circle_detector import CircleDetectionResult
from app.core.pipeline.data_models import (
    GenerationStatus,
    InterpretationRecord,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
)
from app.core.pipeline.orchestrator_v2 import (
    GenerationStage,
    LayeredOrchestrator,
    PricingSnapshot,
)
from app.core.pipeline.generation_runtime import (
    LiteGenerationBundle,
    ProGenerationBundle,
)
from app.core.pipeline.report_contracts import PromptSchemaValidator
from app.core.pipeline.store import InterpretationStore


class StubCircleDetector:
    async def detect_circles(
        self,
        image_path: str,
        use_ai: bool = True,
        use_opencv: bool = True,
        confidence_threshold: float = 0.3,
    ):
        return CircleDetectionResult(
            inner_radius=0.35,
            middle_radius=0.67,
            confidence=0.8,
            method="stub",
        )


def _assert_bound_method(actual, expected):
    assert actual.__self__ is expected.__self__
    assert actual.__func__ is expected.__func__


def test_generation_stage_values():
    assert GenerationStage.PENDING == "pending"
    assert GenerationStage.DETECTING == "detecting"
    assert GenerationStage.ANALYZING == "analyzing"
    assert GenerationStage.GENERATING == "generating"
    assert GenerationStage.FINALIZING == "finalizing"
    assert GenerationStage.COMPLETED == "completed"
    assert GenerationStage.FAILED == "failed"


def test_pricing_snapshot_to_dict():
    snapshot = PricingSnapshot(lite=9.9, pro=39.0, upgrade_diff=39.1)

    assert snapshot.to_dict() == {
        "lite": 9.9,
        "pro": 39.0,
        "upgrade_diff": 39.1,
    }


def test_layered_orchestrator_exposes_fixed_pricing(tmp_path):
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    assert orchestrator.store is store
    assert orchestrator.enable_vision is False
    assert LayeredOrchestrator.get_supported_versions() == ("lite", "pro")
    assert LayeredOrchestrator.get_upgrade_diff() == 39.1

    pricing = LayeredOrchestrator.get_pricing()
    assert pricing.lite == 9.9
    assert pricing.pro == 39.0
    assert pricing.upgrade_diff == 39.1


def test_layered_orchestrator_installs_legacy_report_bindings(tmp_path):
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    _assert_bound_method(
        orchestrator._build_layer0_placeholder,
        orchestrator.report_layer0_support.build_placeholder,
    )
    _assert_bound_method(
        orchestrator._build_lite_title,
        orchestrator.report_lite_narrative_builder.build_title,
    )
    _assert_bound_method(
        orchestrator._build_pro_micro_sections_from_knowledge,
        orchestrator.report_pro_narrative_builder.build_micro_sections_from_knowledge,
    )
    _assert_bound_method(
        orchestrator.get_knowledge_theme_summary,
        orchestrator.report_knowledge_adapter.get_knowledge_theme_summary,
    )


def test_normalize_circle_payload():
    orchestrator = LayeredOrchestrator(enable_vision=False)

    payload = orchestrator._normalize_circle_payload(
        {"inner_radius": 8, "middle_radius": 11}
    )

    assert payload == {
        "inner_radius": 10,
        "middle_radius": 15,
    }


def test_hash_image_missing_file():
    orchestrator = LayeredOrchestrator(enable_vision=False)

    image_hash = orchestrator._hash_image("/tmp/aimandala-no-file.png")

    assert image_hash == "missing:aimandala-no-file.png"


def test_prepare_lite_record_with_manual_circles(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    record = asyncio.run(
        orchestrator.prepare_lite_record(
            image_path=str(image_path),
            user_id="user-1",
            three_circles={"inner_radius": 40, "middle_radius": 72},
        )
    )

    assert record.three_circles == {"inner_radius": 40, "middle_radius": 72}
    assert record.three_circles_user_adjusted is True
    assert record.generation_stage == "detecting"
    assert record.generation_progress == 10


def test_prepare_lite_record_uses_detector_when_missing_manual_input(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.prepare_lite_record(
            image_path=str(image_path),
            user_id="user-2",
        )
    )

    assert record.three_circles == {"inner_radius": 35, "middle_radius": 67}
    assert record.three_circles_auto_detect["method"] == "stub"
    assert record.three_circles_user_adjusted is False


def test_get_report_returns_lite_placeholder_when_not_generated(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.prepare_lite_record(
            image_path=str(image_path),
            user_id="user-3",
        )
    )

    report = orchestrator.get_report(record.interpretation_id)

    assert report is not None
    assert report["version"] == "lite"
    assert report["error"] == "lite report not generated yet"


def test_get_report_returns_none_for_missing_record(tmp_path):
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    assert orchestrator.get_report("missing-record-id") is None


def test_generate_lite_placeholder_creates_report(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-4",
            theme="wealth_career",
        )
    )

    assert record.status == GenerationStatus.COMPLETED
    assert record.generation_stage == "completed"
    assert record.generation_progress == 100
    assert "lite" in record.version_purchased
    assert record.layer_2_lite_final is not None
    assert "向前先稳住的人" in record.layer_2_lite_final.full_report_markdown
    assert "你的心灵画像故事" in record.layer_2_lite_final.full_report_markdown
    assert "在「财富事业」中的具体表现" in record.layer_2_lite_final.full_report_markdown
    assert "重要声明" in record.layer_2_lite_final.full_report_markdown
    assert "一镜 Lite 版解读报告模板 v1.6" in record.layer_1_lite_draft.prompt_preview


def test_get_report_returns_lite_report_after_placeholder_generation(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-5",
        )
    )

    report = orchestrator.get_report(record.interpretation_id)

    assert report is not None
    assert report["version"] == "lite"
    assert report["report"] is not None
    assert report["title"] == "慢慢亮起来的中心"
    assert "一镜 Lite 版解读报告模板 v1.6" in report["structured"]["prompt_preview"]
    assert report["structured"]["prompt_schema_validation_issues"] == []
    assert report["structured"]["lite_healing_guidance"]["directions"]
    assert report["structured"]["lite_healing_guidance"]["micro_practices"]
    assert report["structured"]["pro_report_entry"]["title"] == "另一份更深的独立报告"
    assert "更深层结构" in report["structured"]["pro_report_entry"]["summary"]
    assert "【你的底色" in report["structured"]["six_insights_rendered"]["base"]
    assert report["can_upgrade"] is True


def test_get_report_debug_profile_returns_structured_diagnostics(tmp_path):
    image_path = tmp_path / "debug-image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-debug",
            theme="wealth_career",
        )
    )
    orchestrator.upgrade_to_pro(record.interpretation_id)

    profile = orchestrator.get_report_debug_profile(record.interpretation_id)

    assert profile is not None
    assert profile["theme"] == "wealth_career"
    assert len(profile["steps"]) == 6
    assert "lite" in profile["field_provenance"]
    assert "pro" in profile["field_provenance"]
    assert "summary" in profile["diagnostics"]
    assert "recommended_first_actions" in profile["diagnostics"]["summary"]
    assert "lite" in profile["prompt_debug"]
    assert "pro" in profile["prompt_debug"]
    assert profile["prompt_debug"]["lite"]["schema_fields"]
    assert profile["prompt_debug"]["pro"]["schema_fields"]
    assert profile["insight_context_summary"]["theme"] == "wealth_career"
    assert profile["insight_context_summary"]["constraints"]["scope"] == "single_interpretation"
    assert profile["evidence_summary"]["agent"]["name"] == "InsightAgent"
    assert profile["fallback_summary"]["used"] in {True, False}
    assert profile["generation_mode"]["strategy"] == "knowledge_first"
    assert profile["generation_mode"]["llm_role"] == "none"
    assert profile["prompt_debug"]["lite"]["knowledge_skeleton_excerpt"]
    assert profile["prompt_debug"]["pro"]["knowledge_skeleton_excerpt"]
    assert '"runtime_evidence"' in profile["prompt_debug"]["lite"]["knowledge_skeleton_excerpt"]
    assert '"narrative_plan"' in profile["prompt_debug"]["lite"]["knowledge_skeleton_excerpt"]
    assert '"compatibility_projection"' in profile["prompt_debug"]["lite"]["knowledge_skeleton_excerpt"]
    assert '"runtime_evidence"' in profile["prompt_debug"]["pro"]["knowledge_skeleton_excerpt"]
    assert '"narrative_plan"' in profile["prompt_debug"]["pro"]["knowledge_skeleton_excerpt"]
    assert profile["field_provenance"]["lite"][0]["generation_mode"] == "knowledge_only"
    assert profile["field_provenance"]["pro"][0]["generation_mode"] == "knowledge_only"
    assert profile["knowledge_debug"]["narrative_plans"]["lite"]["mode"] == "lite"
    assert profile["knowledge_debug"]["narrative_plans"]["pro"]["mode"] == "pro"
    assert (
        profile["knowledge_debug"]["narrative_plans"]["lite"]["sections"]["lite_healing_guidance"]
    )
    assert profile["knowledge_debug"]["narrative_plans"]["pro"]["sections"]["healing_suggestions"]
    assert "story_sections" in profile["knowledge_debug"]["knowledge_projections"]["lite"]
    assert "root_cause" in profile["knowledge_debug"]["knowledge_projections"]["pro"]
    assert profile["diagnostics"]["summary"]["no_llm_override_on_structured_fields"] is True


def test_answer_report_chat_returns_runtime_reply(tmp_path):
    image_path = tmp_path / "chat-image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))

    class StubReportChatRuntime:
        def reply(self, **kwargs):
            assert kwargs["theme"] == "general"
            assert kwargs["message"] == "现在我最该注意什么？"
            assert kwargs["report_markdown"]
            return "  先把节奏放慢一点。  "

    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        report_chat_runtime=StubReportChatRuntime(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-chat",
        )
    )

    reply = orchestrator.answer_report_chat(
        record.interpretation_id,
        message="现在我最该注意什么？",
    )

    assert reply == {
        "interpretation_id": record.interpretation_id,
        "reply": "先把节奏放慢一点。",
    }


def test_insight_agent_wraps_lite_generation_and_context(tmp_path):
    image_path = tmp_path / "insight-lite.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    result = asyncio.run(
        orchestrator.insight_agent.generate_lite_report(
            orchestrator,
            detect_three_circles=orchestrator.detect_three_circles,
            image_path=str(image_path),
            user_id="user-insight-lite",
            theme="wealth_career",
            check_existing=False,
        )
    )

    assert result.record.interpretation_id
    assert result.context.theme == "wealth_career"
    assert result.context.constraints["scope"] == "single_interpretation"
    assert "knowledge_hits" in result.context.layer0
    assert result.report_payload is not None
    assert result.report_payload["version"] == "lite"


def test_insight_agent_wraps_pro_generation_and_report_chat(tmp_path):
    image_path = tmp_path / "insight-pro.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))

    class StubReportChatRuntime:
        def reply(self, **kwargs):
            assert kwargs["message"] == "请只围绕本次报告解释。"
            return "好的，我们只围绕这次报告展开。"

    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        report_chat_runtime=StubReportChatRuntime(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-insight-pro",
            theme="general",
        )
    )

    pro_result = orchestrator.insight_agent.generate_pro_report(
        orchestrator,
        record.interpretation_id,
    )
    assert pro_result is not None
    assert pro_result.context.theme == "general"
    assert pro_result.status_payload["status"] == "completed"
    assert pro_result.report_payload is not None
    assert pro_result.report_payload["version"] == "pro"

    answer = orchestrator.insight_agent.answer_report_question(
        record.interpretation_id,
        message="请只围绕本次报告解释。",
    )
    assert answer is not None
    assert answer.context.constraints["chat_scope"] == "current_report_only"
    assert answer.to_dict() == {
        "interpretation_id": record.interpretation_id,
        "reply": "好的，我们只围绕这次报告展开。",
    }


def test_layer1_placeholder_prefers_runtime_lite_projection():
    class StubNarrativeService:
        def build_theme_prompt_context(self, **kwargs):
            return "Runtime-Theme-Prompt-Context"

        def build_lite_narrative_plan(self, **kwargs):
            return {
                "mode": "lite",
                "generation_mode": "evidence_first",
                "sections": {
                    "title": {"content": "Runtime-Lite-Title", "trace": {}},
                    "overall_impression": {"content": "Runtime-Overall-Impression", "trace": {}},
                    "visual_elements": {"content": "Runtime-Visual-Elements", "trace": {}},
                    "emotion_portrait": {"content": "Runtime-Emotion-Portrait", "trace": {}},
                    "story_sections": {
                        "content": {
                            "base": "Runtime-Story-Base",
                            "contradiction": "Runtime-Story-Contradiction",
                            "pattern": "Runtime-Story-Pattern",
                            "defense": "Runtime-Story-Defense",
                            "block": "Runtime-Story-Block",
                            "light": "Runtime-Story-Light",
                        },
                        "trace": {},
                    },
                    "theme_insights": {
                        "content": {
                            "scene": "Runtime-Theme-Scene",
                            "impact": "Runtime-Theme-Impact",
                            "awareness": "Runtime-Theme-Awareness",
                        },
                        "trace": {},
                    },
                    "lite_healing_guidance": {
                        "content": {
                            "directions": [{"title": "Direction", "content": "Direction Content"}],
                            "micro_practices": [{"title": "Practice", "content": "Practice Content"}],
                        },
                        "trace": {},
                    },
                    "pro_report_entry": {
                        "content": {
                            "title": "另一份更深的独立报告",
                            "summary": "Runtime-Pro-Teaser",
                            "product_note": "独立购买",
                        },
                        "trace": {},
                    },
                },
                "legacy_projection": {
                    "title": "Runtime-Lite-Title",
                    "overall_impression": "Runtime-Overall-Impression",
                    "visual_elements": "Runtime-Visual-Elements",
                    "experiment": {
                        "title": "Runtime-Experiment-Title",
                        "content": "Runtime-Experiment-Content",
                    },
                    "story_angles": {
                        "base": "Runtime-Base-Angle",
                        "light": "Runtime-Light-Angle",
                    },
                    "six_insights": {
                        "base": {
                            "title": "Runtime-Six-Base-Title",
                            "content": "Runtime-Six-Base-Content",
                            "summary": "Runtime-Six-Base-Summary",
                        },
                        "light": {
                            "title": "Runtime-Six-Light-Title",
                            "content": "Runtime-Six-Light-Content",
                            "summary": "Runtime-Six-Light-Summary",
                        },
                    },
                    "story_sections": {
                        "base": "Runtime-Story-Base",
                        "contradiction": "Runtime-Story-Contradiction",
                        "pattern": "Runtime-Story-Pattern",
                        "defense": "Runtime-Story-Defense",
                        "block": "Runtime-Story-Block",
                        "light": "Runtime-Story-Light",
                    },
                    "theme_insights": {
                        "scene": "Runtime-Theme-Scene",
                        "impact": "Runtime-Theme-Impact",
                        "awareness": "Runtime-Theme-Awareness",
                    },
                    "emotion_portrait": "Runtime-Emotion-Portrait",
                    "pro_teaser": "Runtime-Pro-Teaser",
                    "three_awareness": [
                        {
                            "day": 1,
                            "title": "Runtime-Awareness-1",
                            "content": "Runtime-Awareness-Content-1",
                        }
                    ],
                },
            }

        def build_lite_narrative_projection(self, **kwargs):
            assert kwargs["theme"] == "general"
            assert kwargs["default_pro_teaser"]
            assert kwargs["title_templates"]["default"] == "慢慢亮起来的中心"
            return {
                "title": "Runtime-Lite-Title",
                "overall_impression": "Runtime-Overall-Impression",
                "visual_elements": "Runtime-Visual-Elements",
                "experiment": {
                    "title": "Runtime-Experiment-Title",
                    "content": "Runtime-Experiment-Content",
                },
                "story_angles": {
                    "base": "Runtime-Base-Angle",
                    "light": "Runtime-Light-Angle",
                },
                "six_insights": {
                    "base": {
                        "title": "Runtime-Six-Base-Title",
                        "content": "Runtime-Six-Base-Content",
                        "summary": "Runtime-Six-Base-Summary",
                    },
                    "light": {
                        "title": "Runtime-Six-Light-Title",
                        "content": "Runtime-Six-Light-Content",
                        "summary": "Runtime-Six-Light-Summary",
                    },
                },
                "story_sections": {
                    "base": "Runtime-Story-Base",
                    "contradiction": "Runtime-Story-Contradiction",
                    "pattern": "Runtime-Story-Pattern",
                    "defense": "Runtime-Story-Defense",
                    "block": "Runtime-Story-Block",
                    "light": "Runtime-Story-Light",
                },
                "theme_insights": {
                    "scene": "Runtime-Theme-Scene",
                    "impact": "Runtime-Theme-Impact",
                    "awareness": "Runtime-Theme-Awareness",
                },
                "emotion_portrait": "Runtime-Emotion-Portrait",
                "pro_teaser": "Runtime-Pro-Teaser",
                "three_awareness": [
                    {
                        "day": 1,
                        "title": "Runtime-Awareness-1",
                        "content": "Runtime-Awareness-Content-1",
                    }
                ],
            }

    orchestrator = LayeredOrchestrator(enable_vision=False)
    orchestrator.narrative_service = StubNarrativeService()
    record = InterpretationRecord(
        theme="general",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )
    record.layer_0_raw = orchestrator._build_layer0_placeholder(record)

    layer1 = orchestrator._build_layer1_placeholder(record)

    assert layer1.title == "Runtime-Lite-Title"
    assert layer1.narrative_plan["mode"] == "lite"
    assert layer1.overall_impression == "Runtime-Overall-Impression"
    assert layer1.visual_elements == "Runtime-Visual-Elements"
    assert layer1.experiment["title"] == "Runtime-Experiment-Title"
    assert layer1.experiment["content"] == "Runtime-Experiment-Content"
    assert layer1.story.base.content == "Runtime-Story-Base"
    assert layer1.story.light.content == "Runtime-Story-Light"
    assert layer1.six_insights.base["title"] == "Runtime-Six-Base-Title"
    assert layer1.six_insights.base["content"] == "Runtime-Six-Base-Content"
    assert layer1.six_insights.light["title"] == "Runtime-Six-Light-Title"
    assert layer1.six_insights.light["summary"] == "Runtime-Six-Light-Summary"
    assert layer1.theme_insights.scene == "Runtime-Theme-Scene"
    assert layer1.emotion_portrait == "Runtime-Emotion-Portrait"
    assert layer1.pro_teaser == "Runtime-Pro-Teaser"
    assert layer1.three_awareness[0].title == "Runtime-Awareness-1"
    assert layer1.three_awareness[1].title == "看见边界变化"


def test_theme_prompt_context_prefers_runtime_builder():
    class StubNarrativeService:
        def build_theme_prompt_context(self, **kwargs):
            assert kwargs["theme"] == "wealth_career"
            assert kwargs["theme_label"] == "财富事业"
            assert kwargs["inner_radius"] == 35
            assert kwargs["middle_radius"] == 67
            return "Runtime-Theme-Prompt-Context"

    orchestrator = LayeredOrchestrator(enable_vision=False)
    orchestrator.narrative_service = StubNarrativeService()
    record = InterpretationRecord(
        theme="wealth_career",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )
    record.layer_0_raw = orchestrator._build_layer0_placeholder(record)

    context = orchestrator._build_theme_prompt_context(record)

    assert context == "Runtime-Theme-Prompt-Context"


def test_orchestrator_helper_methods_delegate_to_runtime_service():
    class StubNarrativeService:
        def get_theme_label(self, theme, fallback_label=""):
            return "Runtime-Theme-Label"

        def get_signal_label(self, signal):
            return "Runtime-Signal-Label"

        def describe_signal(self, signal):
            return "Runtime-Signal-Description"

        def get_element_theme_phrase(self, theme, element_name):
            return "Runtime-Element-Phrase"

        def get_element_core_keywords(self, theme, element_name):
            return "Runtime-Element-Keywords"

        def describe_circle_transition(self, **kwargs):
            return "Runtime-Circle-Transition"

        def clean_text_block(self, content):
            return "Runtime-Clean-Text"

    orchestrator = LayeredOrchestrator(enable_vision=False)
    orchestrator.narrative_service = StubNarrativeService()
    record = InterpretationRecord(
        theme="general",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )
    record.layer_0_raw = orchestrator._build_layer0_placeholder(record)

    assert orchestrator._get_theme_label("general") == "Runtime-Theme-Label"
    assert orchestrator._get_signal_label("transition-overload") == "Runtime-Signal-Label"
    assert orchestrator._describe_signal("transition-overload") == "Runtime-Signal-Description"
    assert orchestrator._get_element_theme_phrase("general", "土") == "Runtime-Element-Phrase"
    assert orchestrator._get_element_core_keywords("general", "土") == "Runtime-Element-Keywords"
    assert orchestrator._describe_circle_transition(record.layer_0_raw) == "Runtime-Circle-Transition"
    assert orchestrator._clean_knowledge_text_block("💡 test") == "Runtime-Clean-Text"


def test_get_status_returns_compact_snapshot(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-6",
        )
    )

    status = orchestrator.get_status(record.interpretation_id)

    assert status is not None
    assert status["interpretation_id"] == record.interpretation_id
    assert status["generation_stage"] == "completed"
    assert status["generation_progress"] == 100
    assert status["report_ready"] is True


def test_pro_generation_payload_structured_fields_are_local_knowledge_values():
    layer = Layer3ProDraft(
        core_insight_table={
            "能量本质": "知识骨架里的能量本质",
            "核心失衡": "知识骨架里的核心失衡",
        },
        three_circles_detailed={
            "inner": {
                "label": "内圈",
                "reading": "知识骨架里的内圈判断",
            }
        },
        micro_analysis_detailed={
            "节奏关系": "知识骨架里的节奏关系",
        },
        imbalance_confirmed={
            "type": "knowledge-type",
            "summary": "知识骨架里的整体判断",
            "primary": "知识骨架里的主失衡",
        },
        root_cause={
            "surface": "知识骨架里的表层根源",
            "deeper": "知识骨架里的深层根源",
            "core": "知识骨架里的核心根源",
        },
        healing_suggestions=[
            {
                "phase": "当前阶段",
                "focus": "知识骨架里的聚焦点",
                "practice": "知识骨架里的动作",
            }
        ],
    )

    assert layer.core_insight_table["能量本质"] == "知识骨架里的能量本质"
    assert layer.three_circles_detailed["inner"]["reading"] == "知识骨架里的内圈判断"
    assert layer.micro_analysis_detailed["节奏关系"] == "知识骨架里的节奏关系"
    assert layer.imbalance_confirmed["type"] == "knowledge-type"
    assert layer.root_cause["core"] == "知识骨架里的核心根源"
    assert layer.healing_suggestions[0]["practice"] == "知识骨架里的动作"


def test_select_pro_imbalance_type_uses_configured_rules():
    orchestrator = LayeredOrchestrator(enable_vision=False)

    class RecordStub:
        theme = "wealth_career"

    assert (
        orchestrator._select_pro_imbalance_type(
            record=RecordStub(),
            inner=45,
            middle=60,
        )
        == "boundary-constriction"
    )
    assert (
        orchestrator._select_pro_imbalance_type(
            record=RecordStub(),
            inner=35,
            middle=78,
        )
        == "relational-drain"
    )
    assert (
        orchestrator._select_pro_imbalance_type(
            record=RecordStub(),
            inner=35,
            middle=60,
        )
        == "action-block"
    )

    class HealthRecordStub:
        theme = "health_wellness"

    assert (
        orchestrator._select_pro_imbalance_type(
            record=HealthRecordStub(),
            inner=35,
            middle=60,
        )
        == "emotion-congestion"
    )


def test_upgrade_to_pro_generates_placeholder_report(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-7",
        )
    )

    result = orchestrator.upgrade_to_pro(record.interpretation_id)

    assert result is not None
    assert result["success"] is True
    assert result["enabled"] is True
    assert result["status"] == "completed"

    upgraded = store.load(record.interpretation_id)
    assert upgraded is not None
    assert upgraded.layer_4_pro_final is not None
    assert upgraded.get_pro_report() is not None
    assert upgraded.layer_3_pro_draft is not None
    assert upgraded.layer_3_pro_draft.imbalance_confirmed["primary"]
    assert upgraded.layer_3_pro_draft.imbalance_confirmed["evidence"]
    assert len(upgraded.layer_3_pro_draft.healing_suggestions) == 3
    assert upgraded.layer_3_pro_draft.healing_suggestions[0]["focus"]
    assert upgraded.layer_3_pro_draft.healing_suggestions[0]["practice"]
    assert "一梳 Pro 版解读报告模板 v1.6" in upgraded.layer_3_pro_draft.prompt_preview
    assert "第一眼直觉" in upgraded.layer_4_pro_final.full_report_markdown
    assert "核心洞察表格" in upgraded.layer_4_pro_final.full_report_markdown
    assert "主要失衡类型" in upgraded.layer_4_pro_final.full_report_markdown
    assert "判断依据" in upgraded.layer_4_pro_final.full_report_markdown
    assert "疗愈建议" in upgraded.layer_4_pro_final.full_report_markdown
    assert "可执行动作" in upgraded.layer_4_pro_final.full_report_markdown

    pro_report = orchestrator.get_report(record.interpretation_id, version="pro")
    assert pro_report is not None
    assert "一梳 Pro 版解读报告模板 v1.6" in pro_report["structured"]["prompt_preview"]
    assert pro_report["structured"]["prompt_schema_validation_issues"] == []


def test_start_and_complete_pro_upgrade_support_polling_flow(tmp_path):
    image_path = tmp_path / "polling-upgrade-image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-upgrade-polling",
        )
    )

    started = orchestrator.start_pro_upgrade(record.interpretation_id)

    assert started is not None
    assert started["success"] is True
    assert started["status"] == "processing"

    mid_record = store.load(record.interpretation_id)
    assert mid_record is not None
    assert mid_record.status == GenerationStatus.PROCESSING
    assert mid_record.generation_stage == GenerationStage.GENERATING.value
    assert mid_record.generation_progress == 85

    completed = orchestrator.complete_pro_upgrade(record.interpretation_id)

    assert completed is not None
    assert completed["success"] is True
    assert completed["status"] == "completed"

    upgraded = store.load(record.interpretation_id)
    assert upgraded is not None
    assert upgraded.layer_4_pro_final is not None
    assert upgraded.status == GenerationStatus.COMPLETED
    assert upgraded.generation_stage == GenerationStage.COMPLETED.value
    assert upgraded.generation_progress == 100


def test_report_safety_wrapper_strips_lite_disclaimer_for_embedding(tmp_path):
    image_path = tmp_path / "lite-safety-image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-lite-safety",
        )
    )

    stripped = orchestrator.report_safety_wrapper.strip_wrappers(
        record.layer_2_lite_final.full_report_markdown,
    )

    assert "重要声明" not in stripped
    assert stripped.startswith("# ")


def test_build_pro_placeholder_report_prefers_runtime_ai_qa_context():
    class StubNarrativeService:
        def build_ai_qa_context(self, **kwargs):
            assert kwargs["record_theme"] == "general"
            assert kwargs["lite_title"] == "Lite-Title"
            return "Runtime-AI-QA-Context"

    orchestrator = LayeredOrchestrator(enable_vision=False)
    orchestrator.narrative_service = StubNarrativeService()
    record = InterpretationRecord(theme="general")
    record.layer_2_lite_final = Layer2LiteFinal(
        title="Lite-Title",
        overall_impression="Lite-Overall",
        full_report_markdown="Lite-Markdown",
    )
    record.layer_3_pro_draft = type(
        "ProDraftStub",
        (),
        {
            "first_impression": "Pro-First",
            "core_insight_table": {"能量本质": "Core"},
            "three_circles_detailed": {},
            "micro_analysis_detailed": {},
            "imbalance_confirmed": {},
            "root_cause": {},
            "healing_suggestions": [],
        },
    )()

    layer4 = orchestrator._build_pro_placeholder_report(record)

    assert layer4.ai_qa_context == "Runtime-AI-QA-Context"


def test_upgrade_to_pro_prefers_runtime_healing_suggestions(tmp_path):
    image_path = tmp_path / "runtime-healing-image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-runtime-healing",
            theme="wealth_career",
        )
    )
    record.layer_0_raw.imbalance_candidates = ["水多火灭"]
    record.layer_0_raw.rule_evaluations["imbalance_trace"]["primary_candidates"] = [
        {
            "id": "水多火灭",
            "category": "相乘",
            "toc_supported": True,
            "score": 0.91,
            "selected_for_primary": True,
            "reason_codes": ["attacker_excess", "target_deficient"],
        }
    ]
    record.layer_0_raw.rule_evaluations["imbalance_trace"]["synthetic_signal"] = {
        "id": "transition-overload",
        "used": False,
        "reason": "",
    }
    store.save(record)

    result = orchestrator.upgrade_to_pro(record.interpretation_id)

    assert result is not None
    upgraded = store.load(record.interpretation_id)
    assert upgraded is not None
    assert upgraded.layer_3_pro_draft is not None
    assert upgraded.layer_3_pro_draft.healing_suggestions
    assert "水多火灭" in upgraded.layer_3_pro_draft.imbalance_confirmed["summary"]
    assert "恐惧压制行动" in upgraded.layer_3_pro_draft.imbalance_confirmed["summary"]
    assert "害怕失败" in upgraded.layer_3_pro_draft.imbalance_confirmed["evidence"]
    assert "72小时决策" in upgraded.layer_3_pro_draft.imbalance_confirmed["evidence"]
    assert "恐惧压制行动" in upgraded.layer_3_pro_draft.core_insight_table["关键卡点"]
    assert "72小时决策" in upgraded.layer_3_pro_draft.core_insight_table["转化方向"]
    assert "财富是能量的流动" in upgraded.layer_3_pro_draft.core_insight_table["疗愈核心"]
    assert "水多火灭" in upgraded.layer_3_pro_draft.root_cause["deeper"]
    assert "财富焦虑" in upgraded.layer_3_pro_draft.root_cause["core"]
    assert "财富焦虑" in upgraded.layer_3_pro_draft.healing_suggestions[0]["focus"]
    assert "72小时决策" not in upgraded.layer_3_pro_draft.healing_suggestions[0]["practice"]


def test_build_pro_placeholder_reuses_runtime_imbalance_projection():
    class StubNarrativeService:
        def __init__(self):
            self.imbalance_projection_calls = 0

        def build_imbalance_projection(self, **kwargs):
            self.imbalance_projection_calls += 1
            return {
                "contradiction": "明明想推进，却总在最后一步先收回来",
                "manifestation": "现实里容易在快要行动时突然犹豫",
                "direction": "先把行动拆成能承接的小单位",
                "healing_core": "把承载感放在速度前面",
                "deeper_root": "更深层是你还在确认自己能不能稳稳接住变化",
                "core_root": "核心根因是对失控的担心还没有真正放松",
                "summary": "当前更像是过渡阶段里的自我保护",
                "evidence": "边想靠近边想后退，说明能量转换还没完全顺起来",
            }

    orchestrator = LayeredOrchestrator(enable_vision=False)
    stub_service = StubNarrativeService()
    orchestrator.narrative_service = stub_service

    record = InterpretationRecord(
        theme="wealth_career",
        painting_feeling="想往前，但是有点卡",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )
    record.layer_0_raw = orchestrator._build_layer0_fallback(record)
    record.layer_0_raw.imbalance_candidates = ["transition-overload"]
    record.layer_0_raw.rule_evaluations["imbalance_trace"]["primary_candidates"] = [
        {
            "id": "transition-overload",
            "category": "synthetic",
            "toc_supported": True,
            "score": 1.0,
            "selected_for_primary": True,
            "reason_codes": ["fallback_signal"],
        }
    ]
    record.layer_0_raw.rule_evaluations["imbalance_trace"]["synthetic_signal"] = {
        "id": "transition-overload",
        "used": True,
        "reason": "fallback_signal",
    }
    record.layer_1_lite_draft = Layer1LiteDraft()
    record.layer_1_lite_draft.story.contradiction.content = "一边想继续，一边又会先缩回来。"
    record.layer_1_lite_draft.story.block.content = "临门一脚前会先停顿一下。"

    pro_layer = orchestrator._build_pro_placeholder_draft(record)

    assert stub_service.imbalance_projection_calls == 1
    assert "明明想推进，却总在最后一步先收回来" in pro_layer.core_insight_table["关键卡点"]
    assert "先把行动拆成能承接的小单位" in pro_layer.core_insight_table["转化方向"]
    assert pro_layer.root_cause["deeper"] == "更深层是你还在确认自己能不能稳稳接住变化"
    assert pro_layer.root_cause["core"] == "核心根因是对失控的担心还没有真正放松"


def test_layer3_placeholder_prefers_runtime_pro_projection():
    class StubNarrativeService:
        def build_pro_narrative_plan(self, **kwargs):
            return {
                "mode": "pro",
                "generation_mode": "evidence_first",
                "sections": {
                    "first_impression": {"content": "Runtime-Pro-First-Impression", "trace": {}},
                    "core_insight_table": {
                        "content": {
                            "能量本质": "Runtime-Pro-Energy-Essence",
                            "核心失衡": "Runtime-Imbalance-Summary",
                            "关键卡点": "Runtime-Pro-Block-Point",
                            "转化方向": "Runtime-Pro-Direction",
                            "疗愈核心": "Runtime-Pro-Healing-Core",
                        },
                        "trace": {},
                    },
                    "three_circles_detailed": {
                        "content": {
                            "inner": "Runtime-Pro-Inner-Reading",
                            "middle": "Runtime-Pro-Middle-Reading",
                            "outer": "Runtime-Pro-Outer-Reading",
                        },
                        "trace": {},
                    },
                    "micro_analysis_detailed": {
                        "content": {
                            "节奏关系": "Runtime-Pro-Micro-Rhythm",
                            "关系模式": "Runtime-Pro-Micro-Relationship",
                            "行动模式": "Runtime-Pro-Micro-Action",
                        },
                        "trace": {},
                    },
                    "root_cause": {
                        "content": {
                            "surface": "Runtime-Pro-Root-Surface",
                            "deeper": "Runtime-Pro-Root-Deeper",
                            "core": "Runtime-Pro-Root-Core",
                        },
                        "trace": {},
                    },
                    "healing_suggestions": {
                        "content": [{"phase": "当前阶段", "focus": "Focus", "practice": "Practice"}],
                        "trace": {},
                    },
                },
                "legacy_projection": {
                    "first_impression": "Runtime-Pro-First-Impression",
                    "energy_essence": "Runtime-Pro-Energy-Essence",
                    "block_point": "Runtime-Pro-Block-Point",
                    "direction": "Runtime-Pro-Direction",
                    "healing_core": "Runtime-Pro-Healing-Core",
                    "circle_readings": {
                        "inner": "Runtime-Pro-Inner-Reading",
                        "middle": "Runtime-Pro-Middle-Reading",
                        "outer": "Runtime-Pro-Outer-Reading",
                    },
                    "micro_sections": {
                        "节奏关系": "Runtime-Pro-Micro-Rhythm",
                        "关系模式": "Runtime-Pro-Micro-Relationship",
                        "行动模式": "Runtime-Pro-Micro-Action",
                    },
                    "root_cause": {
                        "surface": "Runtime-Pro-Root-Surface",
                        "deeper": "Runtime-Pro-Root-Deeper",
                        "core": "Runtime-Pro-Root-Core",
                    },
                },
            }

        def build_imbalance_projection(self, **kwargs):
            return {
                "contradiction": "Runtime-Imbalance-Primary",
                "manifestation": "Runtime-Imbalance-Manifestation",
                "direction": "Runtime-Imbalance-Direction",
                "healing_core": "Runtime-Imbalance-Healing-Core",
                "summary": "Runtime-Imbalance-Summary",
                "evidence": "Runtime-Imbalance-Evidence",
            }

        def build_pro_narrative_projection(self, **kwargs):
            assert kwargs["theme"] == "general"
            assert kwargs["lite_title"] == "Runtime-Lite-Title"
            assert kwargs["circle_fallbacks"]["inner"]
            return {
                "first_impression": "Runtime-Pro-First-Impression",
                "energy_essence": "Runtime-Pro-Energy-Essence",
                "block_point": "Runtime-Pro-Block-Point",
                "direction": "Runtime-Pro-Direction",
                "healing_core": "Runtime-Pro-Healing-Core",
                "circle_readings": {
                    "inner": "Runtime-Pro-Inner-Reading",
                    "middle": "Runtime-Pro-Middle-Reading",
                    "outer": "Runtime-Pro-Outer-Reading",
                },
                "micro_sections": {
                    "节奏关系": "Runtime-Pro-Micro-Rhythm",
                    "关系模式": "Runtime-Pro-Micro-Relationship",
                    "行动模式": "Runtime-Pro-Micro-Action",
                },
                "root_cause": {
                    "surface": "Runtime-Pro-Root-Surface",
                    "deeper": "Runtime-Pro-Root-Deeper",
                    "core": "Runtime-Pro-Root-Core",
                },
            }

    orchestrator = LayeredOrchestrator(enable_vision=False)
    orchestrator.narrative_service = StubNarrativeService()
    record = InterpretationRecord(
        theme="general",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )
    record.layer_0_raw = orchestrator._build_layer0_placeholder(record)
    record.layer_1_lite_draft = Layer1LiteDraft()
    record.layer_1_lite_draft.story.contradiction.content = "Lite contradiction"
    record.layer_1_lite_draft.story.block.content = "Lite block"
    record.layer_2_lite_final = Layer2LiteFinal(title="Runtime-Lite-Title")

    layer3 = orchestrator._build_pro_placeholder_draft(record)

    assert layer3.narrative_plan["mode"] == "pro"
    assert layer3.first_impression == "Runtime-Pro-First-Impression"
    assert layer3.core_insight_table["能量本质"] == "Runtime-Pro-Energy-Essence"
    assert layer3.core_insight_table["关键卡点"] == "Runtime-Pro-Block-Point"
    assert layer3.core_insight_table["转化方向"] == "Runtime-Pro-Direction"
    assert layer3.core_insight_table["疗愈核心"] == "Runtime-Pro-Healing-Core"
    assert layer3.three_circles_detailed["inner"]["reading"] == "Runtime-Pro-Inner-Reading"
    assert layer3.three_circles_detailed["middle"]["reading"] == "Runtime-Pro-Middle-Reading"
    assert layer3.three_circles_detailed["outer"]["reading"] == "Runtime-Pro-Outer-Reading"
    assert layer3.micro_analysis_detailed["节奏关系"] == "Runtime-Pro-Micro-Rhythm"
    assert layer3.root_cause["surface"] == "Runtime-Pro-Root-Surface"
    assert layer3.root_cause["deeper"] == "Runtime-Pro-Root-Deeper"
    assert layer3.root_cause["core"] == "Runtime-Pro-Root-Core"


def test_prompt_schema_validation_reports_missing_required_fields():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    validator = PromptSchemaValidator(orchestrator.prompt_builder)
    lite_layer = orchestrator._build_layer1_placeholder(
        type(
            "RecordStub",
            (),
            {
                "theme": "general",
                "painting_intention": "",
                "painting_feeling": "",
                "three_circles": {"inner_radius": 33, "middle_radius": 66},
                "layer_0_raw": None,
            },
        )()
    )
    lite_layer.title = ""

    pro_layer = orchestrator._build_pro_placeholder_draft(
        type(
            "RecordStub",
            (),
            {
                "theme": "general",
                "painting_intention": "",
                "painting_feeling": "",
                "three_circles": {"inner_radius": 33, "middle_radius": 66},
                "layer_0_raw": None,
                "layer_1_lite_draft": lite_layer,
                "layer_2_lite_final": None,
            },
        )()
    )
    pro_layer.first_impression = ""

    assert "title" in validator.validate_lite(lite_layer)
    assert "first_impression" in validator.validate_pro(pro_layer)


def test_generate_lite_placeholder_supports_custom_generation_runtime(tmp_path):
    class CustomRuntime:
        def generate_lite(self, orchestrator, record):
            layer0 = orchestrator._build_layer0_placeholder(record)
            layer1 = orchestrator._build_layer1_placeholder(record)
            layer1.title = "Runtime-Lite-Title"
            layer2 = orchestrator._build_lite_placeholder_report(record)
            layer2.title = "Runtime-Lite-Title"
            return LiteGenerationBundle(
                layer_0_raw=layer0,
                layer_1_lite_draft=layer1,
                layer_2_lite_final=layer2,
            )

        def generate_pro(self, orchestrator, record):
            layer3 = orchestrator._build_pro_placeholder_draft(record)
            layer4 = orchestrator._build_pro_placeholder_report(record)
            return ProGenerationBundle(
                layer_3_pro_draft=layer3,
                layer_4_pro_final=layer4,
            )

    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        generation_runtime=CustomRuntime(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-runtime-lite",
        )
    )

    assert record.layer_1_lite_draft is not None
    assert record.layer_2_lite_final is not None
    assert record.layer_1_lite_draft.title == "Runtime-Lite-Title"
    assert record.layer_2_lite_final.title == "Runtime-Lite-Title"


def test_upgrade_to_pro_supports_custom_generation_runtime(tmp_path):
    class CustomRuntime:
        def generate_lite(self, orchestrator, record):
            layer0 = orchestrator._build_layer0_placeholder(record)
            layer1 = orchestrator._build_layer1_placeholder(record)
            layer2 = orchestrator._build_lite_placeholder_report(record)
            return LiteGenerationBundle(
                layer_0_raw=layer0,
                layer_1_lite_draft=layer1,
                layer_2_lite_final=layer2,
            )

        def generate_pro(self, orchestrator, record):
            layer3 = orchestrator._build_pro_placeholder_draft(record)
            layer3.first_impression = "Runtime-Pro-First-Impression"
            layer4 = orchestrator._build_pro_placeholder_report(record)
            layer4.full_report_markdown = "Runtime-Pro-Report"
            return ProGenerationBundle(
                layer_3_pro_draft=layer3,
                layer_4_pro_final=layer4,
            )

    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        generation_runtime=CustomRuntime(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-runtime-pro",
        )
    )

    result = orchestrator.upgrade_to_pro(record.interpretation_id)
    assert result is not None
    upgraded = store.load(record.interpretation_id)
    assert upgraded is not None
    assert upgraded.layer_3_pro_draft is not None
    assert upgraded.layer_4_pro_final is not None
    assert upgraded.layer_3_pro_draft.first_impression == "Runtime-Pro-First-Impression"
    assert upgraded.layer_4_pro_final.full_report_markdown == "Runtime-Pro-Report"


def test_generation_runtime_is_deterministic_by_default(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-runtime-default",
        )
    )
    assert record.layer_1_lite_draft is not None
    assert record.layer_2_lite_final is not None

    upgraded = orchestrator.upgrade_to_pro(record.interpretation_id)
    assert upgraded is not None
    record_after_upgrade = store.load(record.interpretation_id)
    assert record_after_upgrade is not None
    assert record_after_upgrade.layer_3_pro_draft is not None
    assert record_after_upgrade.layer_4_pro_final is not None
    assert (
        record_after_upgrade.layer_3_pro_draft.root_cause.get("surface")
        != "Prompt-Root-Surface"
    )
