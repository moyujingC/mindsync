"""Unit tests for the minimal migrated V2 orchestrator shell."""

import asyncio
import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.analysis.circle_detector import CircleDetectionResult
from app.core.pipeline.data_models import GenerationStatus, Layer1LiteDraft
from app.core.pipeline.prompt_runtime import NoopPromptRuntime
from app.core.pipeline.orchestrator_v2 import (
    GenerationStage,
    LayeredOrchestrator,
    PricingSnapshot,
)
from app.core.pipeline.generation_runtime import (
    LiteGenerationBundle,
    ProGenerationBundle,
    PromptBackedReportGenerationRuntime,
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


def test_generation_stage_values():
    assert GenerationStage.PENDING == "pending"
    assert GenerationStage.DETECTING == "detecting"
    assert GenerationStage.ANALYZING == "analyzing"
    assert GenerationStage.GENERATING == "generating"
    assert GenerationStage.FINALIZING == "finalizing"
    assert GenerationStage.COMPLETED == "completed"
    assert GenerationStage.FAILED == "failed"


def test_pricing_snapshot_to_dict():
    snapshot = PricingSnapshot(lite=9.9, pro=49.0, upgrade_diff=39.1)

    assert snapshot.to_dict() == {
        "lite": 9.9,
        "pro": 49.0,
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
    assert pricing.pro == 49.0
    assert pricing.upgrade_diff == 39.1


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
    assert "失衡类型与对应疗愈建议" in report["structured"]["pro_teaser"]
    assert "【你的底色" in report["structured"]["six_insights_rendered"]["base"]
    assert report["can_upgrade"] is True


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


def test_prompt_backed_runtime_applies_three_awareness_payload():
    runtime = PromptBackedReportGenerationRuntime(prompt_runtime=NoopPromptRuntime())
    layer = Layer1LiteDraft()

    runtime._apply_lite_payload(
        layer,
        {
            "three_awareness": [
                {"day": 1, "title": "先慢下来", "content": "今天先不要同时推进三件事。"},
                {"title": "看见拉扯", "content": "留意你是在想前进，还是想先保护自己。"},
            ]
        },
    )

    assert len(layer.three_awareness) == 2
    assert layer.three_awareness[0].day == 1
    assert layer.three_awareness[0].title == "先慢下来"
    assert layer.three_awareness[1].day == 2
    assert layer.three_awareness[1].content == "留意你是在想前进，还是想先保护自己。"


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
    store.save(record)

    result = orchestrator.upgrade_to_pro(record.interpretation_id)

    assert result is not None
    upgraded = store.load(record.interpretation_id)
    assert upgraded is not None
    assert upgraded.layer_3_pro_draft is not None
    assert upgraded.layer_3_pro_draft.healing_suggestions
    assert "财富焦虑" in upgraded.layer_3_pro_draft.healing_suggestions[0]["focus"]
    assert "72小时决策" not in upgraded.layer_3_pro_draft.healing_suggestions[0]["practice"]


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


def test_prompt_runtime_can_override_lite_and_pro_structured_fields(tmp_path):
    class StubPromptRuntime:
        def generate_lite(self, *, prompt, schema):
            assert "一镜 Lite 版解读报告模板 v1.6" in prompt
            assert schema.get("type") == "lite"
            return {
                "title": "Prompt-Lite-Title",
                "overall_impression": "Prompt-Lite-Overall",
                "visual_elements": "Prompt-Lite-Visual",
                "emotion_portrait": "Prompt-Lite-Emotion",
                "story": {
                    "base": "Prompt-Story-Base",
                    "contradiction": "Prompt-Story-Contradiction",
                    "pattern": "Prompt-Story-Pattern",
                    "defense": "Prompt-Story-Defense",
                    "block": "Prompt-Story-Block",
                    "light": "Prompt-Story-Light",
                },
                "theme_scene": "Prompt-Theme-Scene",
                "theme_impact": "Prompt-Theme-Impact",
                "theme_awareness": "Prompt-Theme-Awareness",
                "pro_teaser": "Prompt-Pro-Teaser",
            }

        def generate_pro(self, *, prompt, schema):
            assert "一梳 Pro 版解读报告模板 v1.6" in prompt
            assert schema.get("type") == "pro"
            return {
                "first_impression": "Prompt-Pro-First-Impression",
                "core_insight_table": {
                    "能量本质": "Prompt-Core-Essence",
                },
                "root_cause": {
                    "surface": "Prompt-Root-Surface",
                },
            }

    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        prompt_runtime=StubPromptRuntime(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-prompt-runtime",
        )
    )
    assert record.layer_1_lite_draft is not None
    assert record.layer_2_lite_final is not None
    assert record.layer_1_lite_draft.title == "Prompt-Lite-Title"
    assert record.layer_2_lite_final.title == "Prompt-Lite-Title"
    assert "Prompt-Lite-Overall" in record.layer_2_lite_final.full_report_markdown
    assert "Prompt-Theme-Scene" in record.layer_2_lite_final.full_report_markdown

    upgraded = orchestrator.upgrade_to_pro(record.interpretation_id)
    assert upgraded is not None
    record_after_upgrade = store.load(record.interpretation_id)
    assert record_after_upgrade is not None
    assert record_after_upgrade.layer_3_pro_draft is not None
    assert record_after_upgrade.layer_4_pro_final is not None
    assert (
        record_after_upgrade.layer_3_pro_draft.first_impression
        == "Prompt-Pro-First-Impression"
    )
    assert "Prompt-Pro-First-Impression" in record_after_upgrade.layer_4_pro_final.full_report_markdown
