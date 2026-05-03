"""Unit tests for the migrated To C safety protocol."""

import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.safety.protocol import RiskLevel, SafetyProtocol, quick_safety_check


def test_imbalance_risk_detects_critical_case():
    protocol = SafetyProtocol()

    result = protocol.check_imbalance_risk("水多火灭")

    assert result.is_safe is False
    assert result.risk_level == RiskLevel.CRITICAL
    assert result.crisis_triggered is True
    assert result.required_disclaimers == ["high_risk"]


def test_color_risk_detects_pale_and_missing_fire():
    protocol = SafetyProtocol()

    result = protocol.check_color_risk(
        {
            "overall_saturation": 0.1,
            "black_ratio": 0.1,
            "red_ratio": 0.01,
        }
    )

    assert result.risk_level == RiskLevel.HIGH
    assert any("颜色偏淡" in warning for warning in result.warnings)
    assert any("红色（火）元素缺失" in warning for warning in result.warnings)


def test_text_content_detects_crisis_keyword():
    protocol = SafetyProtocol()

    result = protocol.check_text_content("我最近真的不想活了。")

    assert result.is_safe is False
    assert result.risk_level == RiskLevel.CRITICAL
    assert result.required_disclaimers == ["with_crisis_hotline"]
    assert result.action_required == "immediate_intervention"


def test_quick_safety_check_combines_multiple_signals():
    result = quick_safety_check(
        imbalance_type="金多木折",
        color_analysis={"overall_saturation": 0.3, "black_ratio": 0.6, "red_ratio": 0.2},
    )

    assert result.risk_level == RiskLevel.HIGH
    assert result.is_safe is True
    assert result.required_disclaimers == ["high_risk"]
    assert result.action_required == "suggest_professional"


def test_ordinary_imbalance_does_not_trigger_high_risk_without_crisis_signal():
    result = quick_safety_check(
        imbalance_type="金多木折",
        color_analysis={"overall_saturation": 0.3, "black_ratio": 0.0, "red_ratio": 0.2},
        text_content="理清当前职业推进中的拉扯。想往前，但也担心失控。",
    )

    assert result.risk_level == RiskLevel.NONE
    assert result.required_disclaimers == ["basic"]
    assert result.action_required == "none"


def test_wrap_output_adds_disclaimer_for_toc():
    protocol = SafetyProtocol()

    wrapped = protocol.wrap_output("报告正文", RiskLevel.HIGH, context="toc")

    assert "报告正文" in wrapped
    assert "重要声明" in wrapped
