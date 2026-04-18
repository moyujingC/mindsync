"""
分层数据模型 - 5层架构

确保Lite和Pro版本的一致性，支持升级模式
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
import uuid


class InterpretationVersion(str, Enum):
    """解读版本"""

    LITE = "lite"
    PRO = "pro"


class GenerationStatus(str, Enum):
    """生成状态"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class FiveElementsData:
    """五行分布数据"""

    wood: Dict[str, Any] = field(default_factory=dict)
    fire: Dict[str, Any] = field(default_factory=dict)
    earth: Dict[str, Any] = field(default_factory=dict)
    metal: Dict[str, Any] = field(default_factory=dict)
    water: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ThreeCirclesData:
    """三圈结构数据"""

    inner: Dict[str, Any] = field(default_factory=dict)  # 内圈·核心自我
    middle: Dict[str, Any] = field(default_factory=dict)  # 中圈·关系场域
    outer: Dict[str, Any] = field(default_factory=dict)  # 外圈·外在呈现


@dataclass
class MicroAnalysisData:
    """微观关系分析"""

    adjacent: List[str] = field(default_factory=list)  # 相邻关系
    wrap: List[str] = field(default_factory=list)  # 包裹关系


@dataclass
class Layer0Raw:
    """
    Layer 0: 知识库原始查询结果（最底层数据）

    这是所有生成的基础，从知识库查询得到的原始结构化数据
    """

    description: str = "知识库原始查询结果"

    # 五行分布
    five_elements: FiveElementsData = field(default_factory=FiveElementsData)

    # 三圈结构
    three_circles: ThreeCirclesData = field(default_factory=ThreeCirclesData)

    # 微观关系
    micro_analysis: MicroAnalysisData = field(default_factory=MicroAnalysisData)

    # 失衡类型候选（可能是多个）
    imbalance_candidates: List[str] = field(default_factory=list)

    # 颜色分析原始数据
    color_analysis: Dict[str, Any] = field(default_factory=dict)

    # 三圈颜色分析结果（基于用户配置的三圈边界）
    # 结构: {"inner": {...}, "middle": {...}, "outer": {...}}
    circle_colors: Optional[Dict[str, Any]] = None

    # v2.1 正式结构化证据字段
    visual_facts: Dict[str, Any] = field(default_factory=dict)
    knowledge_hits: Dict[str, Any] = field(default_factory=dict)
    rule_evaluations: Dict[str, Any] = field(default_factory=dict)
    theme_projection: Dict[str, Any] = field(default_factory=dict)
    fidelity_flags: List[str] = field(default_factory=list)
    quality_flags: List[str] = field(default_factory=list)
    fallback_summary: Dict[str, Any] = field(default_factory=dict)

    # 生成时间戳
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def __post_init__(self) -> None:
        flags = self.fidelity_flags if self.fidelity_flags else self.quality_flags
        normalized = self._normalize_flag_list(flags)
        object.__setattr__(self, "fidelity_flags", normalized)
        object.__setattr__(self, "quality_flags", list(normalized))

    def __setattr__(self, name: str, value: Any) -> None:
        if name in {"fidelity_flags", "quality_flags"}:
            normalized = self._normalize_flag_list(value)
            counterpart_name = "quality_flags" if name == "fidelity_flags" else "fidelity_flags"
            counterpart = list(object.__getattribute__(self, "__dict__").get(counterpart_name, []))
            if (
                not normalized
                and counterpart
                and "created_at" not in object.__getattribute__(self, "__dict__")
            ):
                normalized = counterpart
            object.__setattr__(self, "fidelity_flags", normalized)
            object.__setattr__(self, "quality_flags", list(normalized))
            return
        object.__setattr__(self, name, value)

    @staticmethod
    def _normalize_flag_list(value: Any) -> List[str]:
        if not isinstance(value, list):
            return []
        return [
            str(item).strip()
            for item in value
            if isinstance(item, str) and str(item).strip()
        ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "description": self.description,
            "five_elements": {
                "wood": self.five_elements.wood,
                "fire": self.five_elements.fire,
                "earth": self.five_elements.earth,
                "metal": self.five_elements.metal,
                "water": self.five_elements.water,
            },
            "three_circles": {
                "inner": self.three_circles.inner,
                "middle": self.three_circles.middle,
                "outer": self.three_circles.outer,
            },
            "micro_analysis": {
                "adjacent": self.micro_analysis.adjacent,
                "wrap": self.micro_analysis.wrap,
            },
            "imbalance_candidates": self.imbalance_candidates,
            "color_analysis": self.color_analysis,
            "circle_colors": self.circle_colors,
            "visual_facts": self.visual_facts,
            "knowledge_hits": self.knowledge_hits,
            "rule_evaluations": self.rule_evaluations,
            "theme_projection": self.theme_projection,
            "fidelity_flags": self.fidelity_flags,
            "quality_flags": self.quality_flags,
            "fallback_summary": self.fallback_summary,
            "created_at": self.created_at,
        }


