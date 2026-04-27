"""
分层数据模型单元测试

测试内容：
- Layer0-4 数据模型
- 解读记录 (InterpretationRecord)
- 升级逻辑
"""

import sys
import os

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.pipeline.data_models import (
    InterpretationVersion,
    GenerationStatus,
    FiveElementsData,
    ThreeCirclesData,
    Layer0Raw,
    SixInsights,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
    Layer4ProFinal,
    UpgradeHistory,
    InterpretationRecord,
)


class TestEnums:
    """测试枚举类型"""

    def test_interpretation_version(self):
        """测试解读版本枚举"""
        assert InterpretationVersion.LITE == "lite"
        assert InterpretationVersion.PRO == "pro"

    def test_generation_status(self):
        """测试生成状态枚举"""
        assert GenerationStatus.PENDING == "pending"
        assert GenerationStatus.PROCESSING == "processing"
        assert GenerationStatus.COMPLETED == "completed"
        assert GenerationStatus.FAILED == "failed"


class TestFiveElementsData:
    """测试五行数据模型"""

    def test_default_initialization(self):
        """测试默认初始化"""
        data = FiveElementsData()
        assert data.wood == {}
        assert data.fire == {}
        assert data.earth == {}
        assert data.metal == {}
        assert data.water == {}

    def test_custom_values(self):
        """测试自定义值"""
        data = FiveElementsData(
            wood={"ratio": 0.3, "colors": ["青", "绿"]},
            fire={"ratio": 0.2, "colors": ["红"]},
        )
        assert data.wood["ratio"] == 0.3
        assert "红" in data.fire["colors"]


class TestThreeCirclesData:
    """测试三圈数据模型"""

    def test_default_initialization(self):
        """测试默认初始化"""
        data = ThreeCirclesData()
        assert data.inner == {}
        assert data.middle == {}
        assert data.outer == {}

    def test_circle_data(self):
        """测试三圈数据设置"""
        data = ThreeCirclesData(
            inner={"dominant": "火", "energy": "high"},
            middle={"dominant": "水", "energy": "medium"},
            outer={"dominant": "土", "energy": "low"},
        )
        assert data.inner["dominant"] == "火"
        assert data.middle["energy"] == "medium"


class TestLayer0Raw:
    """测试 Layer0 原始数据模型"""

    def test_default_initialization(self):
        """测试默认初始化"""
        layer = Layer0Raw()
        assert layer.description == "知识库原始查询结果"
        assert isinstance(layer.five_elements, FiveElementsData)
        assert isinstance(layer.three_circles, ThreeCirclesData)
        assert layer.imbalance_candidates == []
        assert layer.fidelity_flags == []
        assert layer.quality_flags == []

    def test_to_dict(self):
        """测试转换为字典"""
        layer = Layer0Raw(
            five_elements=FiveElementsData(wood={"ratio": 0.5}),
            imbalance_candidates=["水多木漂"],
            fidelity_flags=["warning:水多火灭"],
            layer0_passed=False,
            layer0_failure_reason="layer0_vision_unconfigured",
            layer0_failure_detail={"stage": "vision"},
        )
        data = layer.to_dict()
        assert "five_elements" in data
        assert "input_package" in data
        assert "visual_analysis_basis" in data
        assert data["imbalance_candidates"] == ["水多木漂"]
        assert data["fidelity_flags"] == ["warning:水多火灭"]
        assert data["quality_flags"] == ["warning:水多火灭"]
        assert data["layer0_passed"] is False
        assert data["layer0_failure_reason"] == "layer0_vision_unconfigured"
        assert data["layer0_failure_detail"] == {"stage": "vision"}
        assert "created_at" in data

    def test_quality_flags_aliases_fidelity_flags(self):
        """测试 quality_flags 兼容 fidelity_flags"""
        layer = Layer0Raw()

        layer.fidelity_flags = ["trace:tob_only_candidate_present"]
        assert layer.quality_flags == ["trace:tob_only_candidate_present"]

        layer.quality_flags = ["fallback:generated"]
        assert layer.fidelity_flags == ["fallback:generated"]


