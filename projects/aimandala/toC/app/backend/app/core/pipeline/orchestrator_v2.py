"""Minimal V2 orchestrator skeleton for the AI-Mandala To C migration."""

from dataclasses import dataclass
from enum import Enum
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Optional

from app.core.analysis.circle_detector import CircleDetectionResult, CircleDetector

from .data_models import GenerationStatus, InterpretationRecord, Layer2LiteFinal
from .store import InterpretationStore


class GenerationStage(str, Enum):
    """Execution stages for the migrated V2 interpretation pipeline."""

    PENDING = "pending"
    DETECTING = "detecting"
    ANALYZING = "analyzing"
    GENERATING = "generating"
    FINALIZING = "finalizing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass(frozen=True)
class PricingSnapshot:
    """Current public pricing for the To C V2 baseline."""

    lite: float
    pro: float
    upgrade_diff: float

    def to_dict(self) -> Dict[str, float]:
        return {
            "lite": self.lite,
            "pro": self.pro,
            "upgrade_diff": self.upgrade_diff,
        }


class LayeredOrchestrator:
    """Thin migration-safe shell of the legacy V2 layered orchestrator.

    This class intentionally keeps only stable, dependency-light behavior first:
    pricing baseline, stage vocabulary, and store wiring. Heavy AI, prompt,
    analysis, and safety dependencies will be reintroduced incrementally.
    """

    PRICING = PricingSnapshot(
        lite=9.9,
        pro=49.0,
        # Kept only for legacy V2 response compatibility. Product semantics remain
        # "independent purchase" unless a later decision explicitly changes them.
        upgrade_diff=39.1,
    )

    def __init__(
        self,
        knowledge_engine: Optional[Any] = None,
        store: Optional[InterpretationStore] = None,
        circle_detector: Optional[CircleDetector] = None,
        enable_vision: bool = True,
    ) -> None:
        self.knowledge_engine = knowledge_engine
        self.store = store or InterpretationStore()
        self.circle_detector = circle_detector or CircleDetector()
        self.enable_vision = enable_vision

    @classmethod
    def get_pricing(cls) -> PricingSnapshot:
        """Return the fixed V2 pricing baseline used by the current To C MVP."""

        return cls.PRICING

    @classmethod
    def get_upgrade_diff(cls) -> float:
        """Expose the legacy compatibility field for existing V2 clients."""

        return cls.PRICING.upgrade_diff

    @classmethod
    def get_supported_versions(cls) -> tuple[str, str]:
        """Return the two report versions currently exposed by the To C MVP."""

        return ("lite", "pro")

    async def detect_three_circles(
        self,
        image_path: str,
        confidence_threshold: float = 0.3,
    ) -> CircleDetectionResult:
        """Run the migrated circle detector for the current To C V2 flow."""

        return await self.circle_detector.detect_circles(
            image_path=image_path,
            use_ai=self.enable_vision,
            use_opencv=True,
            confidence_threshold=confidence_threshold,
        )

    async def prepare_lite_record(
        self,
        *,
        image_path: str,
        user_id: str,
        theme: str = "general",
        painting_intention: Optional[str] = None,
        painting_feeling: Optional[str] = None,
        three_circles: Optional[Dict[str, int]] = None,
    ) -> InterpretationRecord:
        """Create a minimal Lite record and persist normalized circle settings."""

        image_hash = self._hash_image(image_path)
        record = self.store.create_record(
            user_id=user_id,
            image_hash=image_hash,
            theme=theme,
        )
        record.painting_intention = painting_intention
        record.painting_feeling = painting_feeling
        record.status = GenerationStatus.PROCESSING

        if three_circles:
            normalized = self._normalize_circle_payload(three_circles)
            record.three_circles = normalized
            record.three_circles_user_adjusted = True
            record.three_circles_adjust_history.append(
                {
                    "from": {"inner": 33, "middle": 66},
                    "to": normalized.copy(),
                    "source": "manual",
                }
            )
        else:
            detection = await self.detect_three_circles(image_path=image_path)
            normalized = self._normalize_circle_payload(
                {
                    "inner_radius": int(round(detection.inner_radius * 100)),
                    "middle_radius": int(round(detection.middle_radius * 100)),
                }
            )
            record.three_circles = normalized
            record.three_circles_auto_detect = {
                "inner_radius": detection.inner_radius,
                "middle_radius": detection.middle_radius,
                "confidence": detection.confidence,
                "method": detection.method,
            }
            record.three_circles_adjust_history.append(
                {
                    "from": {"inner": 33, "middle": 66},
                    "to": normalized.copy(),
                    "source": "auto",
                }
            )

        record.update_progress(GenerationStage.DETECTING.value, 10)
        self.store.save(record)
        return record

    async def generate_lite_placeholder(
        self,
        *,
        image_path: str,
        user_id: str,
        theme: str = "general",
        painting_intention: Optional[str] = None,
        painting_feeling: Optional[str] = None,
        three_circles: Optional[Dict[str, int]] = None,
        check_existing: bool = True,
    ) -> InterpretationRecord:
        """Create a migrated Lite record with a placeholder report."""

        image_hash = self._hash_image(image_path)
        if check_existing:
            existing = self.store.find_existing_record(
                image_hash=image_hash,
                user_id=user_id,
                theme=theme,
            )
            if existing is not None:
                return existing

        record = await self.prepare_lite_record(
            image_path=image_path,
            user_id=user_id,
            theme=theme,
            painting_intention=painting_intention,
            painting_feeling=painting_feeling,
            three_circles=three_circles,
        )

        record.update_progress(GenerationStage.GENERATING.value, 70)
        record.layer_2_lite_final = self._build_lite_placeholder_report(record)

        if "lite" not in record.version_purchased:
            record.version_purchased.append("lite")

        record.status = GenerationStatus.COMPLETED
        record.update_progress(GenerationStage.COMPLETED.value, 100)
        self.store.save(record)
        return record

    def _hash_image(self, image_path: str) -> str:
        path = Path(image_path)
        if not path.exists():
            return f"missing:{path.name}"
        return sha256(path.read_bytes()).hexdigest()[:16]

    def _normalize_circle_payload(self, circle_payload: Dict[str, int]) -> Dict[str, int]:
        inner = int(circle_payload.get("inner_radius", 33))
        middle = int(circle_payload.get("middle_radius", 66))
        inner = max(10, min(inner, 90))
        middle = max(inner + 5, min(middle, 90))
        return {
            "inner_radius": inner,
            "middle_radius": middle,
        }

    def get_report(
        self,
        interpretation_id: str,
        version: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Return the currently available report view for a migrated record."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        requested_version = version or self._resolve_best_available_version(record)

        if requested_version == "pro":
            report = record.get_pro_report()
            if report:
                return {
                    "version": "pro",
                    "report": report,
                    "ai_qa_context": record.get_ai_qa_context(),
                    "can_upgrade": False,
                    "upgrade_price": None,
                }
            return {
                "version": "pro",
                "error": "pro report not generated yet",
                "can_upgrade": False,
                "upgrade_price": None,
            }

        if requested_version == "lite":
            report = record.get_lite_report()
            if report:
                return {
                    "version": "lite",
                    "report": report,
                    "can_upgrade": record.can_upgrade_to_pro(),
                    "upgrade_price": (
                        self.get_upgrade_diff() if record.can_upgrade_to_pro() else None
                    ),
                }
            return {
                "version": "lite",
                "error": "lite report not generated yet",
                "can_upgrade": False,
                "upgrade_price": None,
            }

        return {
            "version": requested_version,
            "error": f"unsupported version: {requested_version}",
            "can_upgrade": False,
            "upgrade_price": None,
        }

    def _resolve_best_available_version(self, record: InterpretationRecord) -> str:
        if record.get_pro_report():
            return "pro"
        return "lite"

    def _build_lite_placeholder_report(self, record: InterpretationRecord) -> Layer2LiteFinal:
        theme = record.theme or "general"
        circle_info = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        title = "一镜 Lite 版占位报告"
        overall_impression = (
            "当前记录已经完成迁移期的最小 Lite 闭环，用于打通 To C 主路径与后续真实生成能力。"
        )
        visual_elements = (
            f"当前主题为 `{theme}`，三圈参数为内圈 {circle_info['inner_radius']}%，"
            f"中圈 {circle_info['middle_radius']}%。"
        )
        emotion_portrait = (
            "这里暂时不是正式解读内容，而是迁移占位文本。后续接入真实分析、提示词和润色链路后，"
            "这份占位报告会被正式 Lite 报告替换。"
        )
        full_report_markdown = "\n".join(
            [
                f"# {title}",
                "",
                "## 当前状态",
                overall_impression,
                "",
                "## 已记录信息",
                visual_elements,
                "",
                "## 说明",
                emotion_portrait,
            ]
        )

        return Layer2LiteFinal(
            title=title,
            overall_impression=overall_impression,
            visual_elements_rendered=visual_elements,
            emotion_portrait_rendered=emotion_portrait,
            pro_teaser="后续将接入正式的一梳 Pro 版生成链路。",
            full_report_markdown=full_report_markdown,
        )
