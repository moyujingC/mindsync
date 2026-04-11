"""Minimal V2 orchestrator skeleton for the AI-Mandala To C migration."""

import json
from dataclasses import dataclass
from enum import Enum
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Optional

from app.core.analysis.circle_detector import CircleDetectionResult, CircleDetector
try:
    from app.core.analysis.three_circle_colors import extract_colors_by_circles
except Exception:  # pragma: no cover - migration-time fallback
    extract_colors_by_circles = None

try:
    from app.core.knowledge import (
        KnowledgeQueryEngine,
        get_theme_summary,
        get_insight_templates,
        get_pro_upgrade_teaser,
        get_theme_config,
    )
    from app.core.knowledge_runtime.runtime import get_knowledge_runtime
    from app.core.knowledge.three_circles import analyze_energy_flow
except Exception:  # pragma: no cover - migration-time fallback
    KnowledgeQueryEngine = None
    get_knowledge_runtime = None

    def get_insight_templates(theme: str) -> Dict[str, Any]:
        return {}

    def get_pro_upgrade_teaser(theme: str) -> str:
        return ""

    def get_theme_config(theme: str) -> Dict[str, Any]:
        return {}

    def get_theme_summary(theme: str) -> Dict[str, Any]:
        return {}

    def analyze_energy_flow(inner_elements: list, middle_elements: list, outer_elements: list) -> Dict[str, Any]:
        return {}

from app.core.prompt.builder_v2 import PromptBuilder
from app.core.safety.protocol import SafetyProtocol, quick_safety_check

from .data_models import (
    DailyAwareness,
    GenerationStatus,
    InterpretationRecord,
    Layer0Raw,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
    Layer4ProFinal,
)
from .generation_runtime import (
    DeterministicReportGenerationRuntime,
    PromptBackedReportGenerationRuntime,
    ReportGenerationRuntime,
)
from .prompt_runtime import PromptRuntime
from .report_blueprints import (
    DEFAULT_PRO_TEASER,
    LITE_REPORT_BLUEPRINT,
    PRO_REPORT_BLUEPRINT,
    PRO_REPORT_INTRO,
    PRO_REPORT_TITLE,
    build_lite_experiment_content,
    render_lite_template_text,
    render_template_text,
)
from .report_contracts import ReportContractAssembler
from .store import InterpretationStore, UnsupportedInterpretationSchemaError