@dataclass
class StoryNode:
    """故事节点（起承转合结构）"""
    content: str = ""  # 节点内容
    connector: Optional[str] = None  # 连接词（如"但与此同时..."）

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "connector": self.connector,
        }


@dataclass
class StoryStructure:
    """心灵画像故事结构（起-承-转-转-合-升）"""
    base: StoryNode = field(default_factory=StoryNode)  # 【起】底色
    contradiction: StoryNode = field(default_factory=StoryNode)  # 【承】矛盾
    pattern: StoryNode = field(default_factory=StoryNode)  # 【转】模式
    defense: StoryNode = field(default_factory=StoryNode)  # 【转】防御
    block: StoryNode = field(default_factory=StoryNode)  # 【合】卡点
    light: StoryNode = field(default_factory=StoryNode)  # 【升】光


@dataclass
class ThemeInsights:
    """主题洞察（在特定主题中的表现）"""
    scene: str = ""  # 典型场景
    impact: str = ""  # 具体影响
    awareness: str = ""  # 觉察点

    def to_dict(self) -> Dict[str, str]:
        return {
            "scene": self.scene,
            "impact": self.impact,
            "awareness": self.awareness,
        }


@dataclass
class DailyAwareness:
    """日常小觉察（疗愈师口吻）"""
    day: int = 1  # 第几天
    title: str = ""  # 标题
    content: str = ""  # 内容

    def to_dict(self) -> Dict[str, Any]:
        return {
            "day": self.day,
            "title": self.title,
            "content": self.content,
        }


@dataclass
class SixInsights:
    """6个核心洞察（Lite版核心）- 保留用于兼容旧数据"""

    base: Dict[str, str] = field(default_factory=dict)  # 你的底色
    contradiction: Dict[str, str] = field(default_factory=dict)  # 你的矛盾
    pattern: Dict[str, str] = field(default_factory=dict)  # 你的模式
    defense: Dict[str, str] = field(default_factory=dict)  # 你的防御
    block: Dict[str, str] = field(default_factory=dict)  # 你的卡点
    light: Dict[str, str] = field(default_factory=dict)  # 你的光