class TestSixInsights:
    """测试六个洞察数据模型"""

    def test_default_initialization(self):
        """测试默认初始化"""
        insights = SixInsights()
        assert insights.base == {}
        assert insights.contradiction == {}
        assert insights.pattern == {}
        assert insights.defense == {}
        assert insights.block == {}
        assert insights.light == {}

    def test_custom_insights(self):
        """测试自定义洞察"""
        insights = SixInsights(
            base={"raw": "木火能量主导", "rendered": "你的底色温暖而向上"},
            contradiction={"raw": "木多火塞", "rendered": "你在热情中带着压抑"},
        )
        assert "木火" in insights.base["raw"]
        assert "温暖" in insights.base["rendered"]


class TestLayer1LiteDraft:
    """测试 Layer1 Lite草稿模型"""

    def test_default_initialization(self):
        """测试默认初始化"""
        layer = Layer1LiteDraft()
        assert layer.title == ""
        assert layer.overall_impression == ""
        assert isinstance(layer.six_insights, SixInsights)

    def test_with_insights(self):
        """测试带洞察的数据"""
        layer = Layer1LiteDraft(
            title="燃烧的静默",
            overall_impression="这是一幅充满张力的曼陀罗",
            six_insights=SixInsights(
                base={"raw": "木火主导"},
                light={"raw": "内在力量"},
            ),
        )
        assert layer.title == "燃烧的静默"
        assert layer.six_insights.base["raw"] == "木火主导"

    def test_narrative_plan_serializes(self):
        """测试 narrative_plan 可序列化"""
        layer = Layer1LiteDraft(
            title="燃烧的静默",
            narrative_plan={
                "mode": "lite",
                "generation_mode": "evidence_first",
                "sections": {
                    "title": {
                        "content": "燃烧的静默",
                        "trace": {"rule_refs": ["primary_candidates:水多火灭"]},
                    }
                },
            },
        )

        data = layer.to_dict()

        assert data["narrative_plan"]["mode"] == "lite"
        assert data["narrative_plan"]["sections"]["title"]["content"] == "燃烧的静默"


class TestLayer2LiteFinal:
    """测试 Layer2 Lite最终模型"""

    def test_default_initialization(self):
        """测试默认初始化"""
        layer = Layer2LiteFinal()
        assert layer.full_report_markdown == ""
        assert layer.six_insights_rendered == {}

    def test_full_report(self):
        """测试完整报告"""
        report_md = "# 曼陀罗解读\n\n## 整体印象\n这是一幅..."
        layer = Layer2LiteFinal(
            title="测试标题",
            full_report_markdown=report_md,
            six_insights_rendered={
                "base": "你的底色是温暖的火",
                "light": "你的光在于创造力",
            },
        )
        assert layer.full_report_markdown == report_md
        assert "底色" in layer.six_insights_rendered["base"]


class TestLayer3ProDraft:
    """测试 Layer3 Pro草稿模型"""

    def test_default_initialization(self):
        """测试默认初始化"""
        layer = Layer3ProDraft()
        assert layer.first_impression == ""
        assert layer.core_insight_table == {}
        assert layer.healing_suggestions == []

    def test_pro_content(self):
        """测试Pro内容"""
        layer = Layer3ProDraft(
            first_impression="画面显示强烈的自我保护",
            core_insight_table={
                "energy_essence": "木火过旺",
                "imbalance": "木多火塞",
            },
            imbalance_confirmed={
                "type": "木多火塞",
                "confidence": 0.85,
            },
        )
        assert "自我保护" in layer.first_impression
        assert layer.imbalance_confirmed["confidence"] == 0.85

    def test_narrative_plan_serializes(self):
        """测试 Pro narrative_plan 可序列化"""
        layer = Layer3ProDraft(
            first_impression="画面显示强烈的自我保护",
            narrative_plan={
                "mode": "pro",
                "generation_mode": "evidence_first",
                "sections": {
                    "first_impression": {
                        "content": "画面显示强烈的自我保护",
                        "trace": {"rule_refs": ["primary_candidates:水多火灭"]},
                    }
                },
            },
        )

        data = layer.to_dict()

        assert data["narrative_plan"]["mode"] == "pro"
        assert (
            data["narrative_plan"]["sections"]["first_impression"]["content"]
            == "画面显示强烈的自我保护"
        )


class TestLayer4ProFinal:
    """测试 Layer4 Pro最终模型"""

    def test_default_initialization(self):
        """测试默认初始化"""
        layer = Layer4ProFinal()
        assert layer.full_report_markdown == ""
        assert layer.ai_qa_context == ""

    def test_ai_qa_context(self):
        """测试AI问答上下文"""
        layer = Layer4ProFinal(
            full_report_markdown="# Pro版完整报告",
            ai_qa_context="""
画像标题: 燃烧的静默
整体印象: 充满张力的曼陀罗
失衡类型: 木多火塞
""",
        )
        assert "Pro版完整报告" in layer.full_report_markdown
        assert "木多火塞" in layer.ai_qa_context


