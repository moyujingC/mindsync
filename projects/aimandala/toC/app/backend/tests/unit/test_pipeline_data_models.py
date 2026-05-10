"""Stage-based pipeline data model tests."""

from app.core.pipeline.data_models import (
    GenerationStatus,
    InterpretationRecord,
    InterpretationVersion,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
    Layer4ProFinal,
    SixInsights,
    StageProcessPackage,
)


class TestEnums:
    def test_interpretation_version(self):
        assert InterpretationVersion.LITE == "lite"
        assert InterpretationVersion.PRO == "pro"

    def test_generation_status(self):
        assert GenerationStatus.PENDING == "pending"
        assert GenerationStatus.PROCESSING == "processing"
        assert GenerationStatus.COMPLETED == "completed"
        assert GenerationStatus.FAILED == "failed"


class TestStageProcessPackage:
    def test_to_dict(self):
        package = StageProcessPackage(
            payload={
                "process_contract": {"generation_mode": "stage_based_runtime"},
                "stage-01-user-input-context": {"theme": "general"},
            }
        )

        data = package.to_dict()

        assert data["payload"]["process_contract"]["generation_mode"] == "stage_based_runtime"
        assert data["payload"]["stage-01-user-input-context"]["theme"] == "general"
        assert data["created_at"]


class TestSixInsights:
    def test_default_initialization(self):
        insights = SixInsights()
        assert insights.base == {}
        assert insights.contradiction == {}
        assert insights.pattern == {}
        assert insights.defense == {}
        assert insights.block == {}
        assert insights.light == {}

    def test_custom_insights(self):
        insights = SixInsights(
            base={"raw": "木火能量主导", "rendered": "你的底色温暖而向上"},
            contradiction={"raw": "木多火塞", "rendered": "你在热情中带着压抑"},
        )
        assert "木火" in insights.base["raw"]
        assert "温暖" in insights.base["rendered"]


class TestLayer1LiteDraft:
    def test_default_initialization(self):
        layer = Layer1LiteDraft()
        assert layer.title == ""
        assert layer.overall_impression == ""
        assert isinstance(layer.six_insights, SixInsights)

    def test_narrative_plan_serializes(self):
        layer = Layer1LiteDraft(
            title="燃烧的静默",
            narrative_plan={
                "mode": "lite",
                "generation_mode": "stage_based_runtime",
                "sections": {"title": {"content": "燃烧的静默"}},
            },
        )

        data = layer.to_dict()

        assert data["narrative_plan"]["mode"] == "lite"
        assert data["narrative_plan"]["sections"]["title"]["content"] == "燃烧的静默"


class TestLayer2LiteFinal:
    def test_full_report(self):
        layer = Layer2LiteFinal(
            title="测试标题",
            full_report_markdown="# 曼陀罗解读\n\n## 整体印象\n这是一幅...",
        )
        assert layer.title == "测试标题"
        assert "曼陀罗解读" in layer.full_report_markdown
        assert layer.to_dict()["title"] == "测试标题"


class TestLayer3ProDraft:
    def test_to_dict(self):
        layer = Layer3ProDraft(
            first_impression="你正在重新整理自己的节奏。",
            core_insight_table={"能量本质": "先稳住再向外"},
            root_cause={"surface": "推进变慢", "deeper": "需要确认承接", "core": "害怕失控"},
            healing_suggestions=[{"phase": "当前阶段", "focus": "先稳定", "practice": "记录一个身体信号"}],
        )

        data = layer.to_dict()

        assert data["first_impression"].startswith("你正在")
        assert data["core_insight_table"]["能量本质"] == "先稳住再向外"
        assert data["root_cause"]["core"] == "害怕失控"
        assert data["healing_suggestions"][0]["practice"] == "记录一个身体信号"


class TestInterpretationRecord:
    def test_default_initialization(self):
        record = InterpretationRecord()
        assert record.interpretation_id is not None
        assert record.user_id == ""
        assert record.theme == "general"
        assert record.version_purchased == []
        assert record.status == GenerationStatus.PENDING

    def test_record_with_stage_package_and_layers(self):
        record = InterpretationRecord(
            user_id="user-123",
            theme="intimate_relationship",
            stage_process_package=StageProcessPackage(payload={"stage-01-user-input-context": {"theme": "intimate_relationship"}}),
            layer_1_lite_draft=Layer1LiteDraft(title="测试"),
            layer_2_lite_final=Layer2LiteFinal(full_report_markdown="# 报告"),
        )
        assert record.user_id == "user-123"
        assert record.theme == "intimate_relationship"
        assert record.stage_process_package is not None
        assert record.layer_1_lite_draft.title == "测试"

    def test_can_upgrade_to_pro_true(self):
        record = InterpretationRecord(
            version_purchased=["lite"],
            stage_process_package=StageProcessPackage(payload={"stage-01-user-input-context": {}}),
            layer_1_lite_draft=Layer1LiteDraft(),
        )
        assert record.can_upgrade_to_pro() is True

    def test_can_upgrade_to_pro_already_pro(self):
        record = InterpretationRecord(
            version_purchased=["lite", "pro"],
            stage_process_package=StageProcessPackage(payload={"stage-01-user-input-context": {}}),
            layer_1_lite_draft=Layer1LiteDraft(),
        )
        assert record.can_upgrade_to_pro() is False

    def test_can_upgrade_to_pro_no_stage_package(self):
        record = InterpretationRecord(
            version_purchased=["lite"],
            layer_1_lite_draft=Layer1LiteDraft(),
        )
        assert record.can_upgrade_to_pro() is False

    def test_get_reports(self):
        record = InterpretationRecord(
            layer_2_lite_final=Layer2LiteFinal(full_report_markdown="# Lite报告"),
            layer_4_pro_final=Layer4ProFinal(full_report_markdown="# Pro报告", ai_qa_context="问答上下文"),
        )
        assert "# Lite报告" in record.get_lite_report()
        assert "# Pro报告" in record.get_pro_report()
        assert record.get_ai_qa_context() == "问答上下文"

    def test_to_dict_uses_stage_process_package(self):
        record = InterpretationRecord(
            user_id="user-test",
            theme="general",
            version_purchased=["lite"],
            stage_process_package=StageProcessPackage(payload={"stage-02-circle-boundary-decision": {"inner_middle_radius": 35}}),
        )
        data = record.to_dict()
        assert data["user_id"] == "user-test"
        assert data["theme"] == "general"
        assert data["version_purchased"] == ["lite"]
        assert data["stage_process_package"]["payload"]["stage-02-circle-boundary-decision"]["inner_middle_radius"] == 35
        assert "stage_process_package" in data
        assert "interpretation_id" in data
