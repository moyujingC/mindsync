"""Minimal safety protocol migrated for the AI-Mandala To C V2 flow."""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional


class RiskLevel(Enum):
    """Risk levels used by the interpretation safety checks."""

    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

    def __str__(self) -> str:
        names = {0: "无风险", 1: "低风险", 2: "中风险", 3: "高风险", 4: "极高风险"}
        return names.get(self.value, "未知")


@dataclass
class SafetyCheckResult:
    """Structured safety evaluation output."""

    is_safe: bool
    risk_level: RiskLevel
    warnings: List[str]
    required_disclaimers: List[str]
    crisis_triggered: bool
    action_required: str


DISCLAIMER_TEMPLATES = {
    "basic": """
---

**⚠️ 重要声明**

1. **非医疗诊断**：本解读基于五行能量理论，反映的是绘画者的能量状态和潜意识模式，**不是医学诊断**，不能替代专业心理咨询或精神科治疗。

2. **仅供参考**：所有解读内容仅供参考，绘画者应结合自身实际情况理性看待。

3. **专业支持**：如您有严重的心理困扰、情绪障碍或精神健康问题，请务必寻求专业心理咨询师或精神科医生的帮助。

---
""",
    "with_crisis_hotline": """
---

**⚠️ 重要声明**

1. **非医疗诊断**：本解读基于五行能量理论，**不是医学诊断**，不能替代专业心理咨询或精神科治疗。

2. **仅供参考**：所有解读内容仅供参考。

3. **专业支持**：如您有严重的心理困扰，请务必寻求专业帮助。

**🚨 危机干预资源（24小时）**
- 全国心理援助热线：400-161-9995
- 生命热线：400-821-1215
- 急救电话：120

---
""",
    "high_risk": """
---

**⚠️ 重要声明**

1. **非医疗诊断**：本解读基于五行能量理论，**不是医学诊断**。

2. **风险提示**：您的画面显示一些需要关注的信号，这可能超出了本系统的识别范围。

3. **强烈建议**：
   - 寻求专业心理咨询师评估
   - 拨打心理援助热线：400-161-9995
   - 与家人朋友沟通您的状态

4. **紧急情况**：如有自伤、自杀念头，请立即拨打120或110。

**您的健康和安全是最重要的。**

---
""",
}


HIGH_RISK_IMBALANCES = {
    "水多火灭": {
        "risk_level": RiskLevel.CRITICAL,
        "warning": "⚠️ 高危信号：热情被完全浇灭，可能存在抑郁风险",
        "action": "强制显示危机干预信息，建议48小时内寻求专业支持",
    },
    "木不及": {
        "risk_level": RiskLevel.HIGH,
        "warning": "⚠️ 高风险：能量极低，缺乏生机",
        "action": "显示低能量提示，建议关注心理状态",
    },
    "火不及": {
        "risk_level": RiskLevel.HIGH,
        "warning": "⚠️ 高风险：缺乏热情，快感缺失",
        "action": "显示情感淡漠提示，建议寻求专业评估",
    },
}


COLOR_RISK_INDICATORS = {
    "extreme_pale": {
        "saturation_threshold": 0.20,
        "risk_level": RiskLevel.HIGH,
        "warning": "画面整体颜色偏淡，显示能量较低",
    },
    "dominant_black": {
        "ratio_threshold": 0.50,
        "risk_level": RiskLevel.HIGH,
        "warning": "黑色占比过高，可能存在恐惧或压抑",
    },
    "missing_fire": {
        "red_ratio_threshold": 0.05,
        "risk_level": RiskLevel.MEDIUM,
        "warning": "红色（火）元素缺失，热情不足",
    },
}


CRISIS_KEYWORDS = {
    "explicit": [
        "想死",
        "不想活",
        "自杀",
        "结束生命",
        "了结",
        "自残",
        "割腕",
        "跳楼",
        "烧炭",
        "上吊",
        "没有活下去的意义",
        "活着没意思",
        "想离开",
    ],
    "implicit": [
        "想消失",
        "不想醒来",
        "希望一觉不醒",
        "给别人添麻烦",
        "没有我会更好",
        "准备好走了",
        "安排好后事",
    ],
}