@dataclass
class Layer1LiteDraft:
    """
    Layer 1: Lite版AI润色前的结构化输出

    这是从layer_0转换而来的结构化数据，还未经过AI润色
    """

    description: str = "Lite版结构化输出（未润色）"
    prompt_preview: str = ""

    # 画像标题（诗意，3-8字）
    title: str = ""

    # 整体印象（1-2句话直觉描述，包含情绪基调）
    overall_impression: str = ""

    # 画面元素分析（约100字，描述色彩/结构/能量密度）
    visual_elements: str = ""

    # 情绪画像（约200字，跨主题通用的情绪分析）
    emotion_portrait: str = ""

    # 6个核心洞察（旧结构，保留兼容）
    six_insights: SixInsights = field(default_factory=SixInsights)

    # v1.6 新增：心灵画像故事（起承转合结构）
    story: StoryStructure = field(default_factory=StoryStructure)

    # v1.6 新增：主题洞察（在特定主题中的表现）
    theme_insights: ThemeInsights = field(default_factory=ThemeInsights)

    # v1.6 新增：三个日常小觉察
    three_awareness: List[DailyAwareness] = field(default_factory=list)

    # v1.6 新增：Pro版引导文案
    pro_teaser: str = ""

    # 一个情绪调节小实验（旧结构，保留兼容）
    experiment: Dict[str, str] = field(default_factory=dict)

    # 生成时间戳
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "description": self.description,
            "prompt_preview": self.prompt_preview,
            "title": self.title,
            "overall_impression": self.overall_impression,
            "visual_elements": self.visual_elements,
            "emotion_portrait": self.emotion_portrait,
            "six_insights": {
                "base": self.six_insights.base,
                "contradiction": self.six_insights.contradiction,
                "pattern": self.six_insights.pattern,
                "defense": self.six_insights.defense,
                "block": self.six_insights.block,
                "light": self.six_insights.light,
            },
            "story": {
                "base": {"content": self.story.base.content, "connector": self.story.base.connector},
                "contradiction": {"content": self.story.contradiction.content, "connector": self.story.contradiction.connector},
                "pattern": {"content": self.story.pattern.content, "connector": self.story.pattern.connector},
                "defense": {"content": self.story.defense.content, "connector": self.story.defense.connector},
                "block": {"content": self.story.block.content, "connector": self.story.block.connector},
                "light": {"content": self.story.light.content, "connector": self.story.light.connector},
            },
            "theme_insights": {
                "scene": self.theme_insights.scene,
                "impact": self.theme_insights.impact,
                "awareness": self.theme_insights.awareness,
            },
            "three_awareness": [
                {"day": a.day, "title": a.title, "content": a.content} for a in self.three_awareness
            ],
            "pro_teaser": self.pro_teaser,
            "experiment": self.experiment,
            "created_at": self.created_at,
        }


@dataclass
class Layer2LiteFinal:
    """
    Layer 2: Lite版最终润色后的文本（用户看到的）

    这是经过AI润色后的最终Lite版报告内容（v1.6 结构化格式）
    """

    description: str = "Lite版最终报告"

    # 报告版本
    version: str = "1.6"

    # 画像标题
    title: str = ""

    # 整体印象（包含情绪基调）
    overall_impression: str = ""

    # 画面元素分析（润色后的文本）
    visual_elements_rendered: str = ""

    # 情绪画像（润色后的文本）
    emotion_portrait_rendered: str = ""

    # 心灵画像故事（起承转合结构）
    story: StoryStructure = field(default_factory=StoryStructure)

    # 主题洞察（典型场景、具体影响、觉察点）
    theme_insights: ThemeInsights = field(default_factory=ThemeInsights)

    # 三个日常小觉察
    three_awareness: List[DailyAwareness] = field(default_factory=list)

    # Pro版引导文案
    pro_teaser: str = ""

    # 6个核心洞察（渲染后的文本，兼容旧格式）
    six_insights_rendered: Dict[str, str] = field(default_factory=dict)

    # 情绪调节小实验（润色后的文本，与情绪画像呼应）
    experiment_rendered: str = ""

    # 完整报告Markdown
    full_report_markdown: str = ""

    # 生成时间戳
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "description": self.description,
            "version": self.version,
            "title": self.title,
            "overall_impression": self.overall_impression,
            "visual_elements_rendered": self.visual_elements_rendered,
            "emotion_portrait_rendered": self.emotion_portrait_rendered,
            "story": {
                "base": self.story.base.to_dict() if self.story.base else None,
                "contradiction": self.story.contradiction.to_dict() if self.story.contradiction else None,
                "pattern": self.story.pattern.to_dict() if self.story.pattern else None,
                "defense": self.story.defense.to_dict() if self.story.defense else None,
                "block": self.story.block.to_dict() if self.story.block else None,
                "light": self.story.light.to_dict() if self.story.light else None,
            },
            "theme_insights": self.theme_insights.to_dict() if self.theme_insights else None,
            "three_awareness": [a.to_dict() for a in self.three_awareness],
            "pro_teaser": self.pro_teaser,
            "six_insights_rendered": self.six_insights_rendered,
            "experiment_rendered": self.experiment_rendered,
            "full_report_markdown": self.full_report_markdown,
            "created_at": self.created_at,
        }