class TestUpgradeHistory:
    """测试升级历史"""

    def test_upgrade_record(self):
        """测试升级记录"""
        history = UpgradeHistory(
            from_version="lite",
            to_version="pro",
            price_diff=29.0,
        )
        assert history.from_version == "lite"
        assert history.to_version == "pro"
        assert history.price_diff == 29.0
        assert history.at is not None

    def test_to_dict(self):
        """测试转换为字典"""
        history = UpgradeHistory(
            from_version="lite",
            to_version="pro",
            price_diff=29.0,
        )
        data = history.to_dict()
        assert data["from"] == "lite"
        assert data["to"] == "pro"
        assert data["price_diff"] == 29.0


class TestInterpretationRecord:
    """测试解读记录"""

    def test_default_initialization(self):
        """测试默认初始化"""
        record = InterpretationRecord()
        assert record.interpretation_id is not None
        assert record.user_id == ""
        assert record.theme == "general"
        assert record.version_purchased == []
        assert record.status == GenerationStatus.PENDING

    def test_record_with_layers(self):
        """测试带层数据的记录"""
        record = InterpretationRecord(
            user_id="user-123",
            theme="intimate_relationship",
            layer_0_raw=Layer0Raw(),
            layer_1_lite_draft=Layer1LiteDraft(title="测试"),
            layer_2_lite_final=Layer2LiteFinal(full_report_markdown="# 报告"),
        )
        assert record.user_id == "user-123"
        assert record.theme == "intimate_relationship"
        assert record.layer_0_raw is not None
        assert record.layer_1_lite_draft.title == "测试"

    def test_can_upgrade_to_pro_true(self):
        """测试可以升级到Pro的情况"""
        record = InterpretationRecord(
            version_purchased=["lite"],
            layer_0_raw=Layer0Raw(),
            layer_1_lite_draft=Layer1LiteDraft(),
        )
        assert record.can_upgrade_to_pro() is True

    def test_can_upgrade_to_pro_already_pro(self):
        """测试已购买Pro的情况"""
        record = InterpretationRecord(
            version_purchased=["lite", "pro"],
            layer_0_raw=Layer0Raw(),
            layer_1_lite_draft=Layer1LiteDraft(),
        )
        assert record.can_upgrade_to_pro() is False

    def test_can_upgrade_to_pro_no_lite(self):
        """测试未购买Lite的情况"""
        record = InterpretationRecord(
            version_purchased=[],
            layer_0_raw=Layer0Raw(),
        )
        assert record.can_upgrade_to_pro() is False

    def test_can_upgrade_to_pro_no_layer_data(self):
        """测试缺少层数据的情况"""
        record = InterpretationRecord(
            version_purchased=["lite"],
            layer_0_raw=None,
        )
        assert record.can_upgrade_to_pro() is False

    def test_get_lite_report(self):
        """测试获取Lite报告"""
        record = InterpretationRecord(
            layer_2_lite_final=Layer2LiteFinal(full_report_markdown="# Lite报告"),
        )
        assert "# Lite报告" in record.get_lite_report()

    def test_get_lite_report_none(self):
        """测试获取Lite报告为空的情况"""
        record = InterpretationRecord()
        assert record.get_lite_report() is None

    def test_get_pro_report(self):
        """测试获取Pro报告"""
        record = InterpretationRecord(
            layer_4_pro_final=Layer4ProFinal(full_report_markdown="# Pro报告"),
        )
        assert "# Pro报告" in record.get_pro_report()

    def test_get_ai_qa_context(self):
        """测试获取AI问答上下文"""
        record = InterpretationRecord(
            layer_4_pro_final=Layer4ProFinal(ai_qa_context="问答上下文"),
        )
        assert record.get_ai_qa_context() == "问答上下文"

    def test_to_dict(self):
        """测试转换为字典"""
        record = InterpretationRecord(
            user_id="user-test",
            theme="general",
            version_purchased=["lite"],
        )
        data = record.to_dict()
        assert data["user_id"] == "user-test"
        assert data["theme"] == "general"
        assert data["version_purchased"] == ["lite"]
        assert "interpretation_id" in data
