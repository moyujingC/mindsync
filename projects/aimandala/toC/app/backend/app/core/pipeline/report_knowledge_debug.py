"""Knowledge-focused debug blocks for report tracing and workbench views."""

from __future__ import annotations

from typing import Any, Callable

from app.core.knowledge_runtime.contracts import QueryResult

from .data_models import InterpretationRecord


class KnowledgeDebugBlockBuilder:
    """Build structured knowledge debug payloads for one interpretation."""

    FIELD_QUERY_MAP = {
        "title": ["theme", "narrative"],
        "overall_impression": [
            "theme",
            "imbalance.primary",
            "circles.inner",
            "circles.middle",
            "circles.outer",
        ],
        "visual_elements_rendered": ["theme", "circles.inner", "circles.middle", "circles.outer"],
        "emotion_portrait_rendered": ["theme", "imbalance.primary", "narrative"],
        "pro_teaser": ["narrative", "theme"],
        "first_impression": ["imbalance.primary", "narrative", "theme"],
        "core_insight_table": ["theme", "imbalance.primary", "circles.inner", "circles.middle", "circles.outer"],
        "root_cause": ["imbalance.primary", "theme", "narrative"],
        "healing_suggestions": ["healing", "imbalance.primary", "narrative"],
        "full_report_markdown": [
            "theme",
            "imbalance.primary",
            "healing",
            "narrative",
            "circles.inner",
            "circles.middle",
            "circles.outer",
        ],
    }

    def __init__(
        self,
        *,
        get_knowledge_runtime: Callable[[], Any],
        get_primary_knowledge_signal: Callable[[InterpretationRecord], str],
    ) -> None:
        self._get_knowledge_runtime = get_knowledge_runtime
        self._get_primary_knowledge_signal = get_primary_knowledge_signal

    def build(self, record: InterpretationRecord) -> dict[str, Any]:
        runtime = self._get_knowledge_runtime()
        layer0 = record.layer_0_raw.to_dict() if record.layer_0_raw else {}
        if runtime is None:
            return {
                "build_info": {},
                "layer0_evidence": self._build_layer0_evidence(layer0),
                "query_results": {},
                "fallback_analysis": {
                    "used": bool(layer0.get("fallback_summary", {}).get("used")),
                    "levels": layer0.get("fallback_summary", {}).get("levels", []),
                    "warnings": layer0.get("fallback_summary", {}).get("warnings", []),
                    "quality_flags": layer0.get("quality_flags", []),
                    "query_fallbacks": [],
                },
                "warning_analysis": {
                    "warning_hits": [],
                    "active_warning_paths": [],
                },
                "source_refs": [],
                "field_to_knowledge_map": {},
            }

        repository = runtime.repository
        build_info = repository.get_build_info()
        source_refs: dict[str, dict[str, Any]] = {}

        theme_result = runtime.theme_service.query_theme(record.theme)
        circle_results = self._build_circle_results(runtime, record)
        imbalance_results = self._build_imbalance_results(runtime, record)
        primary_signal = self._get_primary_knowledge_signal(record)
        primary_imbalance = imbalance_results[0] if imbalance_results else self._empty_query_result(
            message="no imbalance candidate",
            entity_id="imbalance.none",
        )
        healing_result = (
            runtime.healing_service.get_healing_plan(primary_signal, record.theme)
            if primary_signal
            else self._empty_query_result("no healing candidate", "healing.none")
        )
        narrative_result = runtime.narrative_service.query_narrative(record.theme)

        query_results = {
            "theme": theme_result.to_dict(),
            "circles": {key: result.to_dict() for key, result in circle_results.items()},
            "imbalance": {
                "primary": primary_imbalance.to_dict(),
                "candidates": [result.to_dict() for result in imbalance_results],
            },
            "healing": healing_result.to_dict(),
            "narrative": narrative_result.to_dict(),
        }

        flattened_results = {
            "theme": theme_result,
            "healing": healing_result,
            "narrative": narrative_result,
            "imbalance.primary": primary_imbalance,
            **{f"circles.{key}": value for key, value in circle_results.items()},
        }
        for result in imbalance_results:
            flattened_results[f"imbalance.{result.entity_id}"] = result

        fallback_analysis = self._build_fallback_analysis(
            layer0=layer0,
            query_results=flattened_results,
        )
        warning_analysis = self._build_warning_analysis(
            layer0=layer0,
            runtime=runtime,
            imbalance_results=imbalance_results,
        )
        field_to_knowledge_map = self._build_field_to_knowledge_map(
            query_results=flattened_results,
            source_refs=source_refs,
            pack_root=repository.compiler.pack_root,
        )
        source_refs_list = self._collect_source_refs(
            query_results=flattened_results,
            source_refs=source_refs,
            pack_root=repository.compiler.pack_root,
        )

        return {
            "build_info": {
                **build_info,
                "manifest_path": str(repository.compiler.pack_root / "manifest.yaml"),
                "build_kind": build_info.get("build_source"),
            },
            "layer0_evidence": self._build_layer0_evidence(layer0),
            "query_results": query_results,
            "fallback_analysis": fallback_analysis,
            "warning_analysis": warning_analysis,
            "source_refs": source_refs_list,
            "field_to_knowledge_map": field_to_knowledge_map,
        }

    def _build_layer0_evidence(self, layer0: dict[str, Any]) -> dict[str, Any]:
        return {
            "visual_facts": layer0.get("visual_facts", {}),
            "knowledge_hits": layer0.get("knowledge_hits", {}),
            "rule_evaluations": layer0.get("rule_evaluations", {}),
            "theme_projection": layer0.get("theme_projection", {}),
            "imbalance_candidates": layer0.get("imbalance_candidates", []),
            "quality_flags": layer0.get("quality_flags", []),
            "fallback_summary": layer0.get("fallback_summary", {}),
        }

    def _build_circle_results(
        self,
        runtime: Any,
        record: InterpretationRecord,
    ) -> dict[str, QueryResult]:
        layer0 = getattr(record, "layer_0_raw", None)
        if layer0 is None:
            return {}

        circles = {
            "inner": ("内圈", layer0.three_circles.inner.get("dominant", "")),
            "middle": ("中圈", layer0.three_circles.middle.get("dominant", "")),
            "outer": ("外圈", layer0.three_circles.outer.get("dominant", "")),
        }
        results: dict[str, QueryResult] = {}
        for key, (label, dominant) in circles.items():
            if not dominant:
                continue
            results[key] = runtime.circle_service.get_circle_interpretation(
                label,
                dominant,
                theme=record.theme,
            )
        return results

    def _build_imbalance_results(
        self,
        runtime: Any,
        record: InterpretationRecord,
    ) -> list[QueryResult]:
        layer0 = getattr(record, "layer_0_raw", None)
        candidates = getattr(layer0, "imbalance_candidates", []) if layer0 else []
        return [
            runtime.imbalance_service.get_imbalance_detail(imbalance_id)
            for imbalance_id in candidates
            if isinstance(imbalance_id, str) and imbalance_id.strip()
        ]

    def _build_fallback_analysis(
        self,
        *,
        layer0: dict[str, Any],
        query_results: dict[str, QueryResult],
    ) -> dict[str, Any]:
        levels = set(layer0.get("fallback_summary", {}).get("levels", []) or [])
        warnings = list(layer0.get("fallback_summary", {}).get("warnings", []) or [])
        query_fallbacks = []
        for query_key, result in query_results.items():
            if result.fallback_level == "none":
                continue
            levels.add(result.fallback_level)
            warnings.extend(result.warnings)
            query_fallbacks.append(
                {
                    "query_key": query_key,
                    "entity_id": result.entity_id,
                    "fallback_level": result.fallback_level,
                    "warnings": result.warnings,
                }
            )
        return {
            "used": bool(layer0.get("fallback_summary", {}).get("used")) or bool(query_fallbacks),
            "levels": sorted(item for item in levels if item),
            "warnings": self._unique_list(warnings),
            "quality_flags": layer0.get("quality_flags", []),
            "query_fallbacks": query_fallbacks,
        }

    def _build_warning_analysis(
        self,
        *,
        layer0: dict[str, Any],
        runtime: Any,
        imbalance_results: list[QueryResult],
    ) -> dict[str, Any]:
        index = runtime.repository.load_index()
        warning_paths = (
            index.get("stats", {})
            .get("quality", {})
            .get("high_risk_warning_paths", [])
        )
        candidate_ids = {
            str(item)
            for item in layer0.get("imbalance_candidates", [])
            if isinstance(item, str) and item.strip()
        }
        warning_hits = []
        for result in imbalance_results:
            value = result.value if isinstance(result.value, dict) else {}
            warning = str(value.get("warning") or "").strip()
            if not warning:
                continue
            warning_hits.append(
                {
                    "imbalance_id": value.get("type") or result.entity_id.replace("imbalance.", ""),
                    "warning": warning,
                }
            )
        active_warning_paths = [
            item
            for item in warning_paths
            if str(item.get("imbalance_id") or "") in candidate_ids
        ]
        return {
            "warning_hits": warning_hits,
            "active_warning_paths": active_warning_paths,
        }

    def _build_field_to_knowledge_map(
        self,
        *,
        query_results: dict[str, QueryResult],
        source_refs: dict[str, dict[str, Any]],
        pack_root: Any,
    ) -> dict[str, Any]:
        mapping: dict[str, Any] = {}
        for field, query_keys in self.FIELD_QUERY_MAP.items():
            entity_ids: list[str] = []
            source_paths: list[str] = []
            warnings: list[str] = []
            for query_key in query_keys:
                result = query_results.get(query_key)
                if result is None:
                    continue
                if result.entity_id:
                    entity_ids.append(result.entity_id)
                warnings.extend(result.warnings)
                for evidence in result.evidence:
                    if not isinstance(evidence, dict):
                        continue
                    source_path = str(evidence.get("source_path") or "").strip()
                    if not source_path:
                        continue
                    source_paths.append(source_path)
                    ref_id = f"{evidence.get('entity_id', result.entity_id)}::{source_path}"
                    if ref_id not in source_refs:
                        source_refs[ref_id] = self._build_source_ref(
                            evidence=evidence,
                            source_path=source_path,
                            pack_root=pack_root,
                            query_key=query_key,
                        )
                    else:
                        source_refs[ref_id]["query_keys"] = self._unique_list(
                            [*source_refs[ref_id].get("query_keys", []), query_key]
                        )
            mapping[field] = {
                "query_keys": query_keys,
                "entity_ids": self._unique_list(entity_ids),
                "source_paths": self._unique_list(source_paths),
                "warnings": self._unique_list(warnings),
            }
        return mapping

    def _collect_source_refs(
        self,
        *,
        query_results: dict[str, QueryResult],
        source_refs: dict[str, dict[str, Any]],
        pack_root: Any,
    ) -> list[dict[str, Any]]:
        if not source_refs:
            for query_key, result in query_results.items():
                for evidence in result.evidence:
                    if not isinstance(evidence, dict):
                        continue
                    source_path = str(evidence.get("source_path") or "").strip()
                    if not source_path:
                        continue
                    ref_id = f"{evidence.get('entity_id', result.entity_id)}::{source_path}"
                    source_refs[ref_id] = self._build_source_ref(
                        evidence=evidence,
                        source_path=source_path,
                        pack_root=pack_root,
                        query_key=query_key,
                    )
        return sorted(
            source_refs.values(),
            key=lambda item: (str(item.get("source_path")), str(item.get("entity_id"))),
        )

    def _build_source_ref(
        self,
        *,
        evidence: dict[str, Any],
        source_path: str,
        pack_root: Any,
        query_key: str,
    ) -> dict[str, Any]:
        absolute_path = ""
        if pack_root is not None:
            absolute_path = str(pack_root / source_path)
        return {
            "entity_id": evidence.get("entity_id", ""),
            "kind": evidence.get("kind", ""),
            "source_path": source_path,
            "absolute_path": absolute_path,
            "query_keys": [query_key],
        }

    def _empty_query_result(self, message: str, entity_id: str) -> QueryResult:
        return QueryResult.not_found(message, entity_id=entity_id)

    def _unique_list(self, items: list[Any]) -> list[Any]:
        return list(dict.fromkeys(item for item in items if item not in (None, "", [])))