@dataclass
class Layer3ProDraft:
    """
    Layer 3: Pro版增量生成的内容（基于layer_0和layer_1）

    这是Pro版特有的增量内容，不包含Lite已有的部分
    """

    description: str = "Pro版增量内容（未润色）"
    prompt_preview: str = ""

    # 第一眼直觉（艺术疗愈师的专业直觉）
    first_impression: str = ""

    # 核心洞察表格（能量本质/失衡/卡点/方向/疗愈核心）
    core_insight_table: Dict[str, str] = field(default_factory=dict)

    # 三圈能量画像（详细版）
    three_circles_detailed: Dict[str, Dict[str, str]] = field(default_factory=dict)

    # 微观能量分析（详细版）
    micro_analysis_detailed: Dict[str, str] = field(default_factory=dict)

    # 失衡类型识别（10种标准类型诊断）
    imbalance_confirmed: Dict[str, Any] = field(default_factory=dict)

    # 根源分析
    root_cause: Dict[str, str] = field(default_factory=dict)

    # 针对性调节建议（21天简化版）
    healing_suggestions: List[Dict[str, str]] = field(default_factory=list)

    # 生成时间戳
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "description": self.description,
            "prompt_preview": self.prompt_preview,
            "first_impression": self.first_impression,
            "core_insight_table": self.core_insight_table,
            "three_circles_detailed": self.three_circles_detailed,
            "micro_analysis_detailed": self.micro_analysis_detailed,
            "imbalance_confirmed": self.imbalance_confirmed,
            "root_cause": self.root_cause,
            "healing_suggestions": self.healing_suggestions,
            "created_at": self.created_at,
        }


@dataclass
class Layer4ProFinal:
    """
    Layer 4: Pro版最终润色后的完整报告

    这是Pro版的最终完整报告，包含Lite全部内容+Pro增量内容
    """

    description: str = "Pro版完整报告"

    # 完整报告Markdown
    full_report_markdown: str = ""

    # 用于AI问答的上下文摘要
    ai_qa_context: str = ""

    # 生成时间戳
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "description": self.description,
            "full_report_markdown": self.full_report_markdown,
            "ai_qa_context": self.ai_qa_context,
            "created_at": self.created_at,
        }


@dataclass
class UpgradeHistory:
    """升级历史记录"""

    from_version: str
    to_version: str
    price_diff: float
    at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from": self.from_version,
            "to": self.to_version,
            "price_diff": self.price_diff,
            "at": self.at,
        }