ELEMENT_KEY_TO_CN = {
    "wood": "木",
    "fire": "火",
    "earth": "土",
    "metal": "金",
    "water": "水",
}

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
        generation_runtime: Optional[ReportGenerationRuntime] = None,
        prompt_runtime: Optional[PromptRuntime] = None,
        report_chat_runtime: Optional[Any] = None,
        enable_vision: bool = True,
    ) -> None:
        if knowledge_engine is not None:
            self.knowledge_engine = knowledge_engine
        elif KnowledgeQueryEngine is not None:
            self.knowledge_engine = KnowledgeQueryEngine(version="toc")
        else:
            self.knowledge_engine = None
        self.store = store or InterpretationStore()
        self.circle_detector = circle_detector or CircleDetector()
        self.knowledge_runtime = (
            get_knowledge_runtime() if get_knowledge_runtime is not None else None
        )
        self.layer0_assembler = (
            self.knowledge_runtime.layer0_assembler if self.knowledge_runtime else None
        )
        self.narrative_service = (
            self.knowledge_runtime.narrative_service if self.knowledge_runtime else None
        )
        if generation_runtime is not None:
            self.generation_runtime = generation_runtime
        elif prompt_runtime is not None:
            self.generation_runtime = PromptBackedReportGenerationRuntime(
                prompt_runtime=prompt_runtime,
            )
        else:
            self.generation_runtime = DeterministicReportGenerationRuntime()
        self.report_chat_runtime = report_chat_runtime
        self.enable_vision = enable_vision
        self.prompt_builder = PromptBuilder()
        self.report_contracts = ReportContractAssembler(self.prompt_builder)

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
        image_url: Optional[str] = None,
        image_storage_backend: Optional[str] = None,
        image_storage_key: Optional[str] = None,
        image_local_expires_at: Optional[str] = None,
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
        record.image_url = image_url
        record.image_storage_backend = image_storage_backend
        record.image_storage_key = image_storage_key
        record.image_local_path = image_path
        record.image_local_expires_at = image_local_expires_at
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
        image_url: Optional[str] = None,
        image_storage_backend: Optional[str] = None,
        image_storage_key: Optional[str] = None,
        image_local_expires_at: Optional[str] = None,
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
            image_url=image_url,
            image_storage_backend=image_storage_backend,
            image_storage_key=image_storage_key,
            image_local_expires_at=image_local_expires_at,
            painting_intention=painting_intention,
            painting_feeling=painting_feeling,
            three_circles=three_circles,
        )

        record.update_progress(GenerationStage.GENERATING.value, 70)
        lite_bundle = self.generation_runtime.generate_lite(self, record)
        record.layer_0_raw = lite_bundle.layer_0_raw
        record.layer_1_lite_draft = lite_bundle.layer_1_lite_draft
        record.layer_2_lite_final = lite_bundle.layer_2_lite_final

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
        return self.report_contracts.build_report_payload(
            record=record,
            requested_version=requested_version,
            upgrade_diff=self.get_upgrade_diff(),
        )

    def answer_report_chat(
        self,
        interpretation_id: str,
        *,
        message: str,
        history: Optional[list[Dict[str, str]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Generate a follow-up reply grounded in the existing report."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None
        if self.report_chat_runtime is None:
            raise ValueError("report chat runtime is not configured")

        report_markdown = record.get_pro_report() or record.get_lite_report()
        if not report_markdown:
            raise ValueError("report is not ready")

        reply = self.report_chat_runtime.reply(
            report_markdown=report_markdown,
            ai_qa_context=record.get_ai_qa_context(),
            theme=record.theme,
            painting_intention=record.painting_intention,
            painting_feeling=record.painting_feeling,
            message=message,
            history=history,
        )
        if not isinstance(reply, str) or not reply.strip():
            raise ValueError("report chat runtime returned empty reply")

        return {
            "interpretation_id": interpretation_id,
            "reply": reply.strip(),
        }

    def _resolve_best_available_version(self, record: InterpretationRecord) -> str:
        if record.get_pro_report():
            return "pro"
        return "lite"

    def get_status(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Return a compact status snapshot for polling clients."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        return {
            "interpretation_id": record.interpretation_id,
            "status": record.status,
            "generation_stage": record.generation_stage,
            "generation_progress": record.generation_progress,
            "report_ready": record.layer_2_lite_final is not None,
            "version_purchased": record.version_purchased,
            "three_circles": record.three_circles or {},
            "auto_detected": record.three_circles_auto_detect is not None,
            "can_upgrade": record.can_upgrade_to_pro(),
        }

    def get_report_debug_profile(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Return a development-only profile of how the current report was produced."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        def excerpt(value: Optional[str], limit: int = 220) -> Optional[str]:
            if not isinstance(value, str):
                return value
            compact = value.strip()
            if not compact:
                return ""
            if len(compact) <= limit:
                return compact
            return f"{compact[:limit]}..."

        layer0 = record.layer_0_raw.to_dict() if record.layer_0_raw else None
        layer1 = record.layer_1_lite_draft.to_dict() if record.layer_1_lite_draft else None
        layer2 = record.layer_2_lite_final.to_dict() if record.layer_2_lite_final else None
        layer3 = record.layer_3_pro_draft.to_dict() if record.layer_3_pro_draft else None
        layer4 = record.layer_4_pro_final.to_dict() if record.layer_4_pro_final else None
        layer0_view = self._get_layer0_view(record) if record.layer_0_raw else None
        knowledge_signal = self._get_primary_knowledge_signal(record)
        theme_summary = self.get_knowledge_theme_summary(record.theme)

        def non_empty_text(value: Optional[str]) -> str:
            if not isinstance(value, str):
                return ""
            return value.strip()

        lite_field_provenance = [
            {
                "field": "title",
                "final_value": layer2.get("title") if layer2 else None,
                "main_source": "layer_1_lite_draft.title" if non_empty_text(layer1.get("title") if layer1 else None) else "template_fallback",
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.title", "value": layer1.get("title") if layer1 else None},
                    {"source": "theme_label", "value": self._get_theme_label(record.theme)},
                    {"source": "user.theme", "value": record.theme},
                ],
            },
            {
                "field": "overall_impression",
                "final_value": layer2.get("overall_impression") if layer2 else None,
                "main_source": (
                    "layer_1_lite_draft.overall_impression"
                    if non_empty_text(layer1.get("overall_impression") if layer1 else None)
                    else "template_fallback"
                ),
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.overall_impression", "value": layer1.get("overall_impression") if layer1 else None},
                    {"source": "user.painting_intention", "value": record.painting_intention},
                    {"source": "user.painting_feeling", "value": record.painting_feeling},
                    {"source": "layer_0_raw.imbalance_candidates", "value": layer0.get("imbalance_candidates") if layer0 else None},
                ],
            },
            {
                "field": "visual_elements_rendered",
                "final_value": layer2.get("visual_elements_rendered") if layer2 else None,
                "main_source": (
                    "layer_1_lite_draft.visual_elements"
                    if non_empty_text(layer1.get("visual_elements") if layer1 else None)
                    else "layer_0_raw.color_analysis"
                ),
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.visual_elements", "value": layer1.get("visual_elements") if layer1 else None},
                    {"source": "layer_0_raw.color_analysis", "value": layer0.get("color_analysis") if layer0 else None},
                    {"source": "layer_0_raw.circle_colors", "value": layer0.get("circle_colors") if layer0 else None},
                    {"source": "user.three_circles", "value": record.three_circles},
                ],
            },
            {
                "field": "emotion_portrait_rendered",
                "final_value": layer2.get("emotion_portrait_rendered") if layer2 else None,
                "main_source": (
                    "layer_1_lite_draft.emotion_portrait"
                    if non_empty_text(layer1.get("emotion_portrait") if layer1 else None)
                    else "template_fallback"
                ),
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.emotion_portrait", "value": layer1.get("emotion_portrait") if layer1 else None},
                    {"source": "user.painting_feeling", "value": record.painting_feeling},
                    {"source": "knowledge_signal", "value": self._get_signal_label(knowledge_signal) if knowledge_signal else None},
                    {"source": "theme_summary", "value": theme_summary},
                ],
            },
            {
                "field": "pro_teaser",
                "final_value": layer2.get("pro_teaser") if layer2 else None,
                "main_source": "layer_1_lite_draft.pro_teaser" if non_empty_text(layer1.get("pro_teaser") if layer1 else None) else "default_pro_teaser",
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.pro_teaser", "value": layer1.get("pro_teaser") if layer1 else None},
                    {"source": "user.theme", "value": record.theme},
                ],
            },
        ]

        pro_field_provenance = [
            {
                "field": "first_impression",
                "final_value": layer3.get("first_impression") if layer3 else None,
                "main_source": "layer_3_pro_draft.first_impression" if non_empty_text(layer3.get("first_impression") if layer3 else None) else "template_fallback",
                "upstream_inputs": [
                    {"source": "layer_3_pro_draft.first_impression", "value": layer3.get("first_impression") if layer3 else None},
                    {"source": "layer_1_lite_draft.story", "value": layer1.get("story") if layer1 else None},
                    {"source": "layer_0_raw.imbalance_candidates", "value": layer0.get("imbalance_candidates") if layer0 else None},
                ],
            },
            {
                "field": "core_insight_table",
                "final_value": layer3.get("core_insight_table") if layer3 else None,
                "main_source": "layer_3_pro_draft.core_insight_table",
                "upstream_inputs": [
                    {"source": "layer_3_pro_draft.core_insight_table", "value": layer3.get("core_insight_table") if layer3 else None},
                    {"source": "layer_0_raw.five_elements", "value": layer0.get("five_elements") if layer0 else None},
                    {"source": "layer_0_raw.three_circles", "value": layer0.get("three_circles") if layer0 else None},
                ],
            },
            {
                "field": "root_cause",
                "final_value": layer3.get("root_cause") if layer3 else None,
                "main_source": "layer_3_pro_draft.root_cause",
                "upstream_inputs": [
                    {"source": "layer_3_pro_draft.root_cause", "value": layer3.get("root_cause") if layer3 else None},
                    {"source": "user.painting_intention", "value": record.painting_intention},
                    {"source": "layer_1_lite_draft.story.contradiction", "value": layer1.get("story", {}).get("contradiction") if isinstance(layer1.get("story") if layer1 else None, dict) else None},
                    {"source": "knowledge_signal", "value": self._get_signal_label(knowledge_signal) if knowledge_signal else None},
                ],
            },
            {
                "field": "healing_suggestions",
                "final_value": layer3.get("healing_suggestions") if layer3 else None,
                "main_source": "layer_3_pro_draft.healing_suggestions",
                "upstream_inputs": [
                    {"source": "layer_3_pro_draft.healing_suggestions", "value": layer3.get("healing_suggestions") if layer3 else None},
                    {"source": "layer_0_raw.imbalance_candidates", "value": layer0.get("imbalance_candidates") if layer0 else None},
                    {"source": "theme_summary.core_issues", "value": theme_summary.get("core_issues") if isinstance(theme_summary, dict) else None},
                    {"source": "layer_1_lite_draft.theme_insights", "value": layer1.get("theme_insights") if layer1 else None},
                ],
            },
            {
                "field": "full_report_markdown",
                "final_value": layer4.get("full_report_markdown") if layer4 else None,
                "main_source": "template_merge_layer2_plus_layer3" if layer4 else "missing_layer_4_pro_final",
                "upstream_inputs": [
                    {"source": "layer_2_lite_final.full_report_markdown", "value": layer2.get("full_report_markdown") if layer2 else None},
                    {"source": "layer_3_pro_draft", "value": layer3},
                    {"source": "layer_4_pro_final.ai_qa_context", "value": layer4.get("ai_qa_context") if layer4 else None},
                ],
            },
        ]

        lite_schema = self.prompt_builder.get_template("1.6", "lite").load_schema()
        pro_schema = self.prompt_builder.get_template("1.6", "pro").load_schema()
        lite_validation_issues = (
            self.report_contracts.validator.validate_lite(record.layer_1_lite_draft)
            if record.layer_1_lite_draft
            else ["missing_layer_1_lite_draft"]
        )
        pro_validation_issues = (
            self.report_contracts.validator.validate_pro(record.layer_3_pro_draft)
            if record.layer_3_pro_draft
            else ["missing_layer_3_pro_draft"]
        )

        def build_schema_field_debug(
            schema: Dict[str, Any],
            issues: list[str],
            mapped_fields: Dict[str, str],
        ) -> list[Dict[str, Any]]:
            result: list[Dict[str, Any]] = []
            for field in schema.get("fields", []) if isinstance(schema, dict) else []:
                if not isinstance(field, dict):
                    continue
                name = field.get("name")
                if not isinstance(name, str) or not name:
                    continue
                result.append(
                    {
                        "name": name,
                        "required": bool(field.get("required")),
                        "type": field.get("type"),
                        "semantic_role": field.get("semantic_role"),
                        "status": "missing" if name in issues else "hit",
                        "mapped_final_field": mapped_fields.get(name),
                    }
                )
            return result

        def classify_source_category(source_name: Optional[str]) -> str:
            source_text = (source_name or "").strip()
            if not source_text:
                return "unknown"
            if "template_fallback" in source_text or "default_" in source_text:
                return "fallback"
            if "template_merge" in source_text:
                return "template_merge"
            if "user." in source_text:
                return "user_input"
            if "layer_0_raw" in source_text or "knowledge_signal" in source_text or "theme_summary" in source_text:
                return "layer0_or_knowledge"
            if "layer_1_lite_draft" in source_text or "layer_3_pro_draft" in source_text:
                return "prompt_draft"
            if "layer_2_lite_final" in source_text or "layer_4_pro_final" in source_text:
                return "final_render"
            return "unknown"

        def build_field_diagnostics(
            items: list[Dict[str, Any]],
            schema_fields: list[Dict[str, Any]],
        ) -> list[Dict[str, Any]]:
            schema_status_map = {
                str(field.get("name")): str(field.get("status"))
                for field in schema_fields
                if isinstance(field, dict) and field.get("name")
            }
            diagnostics: list[Dict[str, Any]] = []
            for item in items:
                field_name = str(item.get("field"))
                main_source = item.get("main_source")
                upstream_inputs = item.get("upstream_inputs") if isinstance(item.get("upstream_inputs"), list) else []
                dependency_categories = sorted(
                    {
                        classify_source_category(
                            upstream.get("source") if isinstance(upstream, dict) else None,
                        )
                        for upstream in upstream_inputs
                    }
                    - {"unknown"}
                )
                source_category = classify_source_category(
                    main_source if isinstance(main_source, str) else None,
                )
                final_value = item.get("final_value")
                final_missing = final_value in (None, "", [], {})
                schema_status = schema_status_map.get(field_name, "unknown")
                issue_tags: list[str] = []
                if source_category == "fallback":
                    issue_tags.append("fallback")
                if schema_status == "missing":
                    issue_tags.append("schema_missing")
                if final_missing:
                    issue_tags.append("final_missing")
                if "user_input" in dependency_categories:
                    issue_tags.append("depends_on_user_input")
                if "layer0_or_knowledge" in dependency_categories:
                    issue_tags.append("depends_on_layer0")
                if "prompt_draft" in dependency_categories or source_category == "prompt_draft":
                    issue_tags.append("depends_on_prompt_draft")
                risk_score = 0
                if "fallback" in issue_tags:
                    risk_score += 40
                if "schema_missing" in issue_tags:
                    risk_score += 35
                if "final_missing" in issue_tags:
                    risk_score += 30
                if source_category == "template_merge":
                    risk_score += 10
                if "depends_on_layer0" in issue_tags:
                    risk_score += 8
                if "depends_on_user_input" in issue_tags:
                    risk_score += 6
                if "depends_on_prompt_draft" in issue_tags:
                    risk_score += 5
                if risk_score >= 65:
                    risk_level = "high"
                elif risk_score >= 30:
                    risk_level = "medium"
                else:
                    risk_level = "low"
                suggested_action = self._build_field_suggested_action(
                    field=field_name,
                    source_category=source_category,
                    schema_status=schema_status,
                    final_missing=final_missing,
                    dependency_categories=dependency_categories,
                    issue_tags=issue_tags,
                )
                diagnostics.append(
                    {
                        "field": field_name,
                        "main_source": main_source,
                        "main_source_category": source_category,
                        "dependency_categories": dependency_categories,
                        "schema_status": schema_status,
                        "final_missing": final_missing,
                        "issue_tags": issue_tags,
                        "risk_score": risk_score,
                        "risk_level": risk_level,
                        "suggested_action": suggested_action,
                        "diagnosis": self._build_field_diagnosis_text(
                            field=field_name,
                            source_category=source_category,
                            schema_status=schema_status,
                            final_missing=final_missing,
                            dependency_categories=dependency_categories,
                        ),
                    }
                )
            return sorted(
                diagnostics,
                key=lambda item: (
                    -int(item.get("risk_score", 0)),
                    str(item.get("field", "")),
                ),
            )

        lite_mapped_fields = {
            "title": "layer_2_lite_final.title",
            "overall_impression": "layer_2_lite_final.overall_impression",
            "visual_elements": "layer_2_lite_final.visual_elements_rendered",
            "emotion_portrait": "layer_2_lite_final.emotion_portrait_rendered",
            "story": "layer_2_lite_final.story",
            "theme_scene": "layer_2_lite_final.theme_insights.scene",
            "theme_impact": "layer_2_lite_final.theme_insights.impact",
            "theme_awareness": "layer_2_lite_final.theme_insights.awareness",
            "three_awareness": "layer_2_lite_final.three_awareness",
            "pro_teaser": "layer_2_lite_final.pro_teaser",
        }
        pro_mapped_fields = {
            "first_impression": "layer_3_pro_draft.first_impression / report.summary",
            "core_insight_table": "layer_3_pro_draft.core_insight_table",
            "three_circles_detailed": "layer_3_pro_draft.three_circles_detailed",
            "micro_analysis_detailed": "layer_3_pro_draft.micro_analysis_detailed",
            "imbalance_confirmed": "layer_3_pro_draft.imbalance_confirmed",
            "root_cause": "layer_3_pro_draft.root_cause",
            "healing_suggestions": "layer_3_pro_draft.healing_suggestions",
        }
        lite_schema_fields = build_schema_field_debug(
            lite_schema,
            lite_validation_issues,
            lite_mapped_fields,
        )
        pro_schema_fields = build_schema_field_debug(
            pro_schema,
            pro_validation_issues,
            pro_mapped_fields,
        )
        lite_field_diagnostics = build_field_diagnostics(
            lite_field_provenance,
            lite_schema_fields,
        )
        pro_field_diagnostics = build_field_diagnostics(
            pro_field_provenance,
            pro_schema_fields,
        )

        def build_diagnostic_summary(
            lite_items: list[Dict[str, Any]],
            pro_items: list[Dict[str, Any]],
        ) -> Dict[str, Any]:
            combined = lite_items + pro_items
            fallback_fields = [item["field"] for item in combined if "fallback" in item.get("issue_tags", [])]
            schema_missing_fields = [item["field"] for item in combined if "schema_missing" in item.get("issue_tags", [])]
            user_input_driven = [item["field"] for item in combined if "depends_on_user_input" in item.get("issue_tags", [])]
            layer0_driven = [item["field"] for item in combined if "depends_on_layer0" in item.get("issue_tags", [])]
            prompt_draft_driven = [item["field"] for item in combined if "depends_on_prompt_draft" in item.get("issue_tags", [])]
            high_risk_fields = [item["field"] for item in combined if item.get("risk_level") == "high"]
            medium_risk_fields = [item["field"] for item in combined if item.get("risk_level") == "medium"]
            low_risk_fields = [item["field"] for item in combined if item.get("risk_level") == "low"]
            recommended_first_actions = [
                {
                    "field": item["field"],
                    "risk_level": item["risk_level"],
                    "suggested_action": item.get("suggested_action"),
                }
                for item in combined[:5]
            ]
            return {
                "fallback_count": len(fallback_fields),
                "schema_missing_count": len(schema_missing_fields),
                "user_input_driven_count": len(user_input_driven),
                "layer0_driven_count": len(layer0_driven),
                "prompt_draft_driven_count": len(prompt_draft_driven),
                "high_risk_count": len(high_risk_fields),
                "medium_risk_count": len(medium_risk_fields),
                "low_risk_count": len(low_risk_fields),
                "fallback_fields": fallback_fields,
                "schema_missing_fields": schema_missing_fields,
                "user_input_driven_fields": user_input_driven,
                "layer0_driven_fields": layer0_driven,
                "prompt_draft_driven_fields": prompt_draft_driven,
                "high_risk_fields": high_risk_fields,
                "medium_risk_fields": medium_risk_fields,
                "low_risk_fields": low_risk_fields,
                "recommended_first_actions": recommended_first_actions,
            }

        diagnostic_summary = build_diagnostic_summary(
            lite_field_diagnostics,
            pro_field_diagnostics,
        )

        steps = [
            {
                "key": "input",
                "label": "用户输入与三圈参数",
                "status": "done",
                "created_at": record.created_at,
                "summary": {
                    "theme": record.theme,
                    "painting_intention": record.painting_intention,
                    "painting_feeling": record.painting_feeling,
                    "three_circles": record.three_circles,
                    "auto_detect": record.three_circles_auto_detect,
                },
            },
            {
                "key": "layer0",
                "label": "Layer0 原始知识层",
                "status": "done" if layer0 else "missing",
                "created_at": layer0.get("created_at") if layer0 else None,
                "summary": {
                    "imbalance_candidates": layer0.get("imbalance_candidates") if layer0 else [],
                    "color_analysis": layer0.get("color_analysis") if layer0 else None,
                    "circle_colors": layer0.get("circle_colors") if layer0 else None,
                },
            },
            {
                "key": "lite_prompt",
                "label": "Lite Prompt 预览",
                "status": "done" if layer1 else "missing",
                "created_at": layer1.get("created_at") if layer1 else None,
                "summary": {
                    "prompt_preview": excerpt(layer1.get("prompt_preview")) if layer1 else None,
                    "title": layer1.get("title") if layer1 else None,
                    "overall_impression": excerpt(layer1.get("overall_impression")) if layer1 else None,
                },
            },
            {
                "key": "lite_final",
                "label": "Lite 最终报告",
                "status": "done" if layer2 else "missing",
                "created_at": layer2.get("created_at") if layer2 else None,
                "summary": {
                    "title": layer2.get("title") if layer2 else None,
                    "overall_impression": excerpt(layer2.get("overall_impression")) if layer2 else None,
                    "markdown_excerpt": excerpt(layer2.get("full_report_markdown")) if layer2 else None,
                },
            },
            {
                "key": "pro_prompt",
                "label": "Pro Prompt 预览",
                "status": "done" if layer3 else "missing",
                "created_at": layer3.get("created_at") if layer3 else None,
                "summary": {
                    "prompt_preview": excerpt(layer3.get("prompt_preview")) if layer3 else None,
                    "first_impression": excerpt(layer3.get("first_impression")) if layer3 else None,
                    "core_insight_table": layer3.get("core_insight_table") if layer3 else None,
                },
            },
            {
                "key": "pro_final",
                "label": "Pro 最终报告",
                "status": "done" if layer4 else "missing",
                "created_at": layer4.get("created_at") if layer4 else None,
                "summary": {
                    "markdown_excerpt": excerpt(layer4.get("full_report_markdown")) if layer4 else None,
                    "ai_qa_context_excerpt": excerpt(layer4.get("ai_qa_context")) if layer4 else None,
                },
            },
        ]

        return {
            "interpretation_id": record.interpretation_id,
            "theme": record.theme,
            "status": record.status,
            "generation_stage": record.generation_stage,
            "generation_progress": record.generation_progress,
            "version_purchased": record.version_purchased,
            "steps": steps,
            "layers": {
                "layer_0_raw": layer0,
                "layer_1_lite_draft": layer1,
                "layer_2_lite_final": layer2,
                "layer_3_pro_draft": layer3,
                "layer_4_pro_final": layer4,
            },
            "field_provenance": {
                "lite": lite_field_provenance,
                "pro": pro_field_provenance,
            },
            "diagnostics": {
                "summary": diagnostic_summary,
                "fields": {
                    "lite": lite_field_diagnostics,
                    "pro": pro_field_diagnostics,
                },
            },
            "prompt_debug": {
                "lite": {
                    "prompt_preview": layer1.get("prompt_preview") if layer1 else None,
                    "schema": lite_schema,
                    "validation_issues": lite_validation_issues,
                    "schema_fields": lite_schema_fields,
                },
                "pro": {
                    "prompt_preview": layer3.get("prompt_preview") if layer3 else None,
                    "schema": pro_schema,
                    "validation_issues": pro_validation_issues,
                    "schema_fields": pro_schema_fields,
                },
            },
        }

    def upgrade_to_pro(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Generate the migrated Pro placeholder report for an existing Lite record."""

        started = self.start_pro_upgrade(interpretation_id)
        if started is None:
            return None
        if started["status"] == "completed":
            return started
        return self.complete_pro_upgrade(interpretation_id)

    def start_pro_upgrade(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Mark a Pro upgrade as started so the client can begin polling immediately."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        if record.get_pro_report():
            return {
                "success": True,
                "interpretation_id": interpretation_id,
                "version": "pro",
                "enabled": True,
                "status": "completed",
                "message": PRO_REPORT_BLUEPRINT.status_messages["already_available"],
            }

        if "pro" in record.version_purchased:
            upgraded = record
        else:
            upgraded = self.store.upgrade_to_pro(
                interpretation_id,
                price_diff=self.get_upgrade_diff(),
            )
            if upgraded is None:
                return None

        upgraded.status = GenerationStatus.PROCESSING
        upgraded.update_progress(GenerationStage.GENERATING.value, 85)
        self.store.save(upgraded)

        return {
            "success": True,
            "interpretation_id": interpretation_id,
            "version": "pro",
            "enabled": True,
            "status": "processing",
            "message": "一梳 Pro 版正在生成中，请稍候查看。",
        }

    def complete_pro_upgrade(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Finish a previously started Pro upgrade."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        if record.get_pro_report():
            return {
                "success": True,
                "interpretation_id": interpretation_id,
                "version": "pro",
                "enabled": True,
                "status": "completed",
                "message": PRO_REPORT_BLUEPRINT.status_messages["already_available"],
            }

        if "pro" not in record.version_purchased:
            started = self.start_pro_upgrade(interpretation_id)
            if started is None:
                return None
            record = self.store.load(interpretation_id)
            if record is None:
                return None

        record.status = GenerationStatus.PROCESSING
        record.update_progress(GenerationStage.GENERATING.value, 85)
        self.store.save(record)
        pro_bundle = self.generation_runtime.generate_pro(self, record)
        record.layer_3_pro_draft = pro_bundle.layer_3_pro_draft
        record.layer_4_pro_final = pro_bundle.layer_4_pro_final
        record.status = GenerationStatus.COMPLETED
        record.update_progress(GenerationStage.COMPLETED.value, 100)
        self.store.save(record)

        return {
            "success": True,
            "interpretation_id": interpretation_id,
            "version": "pro",
            "enabled": True,
            "status": "completed",
            "message": PRO_REPORT_BLUEPRINT.status_messages["generated_success"],
        }

    def _build_field_diagnosis_text(
        self,
        *,
        field: str,
        source_category: str,
        schema_status: str,
        final_missing: bool,
        dependency_categories: list[str],
    ) -> str:
        parts = [f"{field}"]
        if final_missing:
            parts.append("当前最终值缺失")
        if schema_status == "missing":
            parts.append("schema 必填字段未命中")
        if source_category == "fallback":
            parts.append("主要走了 fallback 产出")
        elif source_category == "prompt_draft":
            parts.append("主要来自 prompt draft")
        elif source_category == "layer0_or_knowledge":
            parts.append("主要依赖 Layer0 / knowledge")
        elif source_category == "template_merge":
            parts.append("主要由最终模板拼装")
        if "user_input" in dependency_categories:
            parts.append("对用户输入较敏感")
        if "layer0_or_knowledge" in dependency_categories:
            parts.append("对 Layer0 知识层较敏感")
        if "prompt_draft" in dependency_categories:
            parts.append("对 prompt draft 较敏感")
        return "；".join(parts)

    def _build_field_suggested_action(
        self,
        *,
        field: str,
        source_category: str,
        schema_status: str,
        final_missing: bool,
        dependency_categories: list[str],
        issue_tags: list[str],
    ) -> Dict[str, Any]:
        if "schema_missing" in issue_tags and "fallback" in issue_tags:
            return {
                "priority": "p0",
                "owner": "prompt",
                "action": f"先检查 {field} 的 prompt 输出字段是否命中 schema，再确认 fallback 是否误触发。",
            }
        if "schema_missing" in issue_tags:
            return {
                "priority": "p0",
                "owner": "prompt",
                "action": f"优先修改 {field} 对应 prompt/schema 对齐，确保模型稳定返回该字段。",
            }
        if final_missing:
            return {
                "priority": "p0",
                "owner": "template",
                "action": f"先检查 {field} 在最终模板拼装时是否被正确带入最终 report。",
            }
        if source_category == "fallback":
            return {
                "priority": "p1",
                "owner": "prompt",
                "action": f"{field} 当前主要走 fallback，优先提高 prompt draft 对该字段的稳定产出。",
            }
        if "depends_on_layer0" in issue_tags:
            return {
                "priority": "p1",
                "owner": "layer0",
                "action": f"{field} 强依赖 Layer0，先检查颜色分析、三圈能量和失衡候选是否合理。",
            }
        if "depends_on_user_input" in issue_tags:
            return {
                "priority": "p2",
                "owner": "input",
                "action": f"{field} 对用户输入敏感，先确认意图/感受是否缺失或质量不足。",
            }
        if "depends_on_prompt_draft" in issue_tags:
            return {
                "priority": "p2",
                "owner": "prompt",
                "action": f"{field} 主要依赖 prompt draft，优先比对 draft 和 final 是否发生不必要改写。",
            }
        if source_category == "template_merge":
            return {
                "priority": "p2",
                "owner": "template",
                "action": f"{field} 主要由模板拼装，优先检查 Layer2/Layer3 到最终 Markdown 的组装逻辑。",
            }
        return {
            "priority": "p3",
            "owner": "review",
            "action": f"{field} 当前链路相对稳定，优先做抽样复核即可。",
        }

    def _build_lite_placeholder_report(self, record: InterpretationRecord) -> Layer2LiteFinal:
        layer1 = record.layer_1_lite_draft
        theme = record.theme or "general"
        circle_info = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(theme)
        title = layer1.title if layer1 and layer1.title else self._build_lite_title(record, theme_label)
        overall_impression = (
            layer1.overall_impression
            if layer1 and layer1.overall_impression
            else self._build_lite_overall_impression(record, theme_label, circle_info)
        )
        visual_elements = (
            layer1.visual_elements
            if layer1 and layer1.visual_elements
            else self._build_lite_visual_elements(record, theme, circle_info)
        )
        emotion_portrait = (
            layer1.emotion_portrait
            if layer1 and layer1.emotion_portrait
            else self._build_lite_emotion_portrait(record, theme_label)
        )
        six_insights_rendered = self._render_lite_six_insights(layer1)
        experiment_rendered = self._render_lite_experiment_card(layer1)
        full_report_markdown = self._wrap_report_with_safety(
            record,
            "\n".join(
                [
                    f"# {title}",
                    "",
                    overall_impression,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_visual_elements"],
                    visual_elements,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_emotion_portrait"],
                    emotion_portrait,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_story"],
                    self._render_story_sections(layer1),
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_theme_details"].format(theme_label=theme_label),
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_scene_label']}{layer1.theme_insights.scene if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_scene']}",
                    "",
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_impact_label']}{layer1.theme_insights.impact if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_impact']}",
                    "",
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_awareness_label']}{layer1.theme_insights.awareness if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_awareness']}",
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_six_insights"],
                    six_insights_rendered["base"],
                    "",
                    six_insights_rendered["contradiction"],
                    "",
                    six_insights_rendered["pattern"],
                    "",
                    six_insights_rendered["defense"],
                    "",
                    six_insights_rendered["block"],
                    "",
                    six_insights_rendered["light"],
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_three_awareness"],
                    LITE_REPORT_BLUEPRINT.structure_labels["section_awareness_invitation"],
                    self._render_awareness_lines(layer1),
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_experiment"],
                    experiment_rendered,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_pro_teaser"],
                    layer1.pro_teaser if layer1 and layer1.pro_teaser else DEFAULT_PRO_TEASER,
                ]
            ),
        )

        layer2 = Layer2LiteFinal(
            title=title,
            overall_impression=overall_impression,
            visual_elements_rendered=visual_elements,
            emotion_portrait_rendered=emotion_portrait,
            pro_teaser=(
                layer1.pro_teaser
                if layer1 and layer1.pro_teaser
                else DEFAULT_PRO_TEASER
            ),
            full_report_markdown=full_report_markdown,
            six_insights_rendered=six_insights_rendered,
            experiment_rendered=experiment_rendered,
        )
        if layer1:
            layer2.story = layer1.story
            layer2.theme_insights = layer1.theme_insights
            layer2.three_awareness = layer1.three_awareness

        return layer2

    def _build_layer0_placeholder(self, record: InterpretationRecord) -> Layer0Raw:
        if self.layer0_assembler is not None:
            layer = self.layer0_assembler.build_from_record(
                record,
                extract_colors_by_circles=extract_colors_by_circles,
                analyze_energy_flow=analyze_energy_flow,
            )
            if layer is not None:
                return layer
            return self.layer0_assembler.build_fallback(record)

        return self._build_layer0_fallback(record)

    def _build_layer0_fallback(self, record: InterpretationRecord) -> Layer0Raw:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        layer = Layer0Raw()
        layer.imbalance_candidates = ["transition-overload"]
        layer.color_analysis = {
            "summary": LITE_REPORT_BLUEPRINT.structure_labels["layer0_color_summary"],
            "overall_saturation": 0.42,
            "black_ratio": 0.18,
            "red_ratio": 0.11,
        }
        layer.circle_colors = {
            "inner": {"focus": "self-protection"},
            "middle": {"focus": "relationship-adjustment"},
            "outer": {"focus": "external-expression"},
        }
        layer.three_circles.inner = {
            "radius_percent": circles["inner_radius"],
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_inner_meaning"],
        }
        layer.three_circles.middle = {
            "radius_percent": circles["middle_radius"],
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_middle_meaning"],
        }
        layer.three_circles.outer = {
            "radius_percent": 100,
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_outer_meaning"],
        }
        layer.micro_analysis.adjacent = [
            LITE_REPORT_BLUEPRINT.structure_labels["layer0_adjacent_left"],
            LITE_REPORT_BLUEPRINT.structure_labels["layer0_adjacent_right"],
        ]
        layer.micro_analysis.wrap = [LITE_REPORT_BLUEPRINT.structure_labels["layer0_wrap"]]
        return layer

    def _build_layer1_placeholder(self, record: InterpretationRecord) -> Layer1LiteDraft:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(record.theme)
        lite_prompt_preview = self._build_lite_prompt_preview(record)
        story_sections = self._build_lite_story_sections(record, theme_label)
        theme_insights = self._build_lite_theme_insights(record, theme_label)
        layer = Layer1LiteDraft(
            title=self._build_lite_title(record, theme_label),
            overall_impression=self._build_lite_overall_impression(record, theme_label, circles),
            visual_elements=self._build_lite_visual_elements(record, record.theme or "general", circles),
            emotion_portrait=self._build_lite_emotion_portrait(record, theme_label),
            pro_teaser=self._build_lite_pro_teaser(record),
        )
        layer.story.base.content = story_sections["base"]
        layer.story.base.connector = LITE_REPORT_BLUEPRINT.story_connectors["base"]
        layer.story.contradiction.content = story_sections["contradiction"]
        layer.story.contradiction.connector = LITE_REPORT_BLUEPRINT.story_connectors["contradiction"]
        layer.story.pattern.content = story_sections["pattern"]
        layer.story.pattern.connector = LITE_REPORT_BLUEPRINT.story_connectors["pattern"]
        layer.story.defense.content = story_sections["defense"]
        layer.story.defense.connector = LITE_REPORT_BLUEPRINT.story_connectors["defense"]
        layer.story.block.content = story_sections["block"]
        layer.story.block.connector = LITE_REPORT_BLUEPRINT.story_connectors["block"]
        layer.story.light.content = story_sections["light"]
        layer.theme_insights.scene = theme_insights["scene"]
        layer.theme_insights.impact = theme_insights["impact"]
        layer.theme_insights.awareness = theme_insights["awareness"]
        layer.three_awareness = self._build_lite_three_awareness(record, theme_label)
        story_title_map = {
            "base": "base",
            "contradiction": "contradiction",
            "pattern": "pattern",
            "defense": "defense",
            "block": "block",
            "light": "light",
        }
        for key, template in LITE_REPORT_BLUEPRINT.six_insight_layer1_templates.items():
            story_content = story_sections.get(story_title_map.get(key, ""), "")
            angle = self._get_knowledge_story_angle(record.theme, key)
            base_title = template.get("title", key)
            title = f"{base_title}：{angle}" if angle else base_title
            getattr(layer.six_insights, key).update(
                {
                    "title": title,
                    "content": story_content or render_lite_template_text(
                        template.get("content", ""),
                        theme_label=theme_label,
                        feeling_hint=self._build_feeling_hint(record),
                    ),
                    "summary": story_content or render_lite_template_text(
                        template.get("summary", ""),
                        theme_label=theme_label,
                        feeling_hint=self._build_feeling_hint(record),
                    ),
                }
            )
        layer.experiment = self._build_lite_experiment_payload(record, theme_label, layer.title)
        layer.prompt_preview = lite_prompt_preview
        return layer

    def _build_pro_placeholder_draft(self, record: InterpretationRecord) -> Layer3ProDraft:
        theme = record.theme or "general"
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(theme)
        pro_prompt_preview = self._build_pro_prompt_preview(record)
        imbalance_profile = self._build_pro_imbalance_profile(record, theme_label, circles)
        lite_title = (
            record.layer_2_lite_final.title
            if record.layer_2_lite_final and record.layer_2_lite_final.title
            else self._build_lite_title(record, theme_label)
        )
        layer = Layer3ProDraft(
            first_impression=self._build_pro_first_impression(record, theme_label, lite_title),
            core_insight_table={
                "能量本质": self._build_pro_energy_essence(record, theme_label, circles),
                "核心失衡": imbalance_profile["summary"],
                "关键卡点": self._build_pro_block_point(record, imbalance_profile),
                "转化方向": self._build_pro_direction(record, theme_label),
                "疗愈核心": self._build_pro_healing_core(record),
            },
            three_circles_detailed={
                "inner": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_inner"],
                    "reading": self._build_pro_circle_reading(
                        record,
                        "inner",
                        PRO_REPORT_BLUEPRINT.narrative_templates["circle_inner_reading"].format(
                            inner=circles["inner_radius"]
                        ),
                    ),
                },
                "middle": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_middle"],
                    "reading": self._build_pro_circle_reading(
                        record,
                        "middle",
                        PRO_REPORT_BLUEPRINT.narrative_templates["circle_middle_reading"].format(
                            middle=circles["middle_radius"]
                        ),
                    ),
                },
                "outer": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_outer"],
                    "reading": self._build_pro_circle_reading(
                        record,
                        "outer",
                        PRO_REPORT_BLUEPRINT.narrative_templates["circle_outer_reading"],
                    ),
                },
            },
            micro_analysis_detailed=self._build_pro_micro_sections_from_knowledge(record),
            imbalance_confirmed=imbalance_profile,
            root_cause={
                "surface": self._build_surface_root_cause(record),
                "deeper": self._build_deeper_root_cause(record),
                "core": self._build_core_root_cause(record),
            },
            healing_suggestions=self._build_pro_healing_suggestions(
                record,
                imbalance_profile=imbalance_profile,
                theme_label=theme_label,
            ),
        )
        layer.prompt_preview = pro_prompt_preview
        return layer

    def _build_pro_placeholder_report(self, record: InterpretationRecord) -> Layer4ProFinal:
        lite_report = record.layer_2_lite_final
        pro_draft = record.layer_3_pro_draft
        full_report_markdown = self._wrap_report_with_safety(
            record,
            "\n".join(
                [
                    f"# {PRO_REPORT_TITLE}",
                    "",
                    PRO_REPORT_INTRO,
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['first_impression']}",
                    pro_draft.first_impression if pro_draft else PRO_REPORT_BLUEPRINT.fallback_texts["missing_pro_increment"],
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['core_table']}",
                    self._render_pro_core_table(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['lite_base']}",
                    self._strip_safety_wrappers(lite_report.full_report_markdown) if lite_report else PRO_REPORT_BLUEPRINT.fallback_texts["missing_lite_base"],
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['circles']}",
                    self._render_pro_circle_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['micro']}",
                    self._render_pro_micro_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['imbalance']}",
                    self._render_pro_imbalance_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['root_cause']}",
                    self._render_pro_root_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['healing']}",
                    self._render_pro_healing_sections(pro_draft),
                ]
            ),
        )
        if self.narrative_service is not None:
            ai_qa_context = self.narrative_service.build_ai_qa_context(
                record_theme=record.theme,
                interpretation_id=record.interpretation_id,
                lite_title=lite_report.title if lite_report and lite_report.title else "",
                lite_overall_impression=(
                    lite_report.overall_impression
                    if lite_report and lite_report.overall_impression
                    else ""
                ),
                pro_draft=pro_draft,
            )
        else:
            ai_qa_context = "\n".join(
                [
                    f"主题：{record.theme}",
                    f"解读记录ID：{record.interpretation_id}",
                    f"Lite 标题：{lite_report.title if lite_report and lite_report.title else ''}",
                    f"Lite 整体印象：{lite_report.overall_impression if lite_report and lite_report.overall_impression else ''}",
                    (
                        f"第一眼直觉：{pro_draft.first_impression}"
                        if pro_draft and pro_draft.first_impression
                        else ""
                    ),
                    (
                        "核心洞察："
                        + "；".join(
                            f"{key}={value}"
                            for key, value in list((pro_draft.core_insight_table or {}).items())[:4]
                            if isinstance(value, str) and value.strip()
                        )
                        if pro_draft and pro_draft.core_insight_table
                        else ""
                    ),
                ]
            )

        return Layer4ProFinal(
            full_report_markdown=full_report_markdown,
            ai_qa_context=ai_qa_context,
        )

    def _get_theme_label(self, theme: Optional[str]) -> str:
        summary = self.get_knowledge_theme_summary(theme)
        if summary.get("name"):
            return str(summary["name"])
        return LITE_REPORT_BLUEPRINT.theme_labels.get(theme or "general", theme or "整体")

    def _build_lite_title(self, record: InterpretationRecord, theme_label: str) -> str:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_key = self._get_record_theme(record)
        inner = circles["inner_radius"]
        middle = circles["middle_radius"]
        if inner >= 42:
            return LITE_REPORT_BLUEPRINT.title_templates["inner_high"].format(theme_label=theme_label)
        if middle >= 74:
            return LITE_REPORT_BLUEPRINT.title_templates["middle_high"].format(theme_label=theme_label)
        if theme_key in LITE_REPORT_BLUEPRINT.title_templates:
            return LITE_REPORT_BLUEPRINT.title_templates[theme_key]
        return LITE_REPORT_BLUEPRINT.title_templates["default"]

    def _build_lite_overall_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circle_info: Dict[str, int],
    ) -> str:
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        theme = self._get_record_theme(record)
        dominant_theme = self._get_element_theme_phrase(theme, dominant["name"])
        secondary_keywords = self._get_element_core_keywords(theme, secondary["name"])
        transition = self._describe_circle_transition(layer0)
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        parts = [
            f"这幅画首先给人的感觉，是一种以「{dominant['name']}」为主的底色；它更在意的是{dominant_theme}。",
        ]
        if transition:
            parts.append(transition)
        parts.append(
            f"整体来看，这不是单纯往外冲的状态，而更像先把内在安顿住，再慢慢把「{secondary['name']}」相关的{secondary_keywords}带回现实。"
        )
        if signal_text:
            parts.append(signal_text)
        return " ".join(parts)

    def _build_lite_visual_elements(
        self,
        record: InterpretationRecord,
        theme: str,
        circle_info: Dict[str, int],
    ) -> str:
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else {"name": "金", "percentage": 0.0}
        inner = layer0.three_circles.inner
        middle = layer0.three_circles.middle
        outer = layer0.three_circles.outer
        circle_pattern = self._describe_circle_pattern(circle_info)
        lines = [
            f"从三圈颜色聚合来看，五行里以「{dominant['name']}」({dominant['percentage']:.2f}%) 和「{secondary['name']}」({secondary['percentage']:.2f}%) 最突出。",
            f"内圈主导为「{inner.get('dominant', '未识别')}」，中圈主导为「{middle.get('dominant', '未识别')}」，外圈主导为「{outer.get('dominant', '未识别')}」。{circle_pattern}",
        ]
        reading_segments = [
            inner.get("knowledge_reading", ""),
            middle.get("knowledge_reading", ""),
            outer.get("knowledge_reading", ""),
        ]
        reading_text = "；".join(segment for segment in reading_segments if isinstance(segment, str) and segment.strip())
        if reading_text:
            lines.append(reading_text + "。")
        return " ".join(lines).strip()

    def _build_lite_emotion_portrait(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> str:
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        outer = layer0.three_circles.outer
        theme = self._get_record_theme(record)
        feeling_hint = self._build_feeling_hint(record)
        dominant_theme = self._get_element_theme_phrase(theme, dominant["name"])
        weakest_theme = self._get_element_theme_phrase(theme, weakest["name"])
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        parts = [
            f"情绪层面上，你现在更像在优先处理「{dominant['name']}」相关的课题，也就是{dominant_theme}。",
            f"而外圈出现的「{outer.get('dominant', '金')}」，又说明你并不是想完全退回去，而是在重新整理自己要用什么样的边界、判断和回应方式与世界接触。",
        ]
        if weakest.get("percentage", 0.0) < 12:
            parts.append(
                f"相比之下，「{weakest['name']}」相关的{weakest_theme}资源暂时收得比较里面，所以当节奏一快，你更容易先想停下来整理自己。"
            )
        if signal_text:
            parts.append(signal_text)
        parts.append(feeling_hint)
        return " ".join(part for part in parts if part).strip()

    def _build_lite_story_sections(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> Dict[str, str]:
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        theme = self._get_record_theme(record)
        dominant_theme = self._get_element_theme_phrase(theme, dominant["name"])
        secondary_theme = self._get_element_theme_phrase(theme, secondary["name"])
        weakest_theme = self._get_element_theme_phrase(theme, weakest["name"])
        transition = self._describe_circle_transition(layer0)
        adjacent = layer0.micro_analysis.adjacent or []
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        outer_dominant = layer0.three_circles.outer.get("dominant", secondary["name"])

        base = (
            f"你的底色更接近「{dominant['name']}」所代表的{dominant_theme}。"
            f"{transition or ''} 这也让你做很多事之前，会先确认自己是不是已经站稳。"
        ).strip()
        contradiction = (
            f"你内里更需要{dominant_theme}，但外在已经开始调用「{outer_dominant}」的力量去整理边界、秩序或方向。"
            f"这会让你一边想继续向外，一边又不愿再用没有承载感的方式消耗自己。"
        )
        if adjacent:
            pattern = f"从圈间关系看，{adjacent[0]}。所以你的推进方式往往不是一下子冲出去，而是先在内部整合，等感觉对了才继续往前。"
        else:
            pattern = "你的模式更像先在内部整合，再决定往外投入多少能量。"
        defense = (
            f"当外圈更偏向「{outer_dominant}」时，你会更倾向用清晰、距离感或判断标准保护自己。"
            f"这不是冷下来，而是在替现在的自己筛选什么值得继续打开。"
        )
        block_parts = [
            f"当前最容易卡住你的，是主导能量和现实节奏还没完全接上。"
        ]
        if weakest.get("percentage", 0.0) < 12:
            block_parts.append(
                f"尤其是「{weakest['name']}」相关的{weakest_theme}资源暂时偏少时，你会更容易在快要推进时先退回来。"
            )
        if signal_text:
            block_parts.append(signal_text)
        light = (
            f"你的光并不只在稳定里，也在于你已经开始把「{secondary['name']}」所代表的{secondary_theme}慢慢带出来。"
            f"这说明你不是被困住，而是在学习用更适合自己的方式向前。"
        )
        return {
            "base": " ".join(part for part in [base] if part).strip(),
            "contradiction": contradiction.strip(),
            "pattern": pattern.strip(),
            "defense": defense.strip(),
            "block": " ".join(block_parts).strip(),
            "light": light.strip(),
        }

    def _build_lite_theme_insights(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> Dict[str, str]:
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        theme = self._get_record_theme(record)
        dominant_theme = self._get_element_theme_phrase(theme, dominant["name"])
        weakest_theme = self._get_element_theme_phrase(theme, weakest["name"])
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        scene = (
            f"在「{theme_label}」这个角度里，你更容易出现在“先确认自己有没有站稳，再决定要不要继续投入”的场景里。"
            f"这和画面里「{dominant['name']}」更强有关，因为它会先把注意力拉回{dominant_theme}。"
        )
        impact = (
            f"这会让你在面对关键事情时，更在意稳不稳、清不清楚、承不承受得住，而不是先求快。"
        )
        if weakest.get("percentage", 0.0) < 12:
            impact += f" 当「{weakest['name']}」相关的{weakest_theme}资源偏少时，你也会更需要一点缓冲和回收。"
        awareness = (
            f"这幅画提醒你的，不是逼自己立刻变得更强，而是看见：只要先把内在安顿好，后面的行动会自然长出来。"
        )
        if signal_text:
            awareness += f" {signal_text}"
        return {
            "scene": scene.strip(),
            "impact": impact.strip(),
            "awareness": awareness.strip(),
        }

    def _build_lite_three_awareness(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> list[DailyAwareness]:
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        theme = self._get_record_theme(record)
        dominant_keywords = self._get_element_core_keywords(theme, dominant["name"])
        weakest_theme = self._get_element_theme_phrase(theme, weakest["name"])
        outer_dominant = layer0.three_circles.outer.get("dominant", "金")
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        signal_short = signal_text.rstrip("。") if signal_text else "想推进却又停住的那个瞬间"
        return [
            DailyAwareness(
                day=1,
                title="先安顿自己",
                content=f"今天留意一下，当你准备回应外部事情前，身体会不会先想稳住一点。那往往是「{dominant['name']}」在提醒你：先照顾好{dominant_keywords}。",
            ),
            DailyAwareness(
                day=2,
                title="看见边界变化",
                content=f"当你准备继续投入时，观察自己是不是会先把边界、标准或距离感收紧。外圈的「{outer_dominant}」不是要你拒绝，而是提醒你先看清楚。",
            ),
            DailyAwareness(
                day=3,
                title="捕捉卡住瞬间",
                content=f"如果今天又出现{signal_short}的时刻，别急着评价自己。把那个瞬间记下来，你会更看清自己何时需要补回与「{weakest['name']}」相关的{weakest_theme}。",
            ),
        ]

    def _build_lite_experiment_payload(
        self,
        record: InterpretationRecord,
        theme_label: str,
        title: str,
    ) -> Dict[str, str]:
        content = build_lite_experiment_content(
            theme_label=theme_label,
            title=title,
        )
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        dominant_keywords = self._get_element_core_keywords(self._get_record_theme(record), dominant["name"])
        content = (
            f"{content}\n补充观察：如果今天只顺着这幅画练习一件事，可以试着把「{dominant['name']}」的品质带进生活里，例如先给自己一点{dominant_keywords}。"
        ).strip()
        return {
            "title": LITE_REPORT_BLUEPRINT.structure_labels["experiment_title"],
            "content": content,
        }

    def _build_lite_pro_teaser(self, record: InterpretationRecord) -> str:
        theme = self._get_record_theme(record)
        try:
            raw_teaser = get_pro_upgrade_teaser(theme)
        except Exception:
            raw_teaser = ""
        cleaned = self._clean_knowledge_text_block(raw_teaser)
        if not cleaned:
            return DEFAULT_PRO_TEASER
        if cleaned in DEFAULT_PRO_TEASER:
            return DEFAULT_PRO_TEASER
        return f"{DEFAULT_PRO_TEASER}\n\n{cleaned}".strip()

    def _build_pro_first_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        lite_title: str,
    ) -> str:
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        transition = self._describe_circle_transition(layer0)
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.contradiction.content
            else ""
        )
        parts = [
            f"第一眼看这张画，最明显的是「{dominant['name']}」和「{secondary['name']}」共同撑起了整张画的骨架。",
        ]
        if transition:
            parts.append(transition)
        parts.append(
            f"所以 Lite 里那份《{lite_title}》并不是一种空泛的安慰，而是真实反映了这张画正在处理的事：先把自己安顿住，再决定如何向外表达。"
        )
        if lite_contradiction:
            contradiction = lite_contradiction[:96].strip()
            if contradiction and contradiction[-1] not in "。！？":
                contradiction += "。"
            parts.append(contradiction)
        if signal_text:
            parts.append(signal_text)
        return " ".join(parts)

    def _build_pro_energy_essence(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: Dict[str, int],
    ) -> str:
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        transition = self._describe_circle_transition(layer0)
        return (
            f"{theme_label}主题下，这张画的能量核心更接近「{dominant['name']}」({dominant['percentage']:.2f}%)"
            f" 与「{secondary['name']}」({secondary['percentage']:.2f}%) 的组合。"
            f"{transition or ''} 这说明你现在最重要的功课，不是更快，而是让内在承载、外在边界和现实动作重新接上。"
        ).strip()

    def _build_pro_block_point(
        self,
        record: InterpretationRecord,
        imbalance_profile: Optional[Dict[str, str]] = None,
    ) -> str:
        projection = self._get_runtime_imbalance_projection(record)
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        lite_block = (
            record.layer_1_lite_draft.story.block.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.block.content
            else ""
        )
        primary = imbalance_profile.get("primary", "") if imbalance_profile else ""
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        parts: list[str] = []
        mapped_contradiction = str(projection.get("contradiction") or "").strip()
        mapped_manifestation = str(projection.get("manifestation") or "").strip()
        if mapped_contradiction:
            parts.append(f"当前更核心的卡点，其实是「{mapped_contradiction}」。")
        if mapped_manifestation:
            parts.append(mapped_manifestation.rstrip("。") + "。")
        if lite_block:
            parts.append(lite_block[:96].strip())
        if primary:
            parts.append(f"{primary}让你很难一边往前推进，一边仍然感觉自己是安全的。")
        if weakest.get("percentage", 0.0) < 12:
            weakest_theme = self._get_element_theme_phrase(self._get_record_theme(record), weakest["name"])
            parts.append(
                f"再加上「{weakest['name']}」相关的{weakest_theme}资源暂时偏少，所以你在快要真正启动时更容易先想缓一缓。"
            )
        if signal_text:
            parts.append(signal_text)
        parts.append(self._build_feeling_hint(record))
        return " ".join(part for part in parts if part).strip()

    def _build_pro_direction(self, record: InterpretationRecord, theme_label: str) -> str:
        projection = self._get_runtime_imbalance_projection(record)
        mapped_direction = str(projection.get("direction") or "").strip()
        base = PRO_REPORT_BLUEPRINT.narrative_templates["core_direction"].format(
            theme_label=theme_label
        )
        if not mapped_direction:
            return base
        return f"{mapped_direction}。{base}".strip()

    def _build_pro_healing_core(self, record: InterpretationRecord) -> str:
        projection = self._get_runtime_imbalance_projection(record)
        return str(projection.get("healing_core") or "").strip() or PRO_REPORT_BLUEPRINT.narrative_templates["core_healing"]

    def _build_deeper_root_cause(self, record: InterpretationRecord) -> str:
        projection = self._get_runtime_imbalance_projection(record)
        if projection.get("deeper_root"):
            return str(projection["deeper_root"])
        return PRO_REPORT_BLUEPRINT.narrative_templates["root_deeper"]

    def _build_core_root_cause(self, record: InterpretationRecord) -> str:
        projection = self._get_runtime_imbalance_projection(record)
        if projection.get("core_root"):
            return str(projection["core_root"])
        return PRO_REPORT_BLUEPRINT.narrative_templates["root_core"]

    def _get_runtime_imbalance_projection(self, record: InterpretationRecord) -> Dict[str, Any]:
        if not self.narrative_service:
            return {}
        imbalance_type = self._get_primary_knowledge_signal(record)
        if not imbalance_type:
            return {}
        return self.narrative_service.build_imbalance_projection(
            theme=self._get_record_theme(record),
            imbalance_type=imbalance_type,
            theme_label=self._get_theme_label(record.theme),
        )

    def _build_pro_circle_reading(
        self,
        record: InterpretationRecord,
        circle_key: str,
        fallback_text: str,
    ) -> str:
        layer0 = self._get_layer0_view(record)
        circle = getattr(layer0.three_circles, circle_key, {}) if hasattr(layer0.three_circles, circle_key) else {}
        if not isinstance(circle, dict):
            return fallback_text
        meaning = circle.get("meaning", "")
        radius_percent = circle.get("radius_percent")
        dominant = circle.get("dominant", "")
        colors = [item for item in circle.get("colors", []) if isinstance(item, str) and item]
        knowledge_reading = circle.get("knowledge_reading", "")
        parts: list[str] = []
        if meaning and radius_percent:
            parts.append(f"{meaning}当前约占 {radius_percent}%，主导元素更偏「{dominant or '未识别'}」。")
        elif dominant:
            parts.append(f"当前主导元素更偏「{dominant}」。")
        if knowledge_reading:
            parts.append(knowledge_reading.rstrip("。") + "。")
        if colors:
            parts.append(f"代表性色彩集中在 {'、'.join(colors[:3])}。")
        return " ".join(parts).strip() or fallback_text

    def _build_pro_micro_sections_from_knowledge(
        self,
        record: InterpretationRecord,
    ) -> Dict[str, str]:
        layer0 = self._get_layer0_view(record)
        adjacent = layer0.micro_analysis.adjacent or []
        wrap = layer0.micro_analysis.wrap or []
        rhythm = (
            f"圈间节奏首先显示：{adjacent[0]}。这说明当前能量更像在调整承接，而不是剧烈摆荡。"
            if adjacent
            else PRO_REPORT_BLUEPRINT.narrative_templates["micro_rhythm"]
        )
        relationship = (
            f"继续往外看，{adjacent[1]}。这意味着你的关系和现实投入，不只是情绪反应，而是在寻找更合适的承接方式。"
            if len(adjacent) > 1
            else PRO_REPORT_BLUEPRINT.narrative_templates["micro_relationship"]
        )
        action = (
            f"当前最明显的行动提示是：{wrap[0]}。与其一次性猛推，不如让行动和承载一起增长。"
            if wrap
            else PRO_REPORT_BLUEPRINT.narrative_templates["micro_action"]
        )
        return {
            PRO_REPORT_BLUEPRINT.structure_labels["micro_rhythm"]: rhythm,
            PRO_REPORT_BLUEPRINT.structure_labels["micro_relationship"]: relationship,
            PRO_REPORT_BLUEPRINT.structure_labels["micro_action"]: action,
        }

    def _render_lite_six_insights(
        self,
        layer1: Optional[Layer1LiteDraft],
    ) -> Dict[str, str]:
        rendered: Dict[str, str] = {}
        for key, value in LITE_REPORT_BLUEPRINT.six_insight_defaults.items():
            source = getattr(layer1.six_insights, key, {}) if layer1 else {}
            title = source.get("title") or value.get("title", key)
            content = source.get("content") or source.get("summary") or value.get("content", "")
            rendered[key] = f"【{title}】\n\n{content}"
        return rendered

    def _render_lite_experiment_card(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.experiment:
            return (
                f"【{LITE_REPORT_BLUEPRINT.fallback_experiment_card.get('title', LITE_REPORT_BLUEPRINT.structure_labels['fallback_experiment_title'])}】\n\n"
                f"{LITE_REPORT_BLUEPRINT.fallback_experiment_card.get('content', '')}"
            ).strip()

        title = layer1.experiment.get("title", LITE_REPORT_BLUEPRINT.structure_labels["fallback_experiment_title"])
        content = layer1.experiment.get("content", "")
        return f"【{title}】\n\n{content}".strip()

    def _render_pro_core_table(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.core_insight_table:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_core_table"]

        rows = [
            *[
                (
                    label,
                    pro_draft.core_insight_table.get(key, "")
                    or pro_draft.core_insight_table.get(
                        {
                            "核心失衡": "当前失衡",
                            "关键卡点": PRO_REPORT_BLUEPRINT.structure_labels["core_table_fallback_block"],
                            "转化方向": PRO_REPORT_BLUEPRINT.structure_labels["core_table_fallback_direction"],
                            "核心失衡": PRO_REPORT_BLUEPRINT.structure_labels["core_table_fallback_summary"],
                        }.get(key, key),
                        "",
                    ),
                )
                for key, label in PRO_REPORT_BLUEPRINT.core_table_labels
            ],
        ]
        body = "\n".join(f"| {label} | {content} |" for label, content in rows if content)
        return "\n".join(
            [
                f"| {PRO_REPORT_BLUEPRINT.structure_labels['core_table_dimension']} | {PRO_REPORT_BLUEPRINT.structure_labels['core_table_content']} |",
                "| --- | --- |",
                body,
            ]
        ).strip()

    def _render_pro_circle_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.three_circles_detailed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_circle_sections"]

        sections: list[str] = []
        order = ["inner", "middle", "outer"]
        for key in order:
            item = pro_draft.three_circles_detailed.get(key)
            if not item:
                continue
            label = item.get("label", key)
            reading = item.get("reading", "")
            if reading:
                sections.extend([f"**{label}**", "", reading, ""])
        return "\n".join(sections).strip()

    def _render_pro_micro_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.micro_analysis_detailed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_micro_sections"]

        sections: list[str] = []
        for label, content in pro_draft.micro_analysis_detailed.items():
            if not content:
                continue
            sections.extend([f"**{label}**", "", content, ""])
        return "\n".join(sections).strip()

    def _render_pro_root_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.root_cause:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_root_sections"]

        sections: list[str] = []
        for key in ["surface", "deeper", "core"]:
            content = pro_draft.root_cause.get(key, "")
            if not content:
                continue
            sections.extend([f"**{PRO_REPORT_BLUEPRINT.root_cause_labels.get(key, key)}**", "", content, ""])
        return "\n".join(sections).strip()

    def _render_pro_imbalance_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.imbalance_confirmed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_imbalance_sections"]

        sections: list[str] = []
        for key, label in PRO_REPORT_BLUEPRINT.imbalance_labels.items():
            content = pro_draft.imbalance_confirmed.get(key, "")
            if not content:
                continue
            sections.extend([f"**{label}**", "", content, ""])
        return "\n".join(sections).strip()

    def _render_pro_healing_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.healing_suggestions:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_healing_sections"]

        sections: list[str] = []
        for item in pro_draft.healing_suggestions:
            phase = item.get("phase", PRO_REPORT_BLUEPRINT.narrative_templates["healing_phase_fallback"])
            focus = item.get("focus", "")
            practice = item.get("practice", "")
            if not focus and not practice:
                continue
            sections.extend([f"**{phase}**", focus or PRO_REPORT_BLUEPRINT.narrative_templates["healing_focus_fallback"]])
            if practice:
                sections.extend([f"{PRO_REPORT_BLUEPRINT.structure_labels['healing_action_prefix']}{practice}", ""])
            else:
                sections.append("")
        return "\n".join(sections).strip()

    def _strip_safety_wrappers(self, content: str) -> str:
        cleaned = content
        protocol = SafetyProtocol()
        for disclaimer_type in ["basic", "with_crisis_hotline", "high_risk"]:
            disclaimer = protocol.get_disclaimer(disclaimer_type).strip()
            cleaned = cleaned.replace(disclaimer, "").strip()
        return cleaned

    def _get_record_theme(self, record: InterpretationRecord) -> str:
        return getattr(record, "theme", None) or "general"

    def _get_layer0_view(self, record: InterpretationRecord) -> Layer0Raw:
        layer0 = getattr(record, "layer_0_raw", None)
        if isinstance(layer0, Layer0Raw):
            return layer0
        try:
            return self._build_layer0_fallback(record)
        except Exception:
            return Layer0Raw()

    def _get_layer0_element_distribution(self, layer0: Layer0Raw) -> list[Dict[str, Any]]:
        source = {
            "wood": getattr(layer0.five_elements, "wood", {}),
            "fire": getattr(layer0.five_elements, "fire", {}),
            "earth": getattr(layer0.five_elements, "earth", {}),
            "metal": getattr(layer0.five_elements, "metal", {}),
            "water": getattr(layer0.five_elements, "water", {}),
        }
        distribution: list[Dict[str, Any]] = []
        for key, item in source.items():
            raw_item = item if isinstance(item, dict) else {}
            try:
                percentage = float(raw_item.get("percentage", 0.0) or 0.0)
            except (TypeError, ValueError):
                percentage = 0.0
            distribution.append(
                {
                    "key": key,
                    "name": raw_item.get("element_cn") or ELEMENT_KEY_TO_CN.get(key, key),
                    "percentage": round(percentage, 2),
                    "areas": raw_item.get("areas", []) if isinstance(raw_item.get("areas", []), list) else [],
                }
            )
        return sorted(distribution, key=lambda item: item["percentage"], reverse=True)

    def _get_primary_knowledge_signal(self, record: InterpretationRecord) -> str:
        layer0 = self._get_layer0_view(record)
        candidates = getattr(layer0, "imbalance_candidates", []) or []
        for item in candidates:
            if isinstance(item, str) and item.strip():
                return item.strip()
        return ""

    def _get_signal_label(self, signal: str) -> str:
        labels = {
            "transition-overload": "过渡负荷",
            "boundary-constriction": "边界紧绷",
            "relational-drain": "关系耗散",
            "emotion-congestion": "情绪淤积",
            "action-block": "行动受阻",
            "energy-block": "能量受阻",
        }
        return labels.get(signal, signal.replace("-", " ").strip())

    def _describe_signal(self, signal: str) -> str:
        descriptions = {
            "transition-overload": "你正处在旧节奏尚未完全退场、新节奏又开始拉扯的过渡期。",
            "boundary-constriction": "你更容易先收紧边界来维持安全感。",
            "relational-drain": "很多能量已经流向外部关系与任务，回补速度暂时还没跟上。",
            "emotion-congestion": "情绪更多停留在内部循环，还没有找到稳定的出口。",
            "action-block": "行动能量在启动前被过多顾虑和自我保护截住了。",
            "energy-block": "内外能量的转换还不够顺畅，所以你会时常感觉想推进却又被拉住。",
        }
        return descriptions.get(signal, "")

    def _get_knowledge_theme_config(self, theme: Optional[str]) -> Dict[str, Any]:
        theme_key = theme or "general"
        try:
            config = get_theme_config(theme_key)
        except Exception:
            config = {}
        if isinstance(config, dict) and config:
            return config
        if theme_key != "general":
            try:
                fallback = get_theme_config("general")
            except Exception:
                fallback = {}
            return fallback if isinstance(fallback, dict) else {}
        return {}

    def _get_knowledge_insight_templates(self, theme: Optional[str]) -> Dict[str, Any]:
        theme_key = theme or "general"
        try:
            templates = get_insight_templates(theme_key)
        except Exception:
            templates = {}
        if isinstance(templates, dict) and templates:
            return templates
        if theme_key != "general":
            try:
                fallback = get_insight_templates("general")
            except Exception:
                fallback = {}
            return fallback if isinstance(fallback, dict) else {}
        return {}

    def _get_theme_element_profile(self, theme: Optional[str], element_name: str) -> Dict[str, Any]:
        config = self._get_knowledge_theme_config(theme)
        meanings = config.get("element_meanings", {}) if isinstance(config, dict) else {}
        if isinstance(meanings, dict):
            profile = meanings.get(element_name)
            if isinstance(profile, dict):
                return profile
        return {}

    def _get_element_theme_phrase(self, theme: Optional[str], element_name: str) -> str:
        profile = self._get_theme_element_profile(theme, element_name)
        psychological_theme = profile.get("psychological_theme")
        if isinstance(psychological_theme, str) and psychological_theme.strip():
            return psychological_theme.strip()
        core_concept = profile.get("core_concept")
        if isinstance(core_concept, str) and core_concept.strip():
            return core_concept.strip()
        return f"{element_name}元素的状态"

    def _get_element_core_keywords(self, theme: Optional[str], element_name: str) -> str:
        profile = self._get_theme_element_profile(theme, element_name)
        keywords = profile.get("keywords")
        if isinstance(keywords, list) and keywords:
            filtered = [str(item).strip() for item in keywords if isinstance(item, str) and item.strip()]
            if filtered:
                return "、".join(filtered[:3])
        return self._get_element_theme_phrase(theme, element_name)

    def _describe_circle_transition(self, layer0: Layer0Raw) -> str:
        inner = layer0.three_circles.inner.get("dominant", "")
        middle = layer0.three_circles.middle.get("dominant", "")
        outer = layer0.three_circles.outer.get("dominant", "")
        if inner and middle and outer:
            if inner == middle == outer:
                return f"三圈目前都围绕「{inner}」展开。"
            if inner == middle and outer != inner:
                return f"内圈和中圈都更偏「{inner}」，外圈则开始转向「{outer}」。"
            return f"三圈依次呈现出「{inner} -> {middle} -> {outer}」的变化。"
        return ""

    def _get_knowledge_story_angle(self, theme: Optional[str], section_key: str) -> str:
        label_map = {
            "base": "你的底色",
            "contradiction": "你的矛盾",
            "pattern": "你的模式",
            "defense": "你的防御",
            "block": "你的卡点",
            "light": "你的光",
        }
        templates = self._get_knowledge_insight_templates(theme)
        label = label_map.get(section_key, "")
        payload = templates.get(label, {}) if isinstance(templates, dict) else {}
        if isinstance(payload, dict):
            angle = payload.get("角度")
            if isinstance(angle, str) and angle.strip():
                return angle.strip()
        return ""

    def _clean_knowledge_text_block(self, content: str) -> str:
        if not isinstance(content, str):
            return ""
        lines = []
        for raw_line in content.strip().splitlines():
            line = raw_line.strip()
            if not line:
                if lines and lines[-1]:
                    lines.append("")
                continue
            if line.startswith("💡 "):
                line = line[2:].strip()
            if line.startswith("🔓 "):
                line = line[2:].strip()
            if line.startswith("👉 "):
                line = line[2:].strip()
            lines.append(line)
        return "\n".join(lines).strip()

    def _build_user_context_hint(self, record: InterpretationRecord) -> str:
        intention = (record.painting_intention or "").strip()
        feeling = (record.painting_feeling or "").strip()
        parts: list[str] = []
        if intention:
            parts.append(
                LITE_REPORT_BLUEPRINT.narrative_templates["user_context_from_intention"].format(
                    intention=intention,
                )
            )
        if feeling:
            parts.append(
                LITE_REPORT_BLUEPRINT.narrative_templates["user_context_from_feeling"].format(
                    feeling=feeling,
                )
            )
        return " ".join(parts)

    def _build_lite_prompt_preview(self, record: InterpretationRecord) -> str:
        vision_payload = {
            "theme": record.theme,
            "painting_intention": record.painting_intention,
            "painting_feeling": record.painting_feeling,
            "three_circles": record.three_circles or {},
            "layer_0_raw": record.layer_0_raw.to_dict() if record.layer_0_raw else None,
        }
        return self.prompt_builder.build_lite(
            vision_data=json.dumps(vision_payload, ensure_ascii=False, indent=2),
            theme=record.theme or "general",
            theme_context=self._build_theme_prompt_context(record),
            extra_context={
                "theme_label": self._get_theme_label(record.theme),
            },
        )

    def _build_theme_prompt_context(self, record: InterpretationRecord) -> str:
        theme_label = self._get_theme_label(record.theme)
        intention = (record.painting_intention or "").strip() or "未填写"
        feeling = (record.painting_feeling or "").strip() or "未填写"
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else None
        secondary = distribution[1] if len(distribution) > 1 else None
        signal = self._get_primary_knowledge_signal(record)
        lines = [
            f"- 当前主题：{theme_label}",
            f"- 创作前意图：{intention}",
            f"- 创作时感受：{feeling}",
            f"- 内圈半径：{circles.get('inner_radius', 33)}%",
            f"- 中圈半径：{circles.get('middle_radius', 66)}%",
        ]
        if dominant:
            line = f"- 五行主导：{dominant['name']} {dominant['percentage']:.2f}%"
            if secondary:
                line += f"，其次是 {secondary['name']} {secondary['percentage']:.2f}%"
            lines.append(line)
        lines.append(
            "- 三圈主导："
            f"内圈{layer0.three_circles.inner.get('dominant', '未识别')} / "
            f"中圈{layer0.three_circles.middle.get('dominant', '未识别')} / "
            f"外圈{layer0.three_circles.outer.get('dominant', '未识别')}"
        )
        if signal:
            lines.append(f"- 知识库失衡候选：{self._get_signal_label(signal)}")

        summary = self.get_knowledge_theme_summary(record.theme)
        if summary:
            knowledge_theme_name = summary.get("name")
            core_issues = summary.get("core_issues") or []
            if knowledge_theme_name:
                lines.append(f"- V2知识主题：{knowledge_theme_name}")
            if core_issues:
                lines.append(f"- V2主题核心议题：{' / '.join(core_issues[:4])}")
            if summary.get("focus_element"):
                lines.append(f"- V2主题关注元素：{summary['focus_element']}")

        return "\n".join(lines)

    def get_knowledge_theme_summary(self, theme: Optional[str]) -> Dict[str, Any]:
        if not self.knowledge_engine:
            return {}

        try:
            summary = get_theme_summary(theme or "general")
        except Exception:
            return {}

        return summary if isinstance(summary, dict) else {}

    def _build_pro_prompt_preview(self, record: InterpretationRecord) -> str:
        vision_payload = {
            "theme": record.theme,
            "painting_intention": record.painting_intention,
            "painting_feeling": record.painting_feeling,
            "three_circles": record.three_circles or {},
            "layer_0_raw": record.layer_0_raw.to_dict() if record.layer_0_raw else None,
            "layer_1_lite_draft": record.layer_1_lite_draft.to_dict() if record.layer_1_lite_draft else None,
        }
        return self.prompt_builder.build_pro(
            vision_data=json.dumps(vision_payload, ensure_ascii=False, indent=2),
            theme=record.theme or "general",
            theme_context=self._build_theme_prompt_context(record),
            extra_context={
                "theme_label": self._get_theme_label(record.theme),
            },
        )

    def _build_feeling_hint(self, record: InterpretationRecord) -> str:
        feeling = (record.painting_feeling or "").strip()
        if not feeling:
            return LITE_REPORT_BLUEPRINT.narrative_templates["feeling_hint_default"]
        return LITE_REPORT_BLUEPRINT.narrative_templates["feeling_hint_from_feeling"].format(
            feeling=feeling,
        )

    def _build_surface_root_cause(self, record: InterpretationRecord) -> str:
        intention = (record.painting_intention or "").strip()
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        projection = self._get_runtime_imbalance_projection(record)
        mapped_manifestation = str(projection.get("manifestation") or "").strip()
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.contradiction.content
            else ""
        )
        if not intention:
            base = (
                PRO_REPORT_BLUEPRINT.narrative_templates["surface_root_without_intention"].format(
                    lite_contradiction=f"{lite_contradiction[:72]} " if lite_contradiction else ""
                )
            )
            if mapped_manifestation:
                base = f"{base} 更落到现实里看，它常会表现成：{mapped_manifestation}。"
            return f"{base} {signal_text}".strip() if signal_text else base
        base = (
            PRO_REPORT_BLUEPRINT.narrative_templates["surface_root_with_intention"].format(
                lite_contradiction=f"{lite_contradiction[:72]} " if lite_contradiction else "",
                intention=intention,
            )
        )
        if mapped_manifestation:
            base = f"{base} 现实层面也常会表现成：{mapped_manifestation}。"
        return f"{base} {signal_text}".strip() if signal_text else base

    def _map_knowledge_signal_to_profile(self, signal: str) -> str:
        direct_profiles = set(PRO_REPORT_BLUEPRINT.imbalance_profiles.keys())
        if signal in direct_profiles:
            return signal
        mapping = {
            "transition-overload": "energy-block",
        }
        return mapping.get(signal, "")

    def _build_pro_imbalance_profile(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: Dict[str, int],
    ) -> Dict[str, str]:
        inner = circles.get("inner_radius", 33)
        middle = circles.get("middle_radius", 66)
        profile_key = self._select_pro_imbalance_type(
            record=record,
            inner=inner,
            middle=middle,
        )
        signal = self._get_primary_knowledge_signal(record)
        runtime_profile = self._build_runtime_imbalance_profile(
            record,
            profile_key=profile_key,
            signal=signal,
            theme_label=theme_label,
        )
        if runtime_profile:
            return runtime_profile

        signal_label = self._get_signal_label(signal) if signal else ""
        signal_text = self._describe_signal(signal)

        template = PRO_REPORT_BLUEPRINT.imbalance_profiles.get(
            profile_key,
            PRO_REPORT_BLUEPRINT.imbalance_profiles.get("energy-block", {}),
        )
        summary = render_template_text(
            template.get("summary", ""),
            inner=str(inner),
            middle=str(middle),
            theme_label=theme_label,
        )
        evidence = render_template_text(
            template.get("evidence", ""),
            inner=str(inner),
            middle=str(middle),
            theme_label=theme_label,
        )
        if signal and signal != profile_key:
            summary = f"{summary} 同时，Layer 0 的知识候选更接近「{signal_label}」，说明这不是单点问题，而更像阶段性的能量转折。"
            evidence = f"{evidence} 知识库原始候选同时提示为「{signal_label}」。"
        elif signal_text:
            evidence = f"{evidence} {signal_text}".strip()
        return {
            "type": profile_key,
            "primary": template.get("primary", "能量受阻型失衡"),
            "summary": summary,
            "evidence": evidence,
            "energy_level": render_template_text(
                template.get("energy_level", ""),
                inner=str(inner),
                middle=str(middle),
                theme_label=theme_label,
            ),
            "psychological_level": render_template_text(
                template.get("psychological_level", ""),
                inner=str(inner),
                middle=str(middle),
                theme_label=theme_label,
            ),
            "life_manifestation": render_template_text(
                template.get("life_manifestation", ""),
                inner=str(inner),
                middle=str(middle),
                theme_label=theme_label,
            ),
        }

    def _build_runtime_imbalance_profile(
        self,
        record: InterpretationRecord,
        *,
        profile_key: str,
        signal: str,
        theme_label: str,
    ) -> Dict[str, str]:
        if not signal or not self.narrative_service:
            return {}
        projection = self._get_runtime_imbalance_projection(record)
        if not projection:
            return {}
        if not projection.get("contradiction") and not projection.get("manifestation"):
            return {}

        return {
            "type": profile_key,
            "primary": str(projection.get("contradiction") or self._get_signal_label(signal)),
            "summary": str(projection.get("summary") or ""),
            "evidence": str(projection.get("evidence") or ""),
            "energy_level": str(projection.get("manifestation") or self._describe_signal(signal)),
            "psychological_level": str(projection.get("contradiction") or self._describe_signal(signal)),
            "life_manifestation": str(
                projection.get("manifestation")
                or projection.get("direction")
                or self._describe_signal(signal)
            ),
        }

    def _select_pro_imbalance_type(
        self,
        *,
        record: InterpretationRecord,
        inner: int,
        middle: int,
    ) -> str:
        signal = self._get_primary_knowledge_signal(record)
        mapped_signal = self._map_knowledge_signal_to_profile(signal)
        if mapped_signal:
            return mapped_signal

        for rule in PRO_REPORT_BLUEPRINT.imbalance_selection_rules:
            if rule.inner_gte is not None and inner < rule.inner_gte:
                continue
            if rule.middle_gte is not None and middle < rule.middle_gte:
                continue
            if rule.theme_in and (record.theme or "general") not in set(rule.theme_in):
                continue
            return rule.type

        return "energy-block"

    def _build_pro_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        imbalance_profile: Dict[str, str],
        theme_label: str,
    ) -> list[Dict[str, str]]:
        primary = imbalance_profile.get("primary", "能量受阻型失衡")
        runtime_rendered = self._build_runtime_healing_suggestions(
            record,
            primary=primary,
            theme_label=theme_label,
        )
        if runtime_rendered:
            return runtime_rendered

        type_code = imbalance_profile.get("type", "energy-block")
        templates = PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get(type_code) or PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get("energy-block", [])
        rendered = [
            {
                "phase": item.get("phase", ""),
                "focus": render_template_text(
                    item.get("focus", ""),
                    primary=primary,
                    theme_label=theme_label,
                ),
                "practice": render_template_text(
                    item.get("practice", ""),
                    primary=primary,
                    theme_label=theme_label,
                ),
            }
            for item in templates
        ]
        common_tail_template = PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get("common_tail", {})
        common_tail = {
            "phase": common_tail_template.get("phase", "建议三：把理解变成稳定边界"),
            "focus": render_template_text(
                common_tail_template.get(
                    "focus",
                    "真正的疗愈不是一次性解决全部问题，而是围绕「{primary}」慢慢建立更适合你的节奏与承载方式。",
                ),
                primary=primary,
                theme_label=theme_label,
            ),
            "practice": render_template_text(
                common_tail_template.get(
                    "practice",
                    "这周在{theme_label}里只保留少量但稳定的承诺，练习在不透支自己的前提下继续向外连接。",
                ),
                primary=primary,
                theme_label=theme_label,
            ),
        }
        return [*rendered, common_tail]

    def _build_runtime_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        primary: str,
        theme_label: str,
    ) -> list[Dict[str, str]]:
        if not self.knowledge_runtime:
            return []

        imbalance_type = self._get_primary_knowledge_signal(record)
        if not imbalance_type:
            return []

        healing_result = self.knowledge_runtime.healing_service.get_healing_plan(
            imbalance_type,
            self._get_record_theme(record),
        )
        payload = healing_result.value if isinstance(healing_result.value, dict) else {}
        if not payload:
            return []

        issue_type = str(payload.get("issue_type") or "").strip()
        symptoms = str(payload.get("symptoms") or "").strip()
        mandala_prescription = str(payload.get("mandala_prescription") or "").strip()
        daily_practice = str(payload.get("daily_practice") or "").strip()
        cognitive_upgrade = str(payload.get("cognitive_upgrade") or "").strip()

        if not any([issue_type, symptoms, mandala_prescription, daily_practice, cognitive_upgrade]):
            return []

        phase_one_focus = symptoms or f"这次更需要先看见「{issue_type or primary}」在你当下的具体表现。"
        if issue_type:
            phase_one_focus = f"当前更接近的疗愈议题是「{issue_type}」。{phase_one_focus}"

        phase_two_focus = (
            mandala_prescription
            or f"围绕「{primary}」先做小幅但稳定的调节，而不是期待一次性把所有问题解决。"
        )
        phase_three_focus = (
            cognitive_upgrade
            or f"真正的转化，不是立刻变成另一个人，而是在{theme_label}里慢慢长出更稳的节奏。"
        )

        return [
            {
                "phase": f"建议一：先识别「{issue_type or primary}」",
                "focus": phase_one_focus,
                "practice": daily_practice
                or "先用一句话写下你最近最常出现的感受，再决定要不要马上处理它。",
            },
            {
                "phase": "建议二：把绘画当成调节容器",
                "focus": phase_two_focus,
                "practice": daily_practice
                or f"本周只围绕{theme_label}做一个最小动作，让身体先适应新的节奏。",
            },
            {
                "phase": "建议三：把理解落回现实生活",
                "focus": phase_three_focus,
                "practice": render_template_text(
                    "这周在{theme_label}里保留少量但稳定的承诺，围绕「{primary}」练习不过度用力，也不完全退回去。",
                    primary=primary,
                    theme_label=theme_label,
                ),
            },
        ]

    def _describe_circle_pattern(self, circles: Dict[str, int]) -> str:
        inner = circles.get("inner_radius", 33)
        middle = circles.get("middle_radius", 66)
        if inner >= 40:
            return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_inner_high"]
        if middle >= 72:
            return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_middle_high"]
        return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_default"]

    def _render_story_sections(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_story_sections"]

        return "\n".join(
            sum(
                [
                    [heading, getattr(layer1.story, key).content, ""]
                    for key, heading in LITE_REPORT_BLUEPRINT.story_section_headings
                ],
                [],
            )[:-1]
        )

    def _render_awareness_lines(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.three_awareness:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_awareness_lines"]

        return "\n".join(
            f"### 第 {item.day} 天：{item.title}\n{item.content}"
            for item in layer1.three_awareness
        )

    def _render_experiment_text(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.experiment:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_experiment_text"]

        return f"{layer1.experiment.get('title', '一个小实验')}：{layer1.experiment.get('content', '')}"

    def _wrap_report_with_safety(self, record: InterpretationRecord, content: str) -> str:
        safety = quick_safety_check(
            imbalance_type=(
                record.layer_0_raw.imbalance_candidates[0]
                if record.layer_0_raw and record.layer_0_raw.imbalance_candidates
                else None
            ),
            color_analysis=record.layer_0_raw.color_analysis if record.layer_0_raw else None,
            text_content=" ".join(
                part
                for part in [
                    record.painting_intention or "",
                    record.painting_feeling or "",
                    content,
                ]
                if part
            ),
        )
        return SafetyProtocol().wrap_output(content, safety.risk_level, context="toc")
