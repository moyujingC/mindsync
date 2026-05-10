"""Stage-based knowledge debug blocks for report tracing."""

from __future__ import annotations

from typing import Any, Callable

from app.core.knowledge_runtime.contracts import QueryResult

from .data_models import InterpretationRecord


class KnowledgeDebugBlockBuilder:
    """Build debug payloads from stage deliverables and runtime knowledge queries."""

    FIELD_QUERY_MAP = {
        "title": ["theme"],
        "current_reading": ["theme", "imbalance.primary", "circles.inner", "circles.middle", "circles.outer"],
        "visual_basis": ["circles.inner", "circles.middle", "circles.outer"],
        "pattern_interpretation": ["theme", "imbalance.primary", "narrative"],
        "life_connection": ["theme", "narrative"],
        "lite_healing_guidance": ["theme", "healing", "narrative"],
        "deep_impression": ["imbalance.primary", "narrative", "theme"],
        "evidence_digest": ["theme", "imbalance.primary", "circles.inner", "circles.middle", "circles.outer"],
        "imbalance_diagnosis": ["imbalance.primary", "theme"],
        "root_cause_chain": ["imbalance.primary", "theme", "narrative"],
        "healing_plan": ["healing", "imbalance.primary", "narrative"],
    }

    def __init__(
        self,
        *,
        get_knowledge_runtime: Callable[[], Any],
        get_primary_knowledge_signal: Callable[[InterpretationRecord], str],
    ) -> None:
        self._get_knowledge_runtime = get_knowledge_runtime
        self._get_primary_knowledge_signal = get_primary_knowledge_signal

    def build(
        self,
        record: InterpretationRecord,
        *,
        report_mode: str = "all",
    ) -> dict[str, Any]:
        runtime = self._get_knowledge_runtime()
        stage_payload = self._stage_payload(record)
        source_refs: dict[str, dict[str, Any]] = {}
        input_package = self._build_input_package(record, stage_payload)
        stage_summary = self._build_stage_summary(stage_payload)
        model_trace = self._build_model_trace(stage_payload)

        if runtime is None:
            return {
                "build_info": {},
                "stage_process_evidence": stage_summary,
                "model_trace": model_trace,
                "input_package": input_package,
                "review_input_package": input_package,
                "review_stage_summary": stage_summary,
                "report_draft_sections": self._build_report_draft_sections(record),
                "topic_context_trace": self._build_topic_context_trace(record, stage_payload),
                "product_block_debug": self._build_product_block_debug(
                    record=record,
                    stage_payload=stage_payload,
                    field_to_knowledge_map={},
                ),
                "review_mapping_summary": {},
                "query_results": {},
                "fallback_analysis": {
                    "used": False,
                    "levels": [],
                    "warnings": [],
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
        theme_result = runtime.theme_service.query_theme(record.theme)
        circle_results = self._build_circle_results(runtime, record, stage_payload)
        imbalance_results = self._build_imbalance_results(runtime, record, stage_payload)
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
            "stage_process_evidence": stage_summary,
            "model_trace": model_trace,
            "input_package": input_package,
            "review_input_package": input_package,
            "review_stage_summary": stage_summary,
            "report_draft_sections": self._build_report_draft_sections(record),
            "topic_context_trace": self._build_topic_context_trace(record, stage_payload),
            "product_block_debug": self._build_product_block_debug(
                record=record,
                stage_payload=stage_payload,
                field_to_knowledge_map=field_to_knowledge_map,
            ),
            "review_mapping_summary": self._build_review_mapping_summary(
                record,
                stage_payload,
                field_to_knowledge_map,
            ),
            "query_results": query_results,
            "fallback_analysis": self._build_fallback_analysis(flattened_results),
            "warning_analysis": self._build_warning_analysis(runtime, imbalance_results),
            "source_refs": source_refs_list,
            "field_to_knowledge_map": field_to_knowledge_map,
        }

    def _stage_payload(self, record: InterpretationRecord) -> dict[str, Any]:
        package = getattr(record, "stage_process_package", None)
        payload = getattr(package, "payload", None)
        return payload if isinstance(payload, dict) else {}

    def _stage(self, stage_payload: dict[str, Any], key: str) -> dict[str, Any]:
        value = stage_payload.get(key, {})
        return value if isinstance(value, dict) else {}

    def _build_model_trace(self, stage_payload: dict[str, Any]) -> dict[str, Any]:
        contract = self._stage(stage_payload, "process_contract")
        trace = contract.get("model_trace", {}) if isinstance(contract, dict) else {}
        if not isinstance(trace, dict):
            trace = {}
        return {
            "generation_mode": contract.get("generation_mode", "stage_based_runtime"),
            "target_report": contract.get("target_report", ""),
            "chat": trace.get("chat_by_mode", {}) if isinstance(trace.get("chat_by_mode"), dict) else {},
        }

    def _build_input_package(
        self,
        record: InterpretationRecord,
        stage_payload: dict[str, Any],
    ) -> dict[str, Any]:
        stage01 = self._stage(stage_payload, "stage-01-user-input-context")
        stage02 = self._stage(stage_payload, "stage-02-circle-boundary-decision")
        return {
            "image": stage01.get("image_ref", {"image_ref": self._record_image_ref(record)}),
            "topic_input": {
                "topic": getattr(record, "theme", None) or "general",
                "topic_label": stage01.get("theme_label") or self._topic_label(getattr(record, "theme", None)),
            },
            "user_context": {
                "painting_intention": getattr(record, "painting_intention", None) or "",
                "painting_feeling": getattr(record, "painting_feeling", None) or "",
            },
            "circle_config": {
                "inner_radius": stage02.get("inner_middle_radius"),
                "middle_radius": stage02.get("middle_outer_radius"),
                "source": stage02.get("boundary_source", self._resolve_three_circles_source(record)),
            },
        }

    def _build_stage_summary(self, stage_payload: dict[str, Any]) -> dict[str, Any]:
        if not stage_payload:
            return {"stage_count": 0, "stages": {}}
        stages = {
            key: self._summarize_stage_value(value)
            for key, value in stage_payload.items()
            if str(key).startswith("stage-")
        }
        return {
            "stage_count": len(stages),
            "process_contract": stage_payload.get("process_contract", {}),
            "stages": stages,
        }

    def _summarize_stage_value(self, value: Any) -> dict[str, Any]:
        if not isinstance(value, dict):
            return {"type": type(value).__name__}
        summary: dict[str, Any] = {
            "status": value.get("status", "done"),
            "keys": sorted(str(key) for key in value.keys())[:24],
        }
        refs = value.get("knowledge_refs") or value.get("evidence_refs")
        if isinstance(refs, list):
            summary["ref_count"] = len(refs)
        return summary

    def _build_topic_context_trace(
        self,
        record: InterpretationRecord,
        stage_payload: dict[str, Any],
    ) -> dict[str, Any]:
        theme = getattr(record, "theme", None) or "general"
        return {
            "topic": theme,
            "report_modes": list(getattr(record, "version_purchased", []) or []),
            "knowledge_route": "general" if theme == "general" else "theme_specific",
            "stage_process_package_present": bool(stage_payload),
        }

    def _build_report_draft_sections(self, record: InterpretationRecord) -> dict[str, Any]:
        lite_plan: dict[str, Any] = {}
        if record.layer_1_lite_draft is not None:
            lite_plan = {
                "title": record.layer_1_lite_draft.title,
                "overall_impression": record.layer_1_lite_draft.overall_impression,
                "visual_elements": record.layer_1_lite_draft.visual_elements,
                "emotion_portrait": record.layer_1_lite_draft.emotion_portrait,
            }
        pro_plan: dict[str, Any] = {}
        if record.layer_3_pro_draft is not None:
            pro_plan = {
                "first_impression": record.layer_3_pro_draft.first_impression,
                "core_insight_table": record.layer_3_pro_draft.core_insight_table,
                "three_circles_detailed": record.layer_3_pro_draft.three_circles_detailed,
                "imbalance_confirmed": record.layer_3_pro_draft.imbalance_confirmed,
                "root_cause": record.layer_3_pro_draft.root_cause,
                "healing_suggestions": record.layer_3_pro_draft.healing_suggestions,
            }
        return {"lite": lite_plan, "pro": pro_plan}

    def _build_product_block_debug(
        self,
        *,
        record: InterpretationRecord,
        stage_payload: dict[str, Any],
        field_to_knowledge_map: dict[str, Any],
    ) -> dict[str, Any]:
        lite_final = record.layer_2_lite_final
        pro_draft = record.layer_3_pro_draft
        return {
            "lite": {
                "current_reading": self._product_block(
                    final=lite_final.overall_impression if lite_final else "",
                    field_key="current_reading",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-10-core-thesis-selection", "stage-11-user-facing-framing"],
                ),
                "visual_basis": self._product_block(
                    final=lite_final.visual_elements_rendered if lite_final else "",
                    field_key="visual_basis",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-03-visual-evidence"],
                ),
                "pattern_interpretation": self._product_block(
                    final=self._join_text([
                        lite_final.emotion_portrait_rendered if lite_final else "",
                        lite_final.story.pattern.content if lite_final else "",
                    ]),
                    field_key="pattern_interpretation",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-07-per-circle-imbalance-patterns", "stage-08-energy-flow-diagnosis"],
                ),
                "life_connection": self._product_block(
                    final=self._join_text([
                        lite_final.theme_insights.scene if lite_final else "",
                        lite_final.theme_insights.impact if lite_final else "",
                        lite_final.theme_insights.awareness if lite_final else "",
                    ]),
                    field_key="life_connection",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-06-per-circle-element-generation-control", "stage-11-user-facing-framing"],
                ),
            },
            "pro": {
                "deep_impression": self._product_block(
                    final=pro_draft.first_impression if pro_draft else "",
                    field_key="deep_impression",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-10-core-thesis-selection"],
                ),
                "evidence_digest": self._product_block(
                    final=pro_draft.three_circles_detailed if pro_draft else {},
                    field_key="evidence_digest",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-03-visual-evidence", "stage-09-evidence-consolidation"],
                ),
                "imbalance_diagnosis": self._product_block(
                    final=pro_draft.imbalance_confirmed if pro_draft else {},
                    field_key="imbalance_diagnosis",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-07-per-circle-imbalance-patterns"],
                ),
                "root_cause_chain": self._product_block(
                    final=pro_draft.root_cause if pro_draft else {},
                    field_key="root_cause_chain",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-12-healing-direction-and-report-branching"],
                ),
                "healing_plan": self._product_block(
                    final=pro_draft.healing_suggestions if pro_draft else [],
                    field_key="healing_plan",
                    field_to_knowledge_map=field_to_knowledge_map,
                    stage_refs=["stage-12-healing-direction-and-report-branching"],
                ),
            },
            "stage_status": self._build_stage_summary(stage_payload),
        }

    def _product_block(
        self,
        *,
        final: Any,
        field_key: str,
        field_to_knowledge_map: dict[str, Any],
        stage_refs: list[str],
    ) -> dict[str, Any]:
        evidence = field_to_knowledge_map.get(field_key, {})
        return {
            "final": final,
            "evidence_trace": {
                "stage_refs": stage_refs,
                "knowledge_hit_refs": evidence.get("entity_ids", []) if isinstance(evidence, dict) else [],
                "source_paths": evidence.get("source_paths", []) if isinstance(evidence, dict) else [],
            },
            "prompt_trace": {
                "schema_field": field_key,
                "input_contract": "stage_process_package",
            },
            "quality_trace": {
                "warnings": evidence.get("warnings", []) if isinstance(evidence, dict) else [],
            },
        }

    def _build_review_mapping_summary(
        self,
        record: InterpretationRecord,
        stage_payload: dict[str, Any],
        field_to_knowledge_map: dict[str, Any],
    ) -> dict[str, Any]:
        blocks = self._build_product_block_debug(
            record=record,
            stage_payload=stage_payload,
            field_to_knowledge_map=field_to_knowledge_map,
        )
        return {
            "lite_blocks": self._to_review_block_map(blocks.get("lite", {})),
            "pro_blocks": self._to_review_block_map(blocks.get("pro", {})),
        }

    def _to_review_block_map(self, blocks: Any) -> dict[str, Any]:
        if not isinstance(blocks, dict):
            return {}
        result: dict[str, Any] = {}
        for key, block in blocks.items():
            if not isinstance(block, dict):
                continue
            result[key] = {
                "final_excerpt": block.get("final"),
                "evidence_trace_refs": block.get("evidence_trace", {}),
            }
        return result

    def _build_circle_results(
        self,
        runtime: Any,
        record: InterpretationRecord,
        stage_payload: dict[str, Any],
    ) -> dict[str, QueryResult]:
        stage05 = self._stage(stage_payload, "stage-05-per-circle-color-shape-element-sensing")
        circle_results = stage05.get("circle_results", [])
        results: dict[str, QueryResult] = {}
        if not isinstance(circle_results, list):
            return results
        for item in circle_results:
            if not isinstance(item, dict):
                continue
            circle_key = str(item.get("circle") or item.get("circle_key") or "").strip()
            element = str(item.get("dominant_element") or item.get("element") or "").strip()
            if not circle_key or not element:
                continue
            label = {"inner": "内圈", "middle": "中圈", "outer": "外圈"}.get(circle_key, circle_key)
            try:
                results[circle_key] = runtime.circle_service.get_circle_interpretation(
                    label,
                    element,
                    theme=record.theme,
                )
            except Exception:
                continue
        return results

    def _build_imbalance_results(
        self,
        runtime: Any,
        record: InterpretationRecord,
        stage_payload: dict[str, Any],
    ) -> list[QueryResult]:
        stage07 = self._stage(stage_payload, "stage-07-per-circle-imbalance-patterns")
        candidates = stage07.get("candidates", [])
        if not isinstance(candidates, list):
            return []
        candidate_ids: list[str] = []
        for item in candidates:
            if isinstance(item, str) and item.strip():
                candidate_ids.append(item.strip())
            elif isinstance(item, dict):
                candidate_id = str(item.get("id") or item.get("name") or "").strip()
                if candidate_id:
                    candidate_ids.append(candidate_id)
        results: list[QueryResult] = []
        for candidate_id in candidate_ids:
            try:
                results.append(runtime.imbalance_service.get_imbalance_detail(candidate_id))
            except Exception:
                continue
        return results

    def _build_fallback_analysis(self, query_results: dict[str, QueryResult]) -> dict[str, Any]:
        levels = set()
        warnings: list[str] = []
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
            "used": bool(query_fallbacks),
            "levels": sorted(item for item in levels if item),
            "warnings": self._unique_list(warnings),
            "query_fallbacks": query_fallbacks,
        }

    def _build_warning_analysis(
        self,
        runtime: Any,
        imbalance_results: list[QueryResult],
    ) -> dict[str, Any]:
        try:
            index = runtime.repository.load_index()
        except Exception:
            index = {}
        warning_paths = (
            index.get("stats", {})
            .get("quality", {})
            .get("high_risk_warning_paths", [])
        )
        result_ids = {result.entity_id.replace("imbalance.", "") for result in imbalance_results}
        warning_hits = []
        for result in imbalance_results:
            value = result.value if isinstance(result.value, dict) else {}
            warning = str(value.get("warning") or "").strip()
            if warning:
                warning_hits.append(
                    {
                        "imbalance_id": value.get("type") or result.entity_id.replace("imbalance.", ""),
                        "warning": warning,
                    }
                )
        active_warning_paths = [
            item
            for item in warning_paths
            if str(item.get("imbalance_id") or "") in result_ids
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

    def _record_image_ref(self, record: InterpretationRecord) -> str:
        for attr in ["image_url", "image_local_path", "image_path"]:
            value = getattr(record, attr, None)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return ""

    def _resolve_three_circles_source(self, record: InterpretationRecord) -> str:
        circles = getattr(record, "three_circles", None)
        auto_detect = getattr(record, "three_circles_auto_detect", None)
        has_manual = isinstance(circles, dict) and bool(circles)
        has_auto = isinstance(auto_detect, dict) and bool(auto_detect)
        if has_manual and has_auto:
            return "mixed"
        if has_manual:
            return "user_calibrated"
        if has_auto:
            return "auto_detect"
        return "user_calibrated"

    def _topic_label(self, theme: Any) -> str:
        labels = {
            "general": "全面解读",
            "wealth_career": "财富事业",
            "father_relationship": "父亲关系",
            "mother_relationship": "母亲关系",
            "intimate_relationship": "亲密关系",
            "parent_child_relationship": "亲子关系",
            "health_wellness": "身体健康",
            "personal_growth": "个人成长",
        }
        return labels.get(str(theme or "general"), str(theme or "general"))

    def _empty_query_result(self, message: str, entity_id: str) -> QueryResult:
        return QueryResult.not_found(message, entity_id=entity_id)

    def _join_text(self, values: list[Any]) -> str:
        return "\n".join(
            str(value).strip()
            for value in values
            if isinstance(value, str) and value.strip()
        )

    def _unique_list(self, items: list[Any]) -> list[Any]:
        return list(dict.fromkeys(item for item in items if item not in (None, "", [])))