@dataclass
class InterpretationRecord:
    """
    完整解读记录

    包含从layer_0到layer_4的所有数据，支持版本升级
    """

    interpretation_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    schema_version: str = "v2.1"
    user_id: str = ""
    image_hash: str = ""
    theme: str = "general"
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    # 用户输入（UI对应：绘画前意图 + 绘画时感受）
    painting_intention: Optional[str] = None  # 绘画前的意图/期待
    painting_feeling: Optional[str] = None  # 绘画时的身体感受/情绪

    # 图片 COS URL（持久化存储地址）
    image_url: Optional[str] = None
    image_storage_backend: Optional[str] = None
    image_storage_key: Optional[str] = None
    image_local_path: Optional[str] = None
    image_local_expires_at: Optional[str] = None

    # 三圈配置（用户设定的内圈、中圈半径百分比）
    three_circles: Optional[Dict] = None  # {"inner_radius": 35, "middle_radius": 65}

    # 三圈自动检测记录
    three_circles_auto_detect: Optional[Dict] = (
        None  # {"inner_radius": 33, "middle_radius": 66, "confidence": 0.85, "method": "hybrid"}
    )

    # 用户是否调节了三圈位置
    three_circles_user_adjusted: bool = False

    # 三圈调节历史（记录每次调整）
    three_circles_adjust_history: List[Dict] = field(default_factory=list)
    # 结构: [{"timestamp": "...", "from": {"inner": 33, "middle": 66}, "to": {"inner": 35, "middle": 65}, "source": "auto|manual"}]

    # 五层数据
    layer_0_raw: Optional[Layer0Raw] = None
    layer_1_lite_draft: Optional[Layer1LiteDraft] = None
    layer_2_lite_final: Optional[Layer2LiteFinal] = None
    layer_3_pro_draft: Optional[Layer3ProDraft] = None
    layer_4_pro_final: Optional[Layer4ProFinal] = None

    # 疗愈师版数据 (ToB)
    therapist_report: Optional[Dict] = None  # {"clinical_notes": ..., "full_report": ..., "follow_up_plan": ...}

    # 版本购买状态
    version_purchased: List[str] = field(default_factory=list)

    # 升级历史
    upgrade_history: List[UpgradeHistory] = field(default_factory=list)

    # 状态
    status: str = field(default=GenerationStatus.PENDING)

    # 生成进度（用于前端真实进度显示）
    generation_progress: int = 0  # 0-100
    generation_stage: str = "pending"  # pending/detecting/analyzing/generating/finalizing/completed
    stage_started_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "interpretation_id": self.interpretation_id,
            "schema_version": self.schema_version,
            "user_id": self.user_id,
            "image_hash": self.image_hash,
            "theme": self.theme,
            "created_at": self.created_at,
            "image_url": self.image_url,
            "image_storage_backend": self.image_storage_backend,
            "image_storage_key": self.image_storage_key,
            "image_local_path": self.image_local_path,
            "image_local_expires_at": self.image_local_expires_at,
            "painting_intention": self.painting_intention,
            "painting_feeling": self.painting_feeling,
            "three_circles": self.three_circles,
            "three_circles_auto_detect": self.three_circles_auto_detect,
            "three_circles_user_adjusted": self.three_circles_user_adjusted,
            "three_circles_adjust_history": self.three_circles_adjust_history,
            "layer_0_raw": self.layer_0_raw.to_dict() if self.layer_0_raw else None,
            "layer_1_lite_draft": (
                self.layer_1_lite_draft.to_dict() if self.layer_1_lite_draft else None
            ),
            "layer_2_lite_final": (
                self.layer_2_lite_final.to_dict() if self.layer_2_lite_final else None
            ),
            "layer_3_pro_draft": (
                self.layer_3_pro_draft.to_dict() if self.layer_3_pro_draft else None
            ),
            "layer_4_pro_final": (
                self.layer_4_pro_final.to_dict() if self.layer_4_pro_final else None
            ),
            "therapist_report": self.therapist_report,
            "version_purchased": self.version_purchased,
            "upgrade_history": [h.to_dict() for h in self.upgrade_history],
            "status": self.status,
            "generation_progress": self.generation_progress,
            "generation_stage": self.generation_stage,
            "stage_started_at": self.stage_started_at,
        }

    def update_progress(self, stage: str, percent: int) -> None:
        """更新生成进度"""
        self.generation_stage = stage
        self.generation_progress = percent
        self.stage_started_at = datetime.now().isoformat()

    def can_upgrade_to_pro(self) -> bool:
        """检查是否可以升级到Pro"""
        return (
            "lite" in self.version_purchased
            and "pro" not in self.version_purchased
            and self.layer_0_raw is not None
            and self.layer_1_lite_draft is not None
        )

    def get_lite_report(self) -> Optional[str]:
        """获取Lite版报告"""
        if self.layer_2_lite_final:
            return self.layer_2_lite_final.full_report_markdown
        return None

    def get_pro_report(self) -> Optional[str]:
        """获取Pro版完整报告"""
        if self.layer_4_pro_final:
            return self.layer_4_pro_final.full_report_markdown
        return None

    def get_ai_qa_context(self) -> Optional[str]:
        """获取AI问答上下文"""
        if self.layer_4_pro_final:
            return self.layer_4_pro_final.ai_qa_context
        return None

    def get_therapist_report(self) -> Optional[Dict]:
        """获取疗愈师版报告"""
        return self.therapist_report

    def get_therapist_clinical_notes(self) -> Optional[str]:
        """获取疗愈师临床笔记"""
        if self.therapist_report:
            return self.therapist_report.get("clinical_notes")
        return None