class SafetyProtocol:
    """Safety checks for To C interpretation content and signals."""

    def __init__(self) -> None:
        self.crisis_triggered = False
        self.risk_log: List[Dict[str, str]] = []

    def check_imbalance_risk(self, imbalance_type: str) -> SafetyCheckResult:
        """Evaluate known imbalance labels for elevated risk."""

        if imbalance_type not in HIGH_RISK_IMBALANCES:
            return SafetyCheckResult(
                is_safe=True,
                risk_level=RiskLevel.NONE,
                warnings=[],
                required_disclaimers=["basic"],
                crisis_triggered=False,
                action_required="none",
            )

        risk_data = HIGH_RISK_IMBALANCES[imbalance_type]
        risk_level = risk_data["risk_level"]

        return SafetyCheckResult(
            is_safe=risk_level != RiskLevel.CRITICAL,
            risk_level=risk_level,
            warnings=[risk_data["warning"]],
            required_disclaimers=(
                ["high_risk"] if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL] else ["basic"]
            ),
            crisis_triggered=risk_level == RiskLevel.CRITICAL,
            action_required=risk_data["action"],
        )

    def check_color_risk(self, color_analysis: Dict[str, float]) -> SafetyCheckResult:
        """Evaluate image color metrics for elevated risk signals."""

        warnings: List[str] = []
        max_risk = RiskLevel.NONE

        saturation = color_analysis.get("overall_saturation", 0.5)
        if saturation < COLOR_RISK_INDICATORS["extreme_pale"]["saturation_threshold"]:
            warnings.append(COLOR_RISK_INDICATORS["extreme_pale"]["warning"])
            max_risk = RiskLevel.HIGH

        black_ratio = color_analysis.get("black_ratio", 0.0)
        if black_ratio > COLOR_RISK_INDICATORS["dominant_black"]["ratio_threshold"]:
            warnings.append(COLOR_RISK_INDICATORS["dominant_black"]["warning"])
            max_risk = RiskLevel.HIGH

        red_ratio = color_analysis.get("red_ratio", 0.0)
        if red_ratio < COLOR_RISK_INDICATORS["missing_fire"]["red_ratio_threshold"]:
            warnings.append(COLOR_RISK_INDICATORS["missing_fire"]["warning"])
            if max_risk.value < RiskLevel.MEDIUM.value:
                max_risk = RiskLevel.MEDIUM

        return SafetyCheckResult(
            is_safe=max_risk != RiskLevel.CRITICAL,
            risk_level=max_risk,
            warnings=warnings,
            required_disclaimers=(
                ["high_risk"] if max_risk in [RiskLevel.HIGH, RiskLevel.CRITICAL] else ["basic"]
            ),
            crisis_triggered=False,
            action_required="suggest_professional" if max_risk == RiskLevel.HIGH else "none",
        )

    def check_text_content(self, text: str) -> SafetyCheckResult:
        """Scan text for explicit or implicit crisis signals."""

        text_lower = text.lower()

        for keyword in CRISIS_KEYWORDS["explicit"]:
            if keyword in text_lower:
                return SafetyCheckResult(
                    is_safe=False,
                    risk_level=RiskLevel.CRITICAL,
                    warnings=["⚠️ 检测到可能的危机信号"],
                    required_disclaimers=["with_crisis_hotline"],
                    crisis_triggered=True,
                    action_required="immediate_intervention",
                )

        for keyword in CRISIS_KEYWORDS["implicit"]:
            if keyword in text_lower:
                return SafetyCheckResult(
                    is_safe=False,
                    risk_level=RiskLevel.HIGH,
                    warnings=["⚠️ 检测到需要关注的信号"],
                    required_disclaimers=["high_risk"],
                    crisis_triggered=False,
                    action_required="suggest_assessment",
                )

        return SafetyCheckResult(
            is_safe=True,
            risk_level=RiskLevel.NONE,
            warnings=[],
            required_disclaimers=["basic"],
            crisis_triggered=False,
            action_required="none",
        )

    def get_disclaimer(self, disclaimer_type: str = "basic") -> str:
        """Return a disclaimer block for the requested risk context."""

        return DISCLAIMER_TEMPLATES.get(disclaimer_type, DISCLAIMER_TEMPLATES["basic"])

    def wrap_output(self, content: str, risk_level: RiskLevel, context: str = "toc") -> str:
        """Wrap generated content with the matching disclaimer."""

        if risk_level == RiskLevel.CRITICAL:
            disclaimer_type = "with_crisis_hotline"
        elif risk_level == RiskLevel.HIGH:
            disclaimer_type = "high_risk"
        else:
            disclaimer_type = "basic"

        disclaimer = self.get_disclaimer(disclaimer_type)

        if context == "toc":
            return f"{disclaimer}\n\n{content}\n\n{disclaimer}"
        return content


def quick_safety_check(
    imbalance_type: Optional[str] = None,
    color_analysis: Optional[Dict[str, float]] = None,
    text_content: Optional[str] = None,
) -> SafetyCheckResult:
    """Run a combined safety check across supported To C signal types."""

    protocol = SafetyProtocol()
    max_risk = RiskLevel.NONE
    all_warnings: List[str] = []
    crisis_triggered = False

    if imbalance_type:
        result = protocol.check_imbalance_risk(imbalance_type)
        if result.risk_level.value > max_risk.value:
            max_risk = result.risk_level
        all_warnings.extend(result.warnings)
        crisis_triggered = crisis_triggered or result.crisis_triggered

    if color_analysis:
        result = protocol.check_color_risk(color_analysis)
        if result.risk_level.value > max_risk.value:
            max_risk = result.risk_level
        all_warnings.extend(result.warnings)

    if text_content:
        result = protocol.check_text_content(text_content)
        if result.risk_level.value > max_risk.value:
            max_risk = result.risk_level
        all_warnings.extend(result.warnings)
        crisis_triggered = crisis_triggered or result.crisis_triggered

    if max_risk == RiskLevel.CRITICAL:
        required_disclaimers = ["with_crisis_hotline"]
    elif max_risk == RiskLevel.HIGH:
        required_disclaimers = ["high_risk"]
    else:
        required_disclaimers = ["basic"]

    return SafetyCheckResult(
        is_safe=max_risk != RiskLevel.CRITICAL,
        risk_level=max_risk,
        warnings=all_warnings,
        required_disclaimers=required_disclaimers,
        crisis_triggered=crisis_triggered,
        action_required=(
            "immediate_intervention"
            if crisis_triggered
            else "suggest_professional" if max_risk == RiskLevel.HIGH else "none"
        ),
    )
