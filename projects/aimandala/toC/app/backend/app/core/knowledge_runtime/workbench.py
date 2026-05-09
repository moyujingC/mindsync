"""Local knowledge workbench helpers for candidate builds and fixture evals."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Any

import yaml

from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
from app.core.pipeline.report_knowledge_debug import KnowledgeDebugBlockBuilder
from app.core.pipeline.report_safety_wrapper import ReportSafetyWrapper
from app.core.pipeline.store import InterpretationStore
from app.core.pipeline.generation_runtime import (
    DeterministicReportGenerationRuntime,
    LLMReportGenerationRuntime,
)
from app.core.llm.runtime import NoopLLMClient, create_llm_client_from_env

from .compiler import KnowledgePackCompiler
from .repository import (
    get_knowledge_toc_root,
    parse_build_selector,
    resolve_build_dir,
    resolve_build_index_path,
)
from .runtime import create_knowledge_runtime
from .validators import KnowledgePackValidator


class KnowledgeWorkbench:
    """Own the local-only build/eval/debug loop for the knowledge pack."""

    ORIGINAL_INTERPRETATION_MANUAL = "docs/sources/知识库构建/原始镜像/01_曼陀罗解读手册.md"
    MANUAL_PROCESS_STAGE_IDS = [
        "stage-00-input-context",
        "stage-01-theme-selection",
        "stage-02-circle-boundary-decision",
        "stage-03-direct-judgment-high-hit-check",
        "stage-04-per-circle-visual-evidence",
        "stage-05-per-circle-color-shape-element-reading",
        "stage-06-per-circle-imbalance-candidates",
        "stage-07-whole-energy-flow-synthesis",
        "stage-08-conflict-blockage",
        "stage-09-healing-goal",
        "stage-10-lite-draft",
        "stage-11-pro-draft",
        "stage-12-final-report",
    ]

    def __init__(self, *, toc_root: Path | None = None) -> None:
        self.toc_root = toc_root or get_knowledge_toc_root()
        self.project_root = self.toc_root.parent
        self.pack_root = self.toc_root / "data" / "knowledge" / "packs" / "v2.1"
        self.builds_root = self.toc_root / "data" / "knowledge" / "builds"
        self.fixtures_manifest_path = self.project_root / "fixtures" / "manifest.yaml"
        self.golden_root = self.project_root / "fixtures" / "toc-mvp" / "golden"
        self.validator = KnowledgePackValidator()

    def validate(self) -> dict[str, Any]:
        """Validate YAML pack assets, references, and fixture manifest integrity."""

        with tempfile.TemporaryDirectory(prefix="aimandala-kb-validate-") as temp_dir:
            compiler = KnowledgePackCompiler(
                pack_root=self.pack_root,
                build_dir=Path(temp_dir),
                validator=self.validator,
            )
            compiler.build()

        fixtures = self.load_fixture_manifest()
        fixture_checks = [self._validate_fixture_definition(item) for item in fixtures]
        return {
            "ok": all(item["ok"] for item in fixture_checks),
            "pack_root": str(self.pack_root),
            "fixture_count": len(fixtures),
            "fixtures": fixture_checks,
        }

    def build_candidate(self, build_id: str) -> dict[str, Any]:
        """Compile one candidate build and write `index.json` + `quality.json`."""

        build_selector = f"candidate:{build_id}"
        build_dir = resolve_build_dir(build_selector)
        compiler = KnowledgePackCompiler(
            pack_root=self.pack_root,
            build_dir=build_dir,
            validator=self.validator,
        )
        compiler.build()
        quality = self.ensure_quality_artifact(build_selector, persist=True)
        return {
            "build_selector": build_selector,
            "build_dir": str(build_dir),
            "index_path": str(build_dir / "index.json"),
            "quality_path": str(build_dir / "quality.json"),
            "quality": quality,
        }

    async def run_evals(
        self,
        *,
        build_selector: str,
        fixture_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        """Run fixed fixture previews and persist per-sample eval artifacts."""

        fixtures = self.load_fixture_manifest()
        selected_ids = set(fixture_ids or [])
        active_fixtures = [
            fixture
            for fixture in fixtures
            if not selected_ids or fixture["id"] in selected_ids
        ]
        build_dir = resolve_build_dir(build_selector)
        eval_dir = build_dir / "evals"
        eval_dir.mkdir(parents=True, exist_ok=True)

        sample_results = []
        for fixture_meta in active_fixtures:
            fixture = self.load_fixture(str(fixture_meta["id"]))
            preview = await self.preview_fixture(
                fixture_id=fixture["id"],
                build_selector=build_selector,
                version=self._resolve_fixture_version(fixture),
                compare_to_current=build_selector != "current",
            )
            sample_results.append(preview)
            sample_path = eval_dir / f"{fixture['id']}.json"
            sample_path.write_text(
                json.dumps(preview, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

        summary = self._build_eval_summary(
            build_selector=build_selector,
            sample_results=sample_results,
            golden_review_root=self.golden_root,
        )
        (eval_dir / "summary.json").write_text(
            json.dumps(summary, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return summary

    def diff_builds(
        self,
        *,
        base_selector: str = "current",
        target_selector: str,
    ) -> dict[str, Any]:
        """Build a serializable diff between two build summaries and eval summaries."""

        base_summary = self.load_build_summary(base_selector)
        target_summary = self.load_build_summary(target_selector)

        base_quality = base_summary["quality"]
        target_quality = target_summary["quality"]
        base_eval = base_summary.get("eval_summary") or {}
        target_eval = target_summary.get("eval_summary") or {}

        return {
            "base_selector": base_selector,
            "target_selector": target_selector,
            "build_info": {
                "base": base_summary["build_info"],
                "target": target_summary["build_info"],
            },
            "quality_diff": {
                "fallback_hotspots_added": self._added_items(
                    base_quality.get("fallback_hotspots", []),
                    target_quality.get("fallback_hotspots", []),
                    key_fields=["kind", "theme_id", "imbalance_id"],
                ),
                "fallback_hotspots_removed": self._added_items(
                    target_quality.get("fallback_hotspots", []),
                    base_quality.get("fallback_hotspots", []),
                    key_fields=["kind", "theme_id", "imbalance_id"],
                ),
                "high_risk_warning_paths_added": self._added_items(
                    base_quality.get("high_risk_warning_paths", []),
                    target_quality.get("high_risk_warning_paths", []),
                    key_fields=["imbalance_id"],
                ),
                "high_risk_warning_paths_removed": self._added_items(
                    target_quality.get("high_risk_warning_paths", []),
                    base_quality.get("high_risk_warning_paths", []),
                    key_fields=["imbalance_id"],
                ),
                "theme_asset_changes": self._dict_delta(
                    base_quality.get("theme_asset_coverage", {}),
                    target_quality.get("theme_asset_coverage", {}),
                ),
                "healing_coverage_changes": self._dict_delta(
                    base_quality.get("healing_lookup_coverage", {}),
                    target_quality.get("healing_lookup_coverage", {}),
                ),
            },
            "eval_diff": {
                "fallback_delta": (
                    int(target_eval.get("summary", {}).get("fixture_fallback_count", 0))
                    - int(base_eval.get("summary", {}).get("fixture_fallback_count", 0))
                ),
                "warning_delta": (
                    int(target_eval.get("summary", {}).get("warning_hit_count", 0))
                    - int(base_eval.get("summary", {}).get("warning_hit_count", 0))
                ),
                "structured_missing_delta": (
                    int(target_eval.get("summary", {}).get("structured_missing_count", 0))
                    - int(base_eval.get("summary", {}).get("structured_missing_count", 0))
                ),
                "regression_flag_delta": (
                    int(target_eval.get("summary", {}).get("regression_flag_count", 0))
                    - int(base_eval.get("summary", {}).get("regression_flag_count", 0))
                ),
            },
        }

    def load_build_summary(self, build_selector: str) -> dict[str, Any]:
        """Return one build summary for local debug and frontend workbench use."""

        quality = self.ensure_quality_artifact(build_selector, persist=False)
        build_dir = resolve_build_dir(build_selector)
        eval_summary_path = build_dir / "evals" / "summary.json"
        eval_summary = None
        if eval_summary_path.exists():
            candidate = json.loads(eval_summary_path.read_text(encoding="utf-8"))
            if self._is_eval_summary_current(candidate):
                eval_summary = candidate
        return {
            "build_info": quality["build_info"],
            "quality": quality,
            "eval_summary": eval_summary,
        }

    async def ensure_build_summary(self, build_selector: str) -> dict[str, Any]:
        """Ensure a build has quality and eval artifacts before returning summary."""

        summary = self.load_build_summary(build_selector)
        if summary.get("eval_summary") is None:
            await self.run_evals(build_selector=build_selector)
            summary = self.load_build_summary(build_selector)
        return summary

    async def preview_fixture(
        self,
        *,
        fixture_id: str,
        build_selector: str,
        version: str,
        compare_to_current: bool = True,
    ) -> dict[str, Any]:
        """Run one fixture against one build and return a workbench preview payload."""

        fixture = self.load_fixture(fixture_id)
        preview = await self._execute_fixture(
            fixture=fixture,
            build_selector=build_selector,
            version=version,
        )
        if compare_to_current and build_selector != "current":
            current_preview = await self._execute_fixture(
                fixture=fixture,
                build_selector="current",
                version=version,
            )
            preview["diff_from_current"] = self._build_fixture_diff(
                current=current_preview,
                candidate=preview,
            )
        else:
            preview["diff_from_current"] = None
        return preview

    async def export_fixture_golden(
        self,
        *,
        fixture_id: str,
        build_selector: str,
        version: str,
        output_dir: Path | str | None = None,
    ) -> dict[str, Any]:
        """Export one fixture as human-reviewable golden assets."""

        fixture = self.load_fixture(fixture_id)
        execution = await self._execute_fixture(
            fixture=fixture,
            build_selector=build_selector,
            version=version,
            include_details=True,
        )
        if output_dir is None:
            export_dir = self.golden_root / fixture_id
        else:
            export_dir = Path(output_dir) / fixture_id
        export_dir.mkdir(parents=True, exist_ok=True)

        report_payload = self._build_export_report_payload(
            fixture=fixture,
            execution=execution,
        )
        process_payload = self._build_export_manual_process_trace(
            fixture=fixture,
            execution=execution,
            report=report_payload,
        )
        debug_payload = self._build_export_debug_payload(
            execution,
            manual_process_trace=process_payload,
        )
        report_markdown = self._build_export_report_markdown(
            fixture=fixture,
            report=report_payload,
            manual_process_trace=process_payload,
        )
        process_markdown = self._build_export_manual_process_markdown(
            fixture=fixture,
            process_trace=process_payload,
        )

        report_path = export_dir / f"{version}.report.json"
        debug_path = export_dir / f"{version}.debug.json"
        markdown_path = export_dir / f"{version}.report.md"
        process_path = export_dir / f"{version}.process.json"
        process_markdown_path = export_dir / f"{version}.process.md"

        report_path.write_text(
            json.dumps(report_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        process_path.write_text(
            json.dumps(process_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        debug_path.write_text(
            json.dumps(debug_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        markdown_path.write_text(report_markdown, encoding="utf-8")
        process_markdown_path.write_text(process_markdown, encoding="utf-8")

        return {
            "fixture_id": fixture_id,
            "version": version,
            "build_selector": build_selector,
            "output_dir": str(export_dir),
            "artifacts": {
                "report_json": str(report_path),
                "debug_json": str(debug_path),
                "report_markdown": str(markdown_path),
                "process_json": str(process_path),
                "process_markdown": str(process_markdown_path),
            },
        }

    def load_fixture_manifest(self) -> list[dict[str, Any]]:
        payload = yaml.safe_load(self.fixtures_manifest_path.read_text(encoding="utf-8")) or {}
        fixtures = payload.get("fixtures", [])
        if not isinstance(fixtures, list):
            raise ValueError("fixtures/manifest.yaml must contain a fixtures list")
        resolved = []
        for item in fixtures:
            if not isinstance(item, dict):
                raise ValueError("fixture manifest entries must be mappings")
            resolved.append({**item, "path": self._resolve_path(item.get("path"))})
        return resolved

    def load_fixture(self, fixture_id: str) -> dict[str, Any]:
        for fixture in self.load_fixture_manifest():
            if fixture.get("id") != fixture_id:
                continue
            path = Path(str(fixture["path"]))
            payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
            if not isinstance(payload, dict):
                raise ValueError(f"fixture file is not a mapping: {path}")
            return {**payload, "_fixture_path": str(path)}
        raise ValueError(f"unknown fixture id: {fixture_id}")

    def ensure_quality_artifact(
        self,
        build_selector: str,
        *,
        persist: bool,
    ) -> dict[str, Any]:
        build_dir = resolve_build_dir(build_selector)
        quality_path = build_dir / "quality.json"
        if quality_path.exists():
            return json.loads(quality_path.read_text(encoding="utf-8"))
        payload = self._synthesize_quality_payload(build_selector)
        if persist:
            build_dir.mkdir(parents=True, exist_ok=True)
            quality_path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        return payload

    async def _execute_fixture(
        self,
        *,
        fixture: dict[str, Any],
        build_selector: str,
        version: str,
        include_details: bool = False,
    ) -> dict[str, Any]:
        llm_client = create_llm_client_from_env()
        runtime = create_knowledge_runtime(
            build_selector=build_selector,
            llm_client=llm_client,
        )
        debug_builder = KnowledgeDebugBlockBuilder(
            get_knowledge_runtime=lambda: runtime,
            get_primary_knowledge_signal=lambda record: (
                next(
                    (
                        item
                        for item in (record.layer_0_raw.imbalance_candidates or [])
                        if isinstance(item, str) and item.strip()
                    ),
                    "",
                )
            ),
        )

        input_payload = fixture.get("input", {}) if isinstance(fixture.get("input"), dict) else {}
        validation = (
            fixture.get("validation", {})
            if isinstance(fixture.get("validation"), dict)
            else {}
        )
        execution = (
            fixture.get("execution", {})
            if isinstance(fixture.get("execution"), dict)
            else {}
        )

        with tempfile.TemporaryDirectory(prefix="aimandala-kb-workbench-") as temp_dir:
            store = InterpretationStore(storage_dir=str(Path(temp_dir) / "interpretations"))
            generation_runtime = (
                DeterministicReportGenerationRuntime()
                if type(llm_client) is NoopLLMClient
                else LLMReportGenerationRuntime(llm_client=llm_client)
            )
            orchestrator = LayeredOrchestrator(
                store=store,
                knowledge_runtime=runtime,
                generation_runtime=generation_runtime,
                enable_vision=False,
            )

            create_kwargs = {
                "image_path": str(self._resolve_path(input_payload.get("image_path"))),
                "user_id": str(input_payload.get("user_profile") or f"{fixture.get('id', 'fixture')}-user"),
                "theme": str(fixture.get("theme") or input_payload.get("theme") or "general"),
                "painting_intention": self._resolve_fixture_user_intention(fixture),
                "painting_feeling": self._resolve_fixture_user_feeling(fixture),
                "three_circles": self._build_three_circle_override(input_payload),
            }
            record = await orchestrator.generate_lite_placeholder(
                **create_kwargs,
                check_existing=False,
            )

            repeat_record = None
            if bool(execution.get("create_twice")) or bool(validation.get("existing_on_repeat")):
                repeat_record = await orchestrator.generate_lite_placeholder(
                    **create_kwargs,
                    check_existing=True,
                )

            stored_record = store.load(record.interpretation_id) or record
            self._apply_layer0_overrides(stored_record, execution)
            store.save(stored_record)

            if version == "pro" or bool(execution.get("upgrade_to_pro")):
                orchestrator.complete_pro_upgrade(stored_record.interpretation_id)

            report = orchestrator.get_report(stored_record.interpretation_id, version=version) or {}
            stored_record = store.load(stored_record.interpretation_id) or stored_record
            knowledge_debug = debug_builder.build(stored_record, report_mode=version)
            regression_flags = self._build_regression_flags(
                report=report,
                record=stored_record,
                repeat_record=repeat_record,
                validation=validation,
                knowledge_debug=knowledge_debug,
            )

            payload = {
                "fixture_meta": {
                    "fixture_id": fixture.get("id"),
                    "fixture_path": fixture.get("_fixture_path"),
                    "theme": fixture.get("theme"),
                    "fixture_type": fixture.get("fixture_type"),
                    "coverage": fixture.get("coverage", []),
                    "build_selector": build_selector,
                    "version": version,
                },
                "report_summary": self._build_report_summary(report),
                "knowledge_summary": self._build_knowledge_summary(knowledge_debug),
                "regression_flags": regression_flags,
            }
            if include_details:
                payload["report"] = self._sanitize_export_value(report)
                payload["knowledge_debug"] = self._sanitize_export_value(knowledge_debug)
            return payload

    def _build_regression_flags(
        self,
        *,
        report: dict[str, Any],
        record: Any,
        repeat_record: Any,
        validation: dict[str, Any],
        knowledge_debug: dict[str, Any],
    ) -> list[str]:
        flags: list[str] = []
        report_version = str(report.get("version") or "")
        expected_version = str(validation.get("report_version") or "").strip()
        if expected_version and report_version != expected_version:
            flags.append(f"report_version_mismatch:{expected_version}->{report_version}")

        required_fields = validation.get("required_structured_fields", [])
        structured = report.get("structured") if isinstance(report.get("structured"), dict) else {}
        if isinstance(required_fields, list):
            for field in required_fields:
                if not isinstance(field, str):
                    continue
                if self._read_structured_field(structured, field) in (None, "", [], {}):
                    flags.append(f"structured_missing:{field}")

        if bool(validation.get("existing_on_repeat")) and repeat_record is None:
            flags.append("expected_existing_on_repeat")
        if bool(validation.get("existing_on_repeat")) and repeat_record is not None:
            if repeat_record.interpretation_id != record.interpretation_id:
                flags.append("existing_on_repeat_missed")

        expected_fallback = validation.get("fallback_used")
        actual_fallback = bool(
            knowledge_debug.get("fallback_analysis", {}).get("used")
        )
        if isinstance(expected_fallback, bool) and expected_fallback != actual_fallback:
            flags.append(f"fallback_expectation_mismatch:{expected_fallback}->{actual_fallback}")

        warning_ids = validation.get("warning_ids", [])
        actual_warning_ids = {
            str(item.get("imbalance_id") or "")
            for item in knowledge_debug.get("warning_analysis", {}).get("warning_hits", [])
            if isinstance(item, dict)
        }
        if isinstance(warning_ids, list):
            for warning_id in warning_ids:
                if isinstance(warning_id, str) and warning_id not in actual_warning_ids:
                    flags.append(f"warning_missing:{warning_id}")

        algorithm_trace = (
            knowledge_debug.get("algorithm_fidelity_trace", {})
            if isinstance(knowledge_debug.get("algorithm_fidelity_trace"), dict)
            else {}
        )
        if not bool(algorithm_trace.get("algorithm_fidelity_pass")):
            flags.append("algorithm_fidelity_failed")
        if bool(algorithm_trace.get("legacy_semantics_found")):
            flags.append("legacy_semantics_found")
        if bool(algorithm_trace.get("raw_payload_leak_found")):
            flags.append("raw_payload_leak_found")

        return flags

    def _build_report_summary(self, report: dict[str, Any]) -> dict[str, Any]:
        structured = report.get("structured") if isinstance(report.get("structured"), dict) else {}
        report_version = str(report.get("version") or "lite")
        structured_presence = {}
        lite_fields = [
            "topic_context",
            "current_reading",
            "visual_basis",
            "pattern_interpretation",
            "life_connection",
            "lite_healing_guidance",
            "pro_report_entry",
        ]
        pro_fields = [
            "topic_context",
            "deep_impression",
            "evidence_digest",
            "imbalance_diagnosis",
            "root_cause_chain",
            "deep_structure_interpretation",
            "healing_plan",
        ]
        field_set = pro_fields if report_version == "pro" else lite_fields
        for field in field_set:
            structured_presence[field] = self._read_structured_field(structured, field) not in (
                None,
                "",
                [],
                {},
            )

        return {
            "version": report_version,
            "title": report.get("title"),
            "overall_impression": report.get("overall_impression"),
            "report_excerpt": self._excerpt(report.get("report")),
            "ai_qa_context_present": bool(report.get("ai_qa_context")),
            "structured_field_presence": structured_presence,
        }

    def _resolve_fixture_user_intention(self, fixture: dict[str, Any]) -> str:
        input_payload = fixture.get("input", {}) if isinstance(fixture.get("input"), dict) else {}
        raw = str(input_payload.get("painting_intention") or "").strip()
        fixture_type = str(fixture.get("fixture_type") or "").strip()
        if fixture_type in {"existing-reuse", "vision-stability"} or self._looks_like_qa_intention(raw):
            return "想更看清自己现在的状态，也想知道接下来怎么更稳地往前。"
        return raw

    def _resolve_fixture_user_feeling(self, fixture: dict[str, Any]) -> str:
        input_payload = fixture.get("input", {}) if isinstance(fixture.get("input"), dict) else {}
        raw = str(input_payload.get("painting_feeling") or "").strip()
        fixture_type = str(fixture.get("fixture_type") or "").strip()
        if fixture_type in {"existing-reuse", "vision-stability"} or self._looks_like_qa_intention(raw):
            return "先如实看看这张画带出来的感受，不急着下结论。"
        return raw

    def _looks_like_qa_intention(self, value: str) -> bool:
        markers = [
            "验证",
            "复用",
            "测试",
            "稳定性",
            "fixture",
            "三圈边界",
            "画面结构",
        ]
        return any(marker in value for marker in markers)

    def _build_knowledge_summary(self, knowledge_debug: dict[str, Any]) -> dict[str, Any]:
        layer0 = knowledge_debug.get("layer0_evidence", {})
        warning_analysis = knowledge_debug.get("warning_analysis", {})
        fallback_analysis = knowledge_debug.get("fallback_analysis", {})
        return {
            "build_info": knowledge_debug.get("build_info", {}),
            "imbalance_candidates": layer0.get("imbalance_candidates", []),
            "layer0_evidence": layer0,
            "algorithm_fidelity_trace": knowledge_debug.get("algorithm_fidelity_trace", {}),
            "query_results": knowledge_debug.get("query_results", {}),
            "fallback_analysis": fallback_analysis,
            "warning_analysis": warning_analysis,
            "source_refs": knowledge_debug.get("source_refs", []),
            "field_to_knowledge_map": knowledge_debug.get("field_to_knowledge_map", {}),
            "summary": {
                "fallback_used": bool(fallback_analysis.get("used")),
                "fallback_levels": fallback_analysis.get("levels", []),
                "warning_hit_count": len(warning_analysis.get("warning_hits", [])),
                "source_ref_count": len(knowledge_debug.get("source_refs", [])),
                "algorithm_fidelity_pass": bool(
                    knowledge_debug.get("algorithm_fidelity_trace", {}).get("algorithm_fidelity_pass")
                ),
                "legacy_semantics_found": bool(
                    knowledge_debug.get("algorithm_fidelity_trace", {}).get("legacy_semantics_found")
                ),
                "raw_payload_leak_found": bool(
                    knowledge_debug.get("algorithm_fidelity_trace", {}).get("raw_payload_leak_found")
                ),
            },
        }

    def _build_eval_summary(
        self,
        *,
        build_selector: str,
        sample_results: list[dict[str, Any]],
        golden_review_root: Path | None = None,
    ) -> dict[str, Any]:
        fallback_count = sum(
            1
            for item in sample_results
            if bool(item.get("knowledge_summary", {}).get("summary", {}).get("fallback_used"))
        )
        warning_hit_count = sum(
            len(item.get("knowledge_summary", {}).get("warning_analysis", {}).get("warning_hits", []))
            for item in sample_results
        )
        algorithm_fidelity_fail_count = sum(
            1
            for item in sample_results
            if not bool(item.get("knowledge_summary", {}).get("summary", {}).get("algorithm_fidelity_pass"))
        )
        legacy_semantics_count = sum(
            1
            for item in sample_results
            if bool(item.get("knowledge_summary", {}).get("summary", {}).get("legacy_semantics_found"))
        )
        raw_payload_leak_count = sum(
            1
            for item in sample_results
            if bool(item.get("knowledge_summary", {}).get("summary", {}).get("raw_payload_leak_found"))
        )
        structured_missing_count = sum(
            1
            for item in sample_results
            for present in item.get("report_summary", {}).get("structured_field_presence", {}).values()
            if present is False
        )
        regression_flag_count = sum(
            len(item.get("regression_flags", []))
            for item in sample_results
        )
        golden_reviews = [
            self._load_golden_review_result(
                fixture_id=str(item.get("fixture_meta", {}).get("fixture_id") or ""),
                version=str(item.get("report_summary", {}).get("version") or "lite"),
                golden_review_root=golden_review_root,
            )
            for item in sample_results
        ]
        all_golden_reviews = self._collect_golden_review_results(golden_review_root)
        golden_reviewed_count = sum(1 for item in all_golden_reviews if item.get("reviewed"))
        golden_pass_count = sum(1 for item in all_golden_reviews if item.get("result") == "pass")
        golden_pass_with_drift_count = sum(
            1 for item in all_golden_reviews if item.get("result") == "pass_with_drift"
        )
        golden_fail_count = sum(1 for item in all_golden_reviews if item.get("result") == "fail")
        open_deviation_count = sum(
            int(item.get("deviation_count") or 0) for item in all_golden_reviews
        )

        return {
            "build_selector": build_selector,
            "generated_at": self._now_iso(),
            "summary": {
                "fixture_count": len(sample_results),
                "fixture_fallback_count": fallback_count,
                "warning_hit_count": warning_hit_count,
                "algorithm_fidelity_fail_count": algorithm_fidelity_fail_count,
                "legacy_semantics_found_count": legacy_semantics_count,
                "raw_payload_leak_found_count": raw_payload_leak_count,
                "structured_missing_count": structured_missing_count,
                "regression_flag_count": regression_flag_count,
                "golden_reviewed_count": golden_reviewed_count,
                "golden_pass_count": golden_pass_count,
                "golden_pass_with_drift_count": golden_pass_with_drift_count,
                "golden_fail_count": golden_fail_count,
                "open_deviation_count": open_deviation_count,
            },
            "fixtures": [
                {
                    "fixture_id": item.get("fixture_meta", {}).get("fixture_id"),
                    "theme": item.get("fixture_meta", {}).get("theme"),
                    "version": item.get("report_summary", {}).get("version"),
                    "fallback_used": item.get("knowledge_summary", {}).get("summary", {}).get("fallback_used"),
                    "warning_hit_count": item.get("knowledge_summary", {}).get("summary", {}).get("warning_hit_count"),
                    "algorithm_fidelity_pass": item.get("knowledge_summary", {}).get("summary", {}).get("algorithm_fidelity_pass"),
                    "legacy_semantics_found": item.get("knowledge_summary", {}).get("summary", {}).get("legacy_semantics_found"),
                    "raw_payload_leak_found": item.get("knowledge_summary", {}).get("summary", {}).get("raw_payload_leak_found"),
                    "regression_flags": item.get("regression_flags", []),
                    "structured_missing_fields": [
                        field
                        for field, present in item.get("report_summary", {}).get("structured_field_presence", {}).items()
                        if present is False
                    ],
                    "golden_review": golden_reviews[index],
                }
                for index, item in enumerate(sample_results)
            ],
        }

    def _build_fixture_diff(
        self,
        *,
        current: dict[str, Any],
        candidate: dict[str, Any],
    ) -> dict[str, Any]:
        current_summary = current.get("knowledge_summary", {}).get("summary", {})
        candidate_summary = candidate.get("knowledge_summary", {}).get("summary", {})
        current_presence = current.get("report_summary", {}).get("structured_field_presence", {})
        candidate_presence = candidate.get("report_summary", {}).get("structured_field_presence", {})
        structured_missing_added = sorted(
            field
            for field, present in candidate_presence.items()
            if present is False and current_presence.get(field) is not False
        )
        structured_missing_removed = sorted(
            field
            for field, present in current_presence.items()
            if present is False and candidate_presence.get(field) is not False
        )
        current_warnings = {
            str(item.get("imbalance_id") or "")
            for item in current.get("knowledge_summary", {}).get("warning_analysis", {}).get("warning_hits", [])
            if isinstance(item, dict)
        }
        candidate_warnings = {
            str(item.get("imbalance_id") or "")
            for item in candidate.get("knowledge_summary", {}).get("warning_analysis", {}).get("warning_hits", [])
            if isinstance(item, dict)
        }
        return {
            "fallback_delta": int(candidate_summary.get("fallback_used", False)) - int(current_summary.get("fallback_used", False)),
            "warning_ids_added": sorted(candidate_warnings - current_warnings),
            "warning_ids_removed": sorted(current_warnings - candidate_warnings),
            "structured_missing_added": structured_missing_added,
            "structured_missing_removed": structured_missing_removed,
            "report_excerpt_changed": (
                current.get("report_summary", {}).get("report_excerpt")
                != candidate.get("report_summary", {}).get("report_excerpt")
            ),
        }

    def _synthesize_quality_payload(self, build_selector: str) -> dict[str, Any]:
        index_path = resolve_build_index_path(build_selector)
        if not index_path.exists():
            if build_selector == "current":
                KnowledgePackCompiler(
                    pack_root=self.pack_root,
                    build_dir=resolve_build_dir(build_selector),
                    validator=self.validator,
                ).ensure_index()
            else:
                raise ValueError(f"build index not found: {index_path}")

        index = json.loads(index_path.read_text(encoding="utf-8"))
        source, build_id = parse_build_selector(build_selector)
        quality = index.get("stats", {}).get("quality", {})
        theme_asset_coverage = quality.get("theme_asset_coverage", {})
        theme_mapping_coverage = quality.get("theme_mapping_coverage", {})
        healing_lookup_coverage = quality.get("healing_lookup_coverage", {})
        fallback_hotspots = quality.get("fallback_hotspots", [])
        high_risk_warning_paths = quality.get("high_risk_warning_paths", [])

        return {
            "build_info": {
                "build_selector": build_selector,
                "build_source": source,
                "build_id": build_id,
                "pack_id": index.get("pack_id"),
                "schema_version": index.get("schema_version"),
                "generated_at": index.get("generated_at"),
                "index_path": str(index_path),
            },
            "summary": {
                "theme_count": len(index.get("stats", {}).get("theme_ids", [])),
                "fallback_hotspot_count": len(fallback_hotspots),
                "high_risk_warning_count": len(high_risk_warning_paths),
                "themes_missing_healing_count": sum(
                    1
                    for item in theme_asset_coverage.values()
                    if not bool(item.get("has_healing"))
                ),
                "themes_missing_narrative_count": sum(
                    1
                    for item in theme_asset_coverage.values()
                    if not bool(item.get("has_narrative"))
                ),
                "high_fallback_risk_theme_count": sum(
                    1
                    for item in healing_lookup_coverage.values()
                    if str(item.get("fallback_risk")) == "high"
                ),
            },
            "fallback_hotspots": fallback_hotspots,
            "theme_asset_coverage": theme_asset_coverage,
            "theme_mapping_coverage": theme_mapping_coverage,
            "healing_lookup_coverage": healing_lookup_coverage,
            "high_risk_warning_paths": high_risk_warning_paths,
        }

    def _validate_fixture_definition(self, fixture_meta: dict[str, Any]) -> dict[str, Any]:
        path = Path(str(fixture_meta["path"]))
        problems: list[str] = []
        if not path.exists():
            problems.append("fixture file missing")
            return {"fixture_id": fixture_meta.get("id"), "ok": False, "problems": problems}

        payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(payload, dict):
            return {
                "fixture_id": fixture_meta.get("id"),
                "ok": False,
                "problems": ["fixture payload must be a mapping"],
            }

        input_payload = payload.get("input", {})
        validation = payload.get("validation", {})
        if not isinstance(input_payload, dict):
            problems.append("input must be a mapping")
            input_payload = {}
        if not isinstance(validation, dict):
            problems.append("validation must be a mapping")
            validation = {}

        required_top_level = ["id", "theme", "fixture_type"]
        for field in required_top_level:
            if not payload.get(field):
                problems.append(f"missing field: {field}")

        image_path = input_payload.get("image_path")
        if not image_path:
            problems.append("input.image_path is required")
        else:
            resolved_image_path = self._resolve_path(image_path)
            if not resolved_image_path.exists():
                problems.append(f"input.image_path missing: {resolved_image_path}")

        required_structured_fields = validation.get("required_structured_fields", [])
        if required_structured_fields and not isinstance(required_structured_fields, list):
            problems.append("validation.required_structured_fields must be a list")

        return {
            "fixture_id": payload.get("id") or fixture_meta.get("id"),
            "ok": len(problems) == 0,
            "problems": problems,
        }

    def _resolve_fixture_version(self, fixture: dict[str, Any]) -> str:
        validation = fixture.get("validation", {})
        if isinstance(validation, dict) and validation.get("report_version") in {"lite", "pro"}:
            return str(validation["report_version"])
        input_payload = fixture.get("input", {})
        if isinstance(input_payload, dict) and input_payload.get("expected_report_version") in {"lite", "pro"}:
            return str(input_payload["expected_report_version"])
        return "lite"

    def _is_eval_summary_current(self, summary: dict[str, Any]) -> bool:
        if not isinstance(summary, dict):
            return False
        fixtures = summary.get("fixtures", [])
        if not isinstance(fixtures, list):
            return False
        manifest_ids = [
            str(item.get("id") or "")
            for item in self.load_fixture_manifest()
            if isinstance(item, dict) and str(item.get("id") or "")
        ]
        summary_ids = [
            str(item.get("fixture_id") or "")
            for item in fixtures
            if isinstance(item, dict) and str(item.get("fixture_id") or "")
        ]
        return summary_ids == manifest_ids

    def _build_export_report_payload(
        self,
        *,
        fixture: dict[str, Any],
        execution: dict[str, Any],
    ) -> dict[str, Any]:
        report = execution.get("report", {})
        if not isinstance(report, dict):
            report = {}
        return {
            **report,
            "fixture_meta": self._sanitize_export_value(execution.get("fixture_meta", {})),
            "knowledge_debug": self._sanitize_export_value(execution.get("knowledge_debug", {})),
            "regression_flags": list(execution.get("regression_flags", [])),
            "asset_ref": self._sanitize_export_value(fixture.get("asset_ref", {})),
        }

    def _build_export_debug_payload(
        self,
        execution: dict[str, Any],
        *,
        manual_process_trace: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        knowledge_debug = execution.get("knowledge_debug", {})
        if not isinstance(knowledge_debug, dict):
            knowledge_debug = {}
        payload = {
            "manual_process_trace": manual_process_trace or {},
            "algorithm_fidelity_trace": knowledge_debug.get("algorithm_fidelity_trace", {}),
            "topic_context_trace": knowledge_debug.get("topic_context_trace", {}),
            "narrative_plans": knowledge_debug.get("narrative_plans", {}),
            "field_to_knowledge_map": knowledge_debug.get("field_to_knowledge_map", {}),
            "fallback_analysis": knowledge_debug.get("fallback_analysis", {}),
            "warning_analysis": knowledge_debug.get("warning_analysis", {}),
        }
        return self._sanitize_export_value(payload)

    def _build_export_report_markdown(
        self,
        *,
        fixture: dict[str, Any],
        report: dict[str, Any],
        manual_process_trace: dict[str, Any] | None = None,
    ) -> str:
        structured = report.get("structured", {}) if isinstance(report.get("structured"), dict) else {}
        version = str(report.get("version") or "lite")
        topic_context = structured.get("topic_context", {}) if isinstance(structured.get("topic_context"), dict) else {}
        lines = [
            f"# Golden Report: {fixture.get('id')} / {version}",
            "",
            "## 基本信息",
            "",
            f"- 样本：`{fixture.get('id')}`",
            f"- 模式：`{version}`",
            f"- 议题：`{topic_context.get('topic') or fixture.get('theme') or 'general'}`",
            f"- 议题标签：{topic_context.get('topic_label') or ''}",
            "",
            "## 解读过程链",
            "",
            "这部分用于 QA 复盘：最终报告的表达可以沿用优化后的自然文案，但底层推导必须能回到原始解读手册的顺序。",
            "",
        ]
        for stage in (manual_process_trace or {}).get("stages", []):
            if not isinstance(stage, dict):
                continue
            summary = str(stage.get("summary") or "").strip()
            if not summary:
                continue
            lines.append(f"- `{stage.get('id')}` {stage.get('label')}：{summary}")
        lines.extend([
            "",
            "## 产品区块",
            "",
        ])
        field_labels = self._golden_field_labels(version)
        for field, label in field_labels:
            value = structured.get(field)
            rendered = self._render_markdown_value(value)
            if not rendered:
                continue
            lines.extend(
                [
                    f"### {label}",
                    "",
                    rendered,
                    "",
                ]
            )
        raw_report = self._strip_safety_wrappers(report.get("report"))
        excerpt = self._excerpt(raw_report, limit=600)
        if excerpt:
            lines.extend(
                [
                    "## 正文摘录",
                    "",
                    excerpt,
                    "",
                ]
            )
        return "\n".join(lines).strip() + "\n"

    def _build_export_manual_process_trace(
        self,
        *,
        fixture: dict[str, Any],
        execution: dict[str, Any],
        report: dict[str, Any],
    ) -> dict[str, Any]:
        knowledge_debug = execution.get("knowledge_debug", {})
        if not isinstance(knowledge_debug, dict):
            knowledge_debug = {}
        structured = report.get("structured", {}) if isinstance(report.get("structured"), dict) else {}
        version = str(report.get("version") or "lite")
        input_package = knowledge_debug.get("review_input_package") or knowledge_debug.get("input_package") or {}
        if not isinstance(input_package, dict):
            input_package = {}
        layer0_summary = knowledge_debug.get("review_layer0_summary", {})
        if not isinstance(layer0_summary, dict):
            layer0_summary = {}
        layer0_evidence = knowledge_debug.get("layer0_evidence", {})
        if not isinstance(layer0_evidence, dict):
            layer0_evidence = {}
        rule_evaluations = layer0_evidence.get("rule_evaluations", {})
        if not isinstance(rule_evaluations, dict):
            rule_evaluations = {}
        method_trace = rule_evaluations.get("interpretation_method_trace", {})
        if not isinstance(method_trace, dict):
            method_trace = {}
        product_blocks = knowledge_debug.get("product_block_debug", {})
        if not isinstance(product_blocks, dict):
            product_blocks = {}
        topic_context = structured.get("topic_context", {}) if isinstance(structured.get("topic_context"), dict) else {}
        topic_input = input_package.get("topic_input", {}) if isinstance(input_package.get("topic_input"), dict) else {}
        user_context = input_package.get("user_context", {}) if isinstance(input_package.get("user_context"), dict) else {}
        circle_config = input_package.get("circle_config", {}) if isinstance(input_package.get("circle_config"), dict) else {}
        knowledge_projections = knowledge_debug.get("knowledge_projections", {})
        if not isinstance(knowledge_projections, dict):
            knowledge_projections = {}

        stages = [
            self._manual_stage(
                "stage-00-input-context",
                "输入上下文",
                "先记录用户主题、创作意图、创作感受和图像引用，避免后续报告脱离用户当下问题。",
                {
                    "topic": topic_input.get("topic") or topic_context.get("topic") or fixture.get("theme") or "general",
                    "topic_label": topic_input.get("topic_label") or topic_context.get("topic_label") or "",
                    "painting_intention": user_context.get("painting_intention") or "",
                    "painting_feeling": user_context.get("painting_feeling") or "",
                    "image_ref": self._sanitize_export_value(
                        self._dig(input_package, ["image", "image_ref"])
                        or fixture.get("asset_ref", {}).get("asset_path", "")
                    ),
                },
                manual_refs=["解读前准备：询问绘画者想要解读的主题"],
            ),
            self._manual_stage(
                "stage-01-theme-selection",
                "确定解读主题",
                "按手册要求先确定解读重点，再进入三圈和细节判断；本次主题会作为后续所有判断的投影口径。",
                {
                    "selected_theme": topic_context.get("topic") or fixture.get("theme") or "general",
                    "selected_theme_label": topic_context.get("topic_label") or "",
                    "selection_source": "fixture/user_input",
                },
                manual_refs=["第一步：确定绘画者的主题。解读主题是什么？财富、情感还是健康。"],
            ),
            self._manual_stage(
                "stage-02-circle-boundary-decision",
                "确定三圈边界并锁定",
                "按手册先定三圈，定完后不在解读中来回改动；QA 需要检查这一步是否明确留下边界和来源。",
                {
                    "inner_radius": circle_config.get("inner_radius"),
                    "middle_radius": circle_config.get("middle_radius"),
                    "auto_detect_inner_radius": circle_config.get("auto_detect_inner_radius"),
                    "auto_detect_middle_radius": circle_config.get("auto_detect_middle_radius"),
                    "source": circle_config.get("source") or "unknown",
                    "locked_for_interpretation": True,
                },
                manual_refs=["第二步：确定好主题后，以你的神为准确定三个圈的结构。", "买定离手，落子无悔。"],
            ),
            self._manual_stage(
                "stage-03-direct-judgment-high-hit-check",
                "直断法高命中检查",
                "直断法不是切入点选择，而是在三圈锁定后先检查高命中特征；命中项只能作为快速抓手，后续必须被逐圈颜色、形状和生克关系继续验证。",
                {
                    "catalog_version": self._dig(rule_evaluations, ["direct_judgment_hits", "catalog_version"]),
                    "hits": self._dig(rule_evaluations, ["direct_judgment_hits", "hits"]) or [],
                    "method_trace_source": self._dig(method_trace, ["direct_judgment", "source"]),
                    "direct_judgment_summary": layer0_summary.get("direct_judgment_summary", ""),
                    "candidate_summary": layer0_summary.get("candidate_summary", ""),
                },
                manual_refs=[
                    "新手解读6式：外圈花边、星星点点",
                    "新手解读6式：外圈红色多",
                    "新手解读6式：外圈颜色单一且面积大",
                    "新手解读6式：渐变色",
                    "新手解读6式：颜色浓郁、深重",
                    "新手解读6式：颜色浅、轻",
                ],
            ),
            self._manual_stage(
                "stage-04-per-circle-visual-evidence",
                "逐圈画面依据",
                "先把每一圈可见的颜色、形状、比例、填充和结构说清楚，再进入状态解释；这是最终画面依据区的来源。",
                {
                    "visual_fact_summary": layer0_summary.get("visual_fact_summary", ""),
                    "per_circle_observation_summary": layer0_summary.get("per_circle_observation_summary", ""),
                    "shape_observation_summary": layer0_summary.get("shape_observation_summary", ""),
                    "final_visual_basis": self._final_block_excerpt(
                        product_blocks,
                        version,
                        "visual_basis" if version == "lite" else "evidence_digest",
                    ),
                },
                manual_refs=["三圈结构法", "从曼陀罗中的 X，我能看出你是 Y"],
            ),
            self._manual_stage(
                "stage-05-per-circle-color-shape-element-reading",
                "逐圈颜色、形状与圈内生克解读",
                "依据原始手册逐圈看颜色、深浅、面积、形状及本圈内部五行生克；用户可见正文要少术语，把关系翻译成现实状态。",
                {
                    "per_circle_color_analysis": method_trace.get("per_circle_color_analysis", {}),
                    "shape_analysis": method_trace.get("shape_analysis", {}),
                    "element_state_summary": layer0_summary.get("element_state_summary", ""),
                    "relation_summary": layer0_summary.get("relation_summary", ""),
                    "final_report_language_rule": "少术语；三圈和五行只能服务解释，不能喧宾夺主。",
                },
                manual_refs=[
                    "五行感知法",
                    "五行相生相克解读法",
                    "在运用形状进行解读时，可以结合颜色、五行相生相克、新手解读6式等一起解读。",
                ],
            ),
            self._manual_stage(
                "stage-06-per-circle-imbalance-candidates",
                "逐圈失衡候选",
                "失衡状态应在逐圈颜色、形状和圈内生克解读过程中浮现，而不是先给一个抽象标签再回填证据。",
                {
                    "candidate_summary": layer0_summary.get("candidate_summary", ""),
                    "selected_primary_candidates": self._dig(
                        method_trace, ["final_algorithm_basis", "selected_primary_candidates"]
                    )
                    or [],
                    "circle_relation_analysis": method_trace.get("circle_relation_analysis", {}),
                },
                manual_refs=["五行相生相克解读法", "相生相克的结果是好是坏，也要看其平衡情况。"],
            ),
            self._manual_stage(
                "stage-07-whole-energy-flow-synthesis",
                "整体能量流动综合",
                "逐圈解读之后再看整体；这里看的不是简单圈与圈之间的五行关系，而是内在、关系和外在呈现之间的能量流动是否顺、堵、倒灌或跳跃。",
                {
                    "energy_flow_basis": method_trace.get("circle_relation_analysis", {}),
                    "flow_reading_rule": "整体综合阶段读取三圈能量流动，不把圈间五行关系当作最终结论本身。",
                    "final_report_language_rule": "少术语；把能量流动翻译成用户能理解的现实状态。",
                },
                manual_refs=["三圈结构法", "三圈能量循环模型", "能量流动质量评估"],
            ),
            self._manual_stage(
                "stage-08-conflict-blockage",
                "找冲突、卡点、堵点",
                "在主题和画面证据基础上找到当前最影响用户的卡点，而不是泛泛讲所有主题。",
                {
                    "candidate_summary": layer0_summary.get("candidate_summary", ""),
                    "final_block": self._final_block_excerpt(
                        product_blocks,
                        version,
                        "pattern_interpretation" if version == "lite" else "imbalance_diagnosis",
                    ),
                    "root_cause": structured.get("root_cause_chain") if version == "pro" else {},
                },
                manual_refs=["通过曼陀罗解读，我们就可以知道案主内心的冲突点、卡点、堵点。", "爆破卡点：找到根源性事件"],
            ),
            self._manual_stage(
                "stage-09-healing-goal",
                "建立调节目标",
                "只有在判断成立后才给方向；Lite 给轻量觉察，Pro 给更完整的行动/清理/调节路径。",
                {
                    "lite_healing_guidance": structured.get("lite_healing_guidance", {}),
                    "pro_healing_plan": structured.get("healing_plan", {}),
                    "final_healing_block": self._final_block_excerpt(
                        product_blocks,
                        version,
                        "lite_healing_guidance" if version == "lite" else "healing_plan",
                    ),
                },
                manual_refs=["用曼陀罗疗愈与案主建立共同目标", "清理情绪", "定制方案"],
            ),
            self._manual_stage(
                "stage-10-lite-draft",
                "Lite 过程稿",
                "Lite 仍可使用上一版优化后的自然表达，但必须从前面证据链映射到字段。",
                knowledge_projections.get("lite", {}) if isinstance(knowledge_projections.get("lite"), dict) else {},
                manual_refs=["解读句式：从你的曼陀罗中，可以看出...；因为..."],
            ),
            self._manual_stage(
                "stage-11-pro-draft",
                "Pro 过程稿",
                "Pro 不是 Lite 加长版，而是在同一手册逻辑上展开机制、根因链和调节方案。",
                knowledge_projections.get("pro", {}) if isinstance(knowledge_projections.get("pro"), dict) else {},
                manual_refs=["个案六大流程：确定目标、爆破卡点、清理情绪、定制方案"],
            ),
            self._manual_stage(
                "stage-12-final-report",
                "最终报告",
                "最终呈现可以是自然报告文案，但 QA 必须能从最终字段倒查到上面的手册推导链。",
                {
                    "version": version,
                    "title": report.get("title"),
                    "structured_fields": sorted(structured.keys()),
                    "report_excerpt": self._excerpt(self._strip_safety_wrappers(report.get("report")), limit=500),
                },
                manual_refs=["最终呈现：用曼陀罗作为桥梁，持续沟通并给出后续方向"],
            ),
        ]
        return self._sanitize_export_value(
            {
                "source_of_truth": self.ORIGINAL_INTERPRETATION_MANUAL,
                "manual_logic_version": "three-circle-five-element-flow.v1",
                "fixture_id": fixture.get("id"),
                "version": version,
                "stage_ids": self.MANUAL_PROCESS_STAGE_IDS,
                "stages": stages,
                "qa_rule": "QA 输出必须同时保留最终报告和以上每个中间过程版本；最终文案可沿用优化表达，但推导逻辑必须可回到原始解读手册。",
            }
        )

    def _manual_stage(
        self,
        stage_id: str,
        label: str,
        summary: str,
        payload: Any,
        *,
        manual_refs: list[str],
    ) -> dict[str, Any]:
        return {
            "id": stage_id,
            "label": label,
            "manual_source": self.ORIGINAL_INTERPRETATION_MANUAL,
            "manual_refs": manual_refs,
            "summary": summary,
            "payload": payload,
        }

    def _build_export_manual_process_markdown(
        self,
        *,
        fixture: dict[str, Any],
        process_trace: dict[str, Any],
    ) -> str:
        lines = [
            f"# Manual Process Trace: {fixture.get('id')} / {process_trace.get('version')}",
            "",
            f"- 原始手册：`{process_trace.get('source_of_truth')}`",
            f"- 过程版本：`{process_trace.get('manual_logic_version')}`",
            f"- QA 规则：{process_trace.get('qa_rule')}",
            "",
            "## 中间过程版本",
            "",
        ]
        for stage in process_trace.get("stages", []):
            if not isinstance(stage, dict):
                continue
            lines.extend(
                [
                    f"### {stage.get('id')} {stage.get('label')}",
                    "",
                    f"- 手册依据：{'；'.join(str(item) for item in stage.get('manual_refs', []))}",
                    f"- 过程摘要：{stage.get('summary')}",
                    "",
                    "```json",
                    json.dumps(stage.get("payload", {}), ensure_ascii=False, indent=2),
                    "```",
                    "",
                ]
            )
        return "\n".join(lines).strip() + "\n"

    def _final_block_excerpt(
        self,
        product_blocks: dict[str, Any],
        version: str,
        field: str,
    ) -> Any:
        mode = "pro" if version == "pro" else "lite"
        mode_blocks = product_blocks.get(mode, {}) if isinstance(product_blocks, dict) else {}
        block = mode_blocks.get(field, {}) if isinstance(mode_blocks, dict) else {}
        final = block.get("final") if isinstance(block, dict) else None
        if isinstance(final, str):
            return self._excerpt(final, limit=500) or ""
        return final

    def _dig(self, payload: Any, path: list[str]) -> Any:
        current = payload
        for key in path:
            if not isinstance(current, dict):
                return None
            current = current.get(key)
        return current

    def _strip_safety_wrappers(self, value: Any) -> Any:
        if not isinstance(value, str):
            return value
        return ReportSafetyWrapper().strip_wrappers(value)

    def _golden_field_labels(self, version: str) -> list[tuple[str, str]]:
        if version == "pro":
            return [
                ("topic_context", "当前议题"),
                ("deep_impression", "深度第一印象"),
                ("evidence_digest", "证据摘要"),
                ("imbalance_diagnosis", "失衡诊断"),
                ("root_cause_chain", "根因链"),
                ("deep_structure_interpretation", "深层结构解读"),
                ("healing_plan", "疗愈方案"),
            ]
        return [
            ("topic_context", "当前议题"),
            ("current_reading", "当前整体判断"),
            ("visual_basis", "画面依据"),
            ("pattern_interpretation", "模式解释"),
            ("life_connection", "现实连接"),
            ("lite_healing_guidance", "轻量疗愈"),
            ("pro_report_entry", "更深报告入口"),
        ]

    def _render_markdown_value(self, value: Any) -> str:
        if value in (None, "", [], {}):
            return ""
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, list):
            rendered_items = [self._render_markdown_value(item) for item in value]
            rendered_items = [item for item in rendered_items if item]
            return "\n".join(f"- {item}" for item in rendered_items)
        if isinstance(value, dict):
            lines: list[str] = []
            for key, item in value.items():
                if key in {"prompt_preview", "prompt_schema_validation_issues"}:
                    continue
                label = self._humanize_key(str(key))
                rendered = self._render_markdown_value(item)
                if not rendered:
                    continue
                if "\n" in rendered:
                    lines.append(f"**{label}**")
                    lines.append(rendered)
                else:
                    lines.append(f"**{label}**：{rendered}")
            return "\n".join(lines)
        return str(value).strip()

    def _humanize_key(self, key: str) -> str:
        mapping = {
            "topic": "议题",
            "topic_label": "议题标签",
            "report_mode": "报告模式",
            "intro": "导语",
            "focus": "关注点",
            "key_terms": "辅助概念",
            "directions": "调节方向",
            "micro_practices": "小练习",
            "title": "标题",
            "summary": "摘要",
            "product_note": "产品说明",
            "term": "术语",
            "explanation": "解释",
            "content": "内容",
        }
        return mapping.get(key, key.replace("_", " ").strip())

    def _load_golden_review_result(
        self,
        *,
        fixture_id: str,
        version: str,
        golden_review_root: Path | None,
    ) -> dict[str, Any]:
        if not fixture_id:
            return {"reviewed": False}
        base_root = golden_review_root or self.golden_root
        review_path = base_root / fixture_id / f"{version}.review.md"
        if not review_path.exists():
            return {"reviewed": False}
        metadata = self._parse_markdown_frontmatter(review_path)
        result = str(metadata.get("result") or "").strip()
        deviation_count = int(metadata.get("deviation_count") or 0)
        return {
            "reviewed": bool(result),
            "result": result,
            "deviation_count": deviation_count,
            "review_path": self._to_repo_relative(review_path),
        }

    def _collect_golden_review_results(
        self,
        golden_review_root: Path | None,
    ) -> list[dict[str, Any]]:
        base_root = golden_review_root or self.golden_root
        if not base_root.exists():
            return []
        results: list[dict[str, Any]] = []
        for review_path in sorted(base_root.glob("*/*.review.md")):
            metadata = self._parse_markdown_frontmatter(review_path)
            result = str(metadata.get("result") or "").strip()
            if not result:
                continue
            results.append(
                {
                    "reviewed": True,
                    "fixture_id": str(metadata.get("fixture_id") or review_path.parent.name),
                    "mode": str(metadata.get("mode") or review_path.name.split(".", 1)[0]),
                    "topic": str(metadata.get("topic") or ""),
                    "result": result,
                    "deviation_count": int(metadata.get("deviation_count") or 0),
                    "review_path": self._to_repo_relative(review_path),
                }
            )
        return results

    def _parse_markdown_frontmatter(self, path: Path) -> dict[str, Any]:
        text = path.read_text(encoding="utf-8")
        if not text.startswith("---\n"):
            return {}
        parts = text.split("\n---\n", 1)
        if len(parts) != 2:
            return {}
        payload = yaml.safe_load(parts[0][4:]) or {}
        return payload if isinstance(payload, dict) else {}

    def _sanitize_export_value(self, value: Any) -> Any:
        if isinstance(value, dict):
            return {
                key: self._sanitize_export_value(item)
                for key, item in value.items()
            }
        if isinstance(value, list):
            return [self._sanitize_export_value(item) for item in value]
        if isinstance(value, str):
            return self._sanitize_export_string(value)
        return value

    def _sanitize_export_string(self, value: str) -> str:
        compact = value.strip()
        if not compact:
            return value
        project_prefix = str(self.project_root.resolve())
        if project_prefix in value:
            return value.replace(project_prefix + "/", "")
        return value

    def _to_repo_relative(self, path: Path) -> str:
        resolved = path.resolve()
        try:
            return str(resolved.relative_to(self.project_root))
        except ValueError:
            return str(resolved)

    def _build_three_circle_override(self, input_payload: dict[str, Any]) -> dict[str, int]:
        inner = input_payload.get("inner_radius")
        middle = input_payload.get("middle_radius")
        if inner is None or middle is None:
            return {
                "inner_radius": 35,
                "middle_radius": 67,
            }
        return {
            "inner_radius": int(inner),
            "middle_radius": int(middle),
        }

    def _read_structured_field(self, structured: dict[str, Any], field: str) -> Any:
        if field in structured:
            return structured.get(field)
        if "." not in field:
            return structured.get(field)
        current: Any = structured
        for part in field.split("."):
            if not isinstance(current, dict):
                return None
            current = current.get(part)
        return current

    def _resolve_path(self, raw_path: Any) -> Path:
        path = Path(str(raw_path))
        if path.is_absolute():
            if path.exists():
                return path
            parts = path.parts
            project_anchor = ("projects", "aimandala")
            for index in range(len(parts) - 1):
                if tuple(parts[index : index + 2]) == project_anchor:
                    remapped = (self.project_root / Path(*parts[index + 2 :])).resolve()
                    if remapped.exists():
                        return remapped
            return path
        return (self.project_root / path).resolve()

    def _apply_layer0_overrides(self, record: Any, execution: dict[str, Any]) -> None:
        layer0 = getattr(record, "layer_0_raw", None)
        if layer0 is None:
            return
        override_imbalances = execution.get("override_imbalance_candidates", [])
        if isinstance(override_imbalances, list) and override_imbalances:
            normalized = [
                str(item).strip()
                for item in override_imbalances
                if isinstance(item, str) and str(item).strip()
            ]
            if normalized:
                layer0.imbalance_candidates = normalized
                layer0.rule_evaluations["imbalance_candidates"] = normalized
                layer0.rule_evaluations["primary_candidates"] = normalized
                trace = layer0.rule_evaluations.get("imbalance_trace", {})
                trace["primary_candidates"] = [
                    {
                        "id": imbalance_id,
                        "category": "override",
                        "toc_supported": True,
                        "score": 1.0,
                        "selected_for_primary": True,
                        "reason_codes": ["override_imbalance_candidates"],
                        "decision": "override",
                        "warning": None,
                    }
                    for imbalance_id in normalized
                ]
                existing_all = trace.get("all_candidates", [])
                if isinstance(existing_all, list):
                    for item in existing_all:
                        if not isinstance(item, dict):
                            continue
                        item["selected_for_primary"] = str(item.get("id") or "") in normalized
                        if item["selected_for_primary"]:
                            item["decision"] = "override"
                if "transition-overload" in normalized:
                    trace["synthetic_signal"] = {
                        "id": "transition-overload",
                        "used": True,
                        "reason": "override_imbalance_candidates",
                    }
                else:
                    trace["synthetic_signal"] = {
                        "id": "transition-overload",
                        "used": False,
                        "reason": "",
                    }
                layer0.rule_evaluations["imbalance_trace"] = trace
                layer0.rule_evaluations["synthetic_signal"] = trace["synthetic_signal"]
                existing_flags = list(getattr(layer0, "fidelity_flags", []) or [])
                for imbalance_id in normalized:
                    existing_flags.append(f"warning:{imbalance_id}")
                layer0.fidelity_flags = list(dict.fromkeys(existing_flags))
                if layer0.fallback_summary.get("used") and "generated" not in (
                    layer0.fallback_summary.get("levels", []) or []
                ):
                    layer0.fallback_summary["levels"] = [
                        *layer0.fallback_summary.get("levels", []),
                        "generated",
                    ]

    def _dict_delta(self, base: dict[str, Any], target: dict[str, Any]) -> dict[str, Any]:
        result = {}
        keys = sorted(set(base.keys()) | set(target.keys()))
        for key in keys:
            if base.get(key) != target.get(key):
                result[key] = {"base": base.get(key), "target": target.get(key)}
        return result

    def _added_items(
        self,
        base_items: list[dict[str, Any]],
        target_items: list[dict[str, Any]],
        *,
        key_fields: list[str],
    ) -> list[dict[str, Any]]:
        base_keys = {
            tuple(item.get(field) for field in key_fields)
            for item in base_items
            if isinstance(item, dict)
        }
        return [
            item
            for item in target_items
            if isinstance(item, dict)
            and tuple(item.get(field) for field in key_fields) not in base_keys
        ]

    def _excerpt(self, value: Any, limit: int = 180) -> str | None:
        if not isinstance(value, str):
            return None
        compact = value.strip()
        if not compact:
            return None
        if len(compact) <= limit:
            return compact
        return f"{compact[:limit]}..."

    def _now_iso(self) -> str:
        from datetime import datetime

        return datetime.now().isoformat()
