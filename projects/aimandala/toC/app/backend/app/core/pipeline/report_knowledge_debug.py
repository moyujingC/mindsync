"""Knowledge-focused debug blocks for report tracing and workbench views."""

from __future__ import annotations

from typing import Any, Callable

from app.core.knowledge_runtime.contracts import QueryResult

from .data_models import InterpretationRecord


class KnowledgeDebugBlockBuilder:
    """Build structured knowledge debug payloads for one interpretation."""

    FIELD_QUERY_MAP = {
        "title": ["theme", "narrative"],
        "current_reading": [
            "theme",
            "imbalance.primary",
            "circles.inner",
            "circles.middle",
            "circles.outer",
        ],
        "visual_basis": ["theme", "circles.inner", "circles.middle", "circles.outer"],
        "pattern_interpretation": ["theme", "imbalance.primary", "narrative"],
        "life_connection": ["theme", "narrative"],
        "lite_healing_guidance": ["theme", "healing", "narrative"],
        "pro_report_entry": ["narrative", "theme"],
        "deep_impression": ["imbalance.primary", "narrative", "theme"],
        "evidence_digest": ["theme", "imbalance.primary", "circles.inner", "circles.middle", "circles.outer"],
        "imbalance_diagnosis": ["imbalance.primary", "theme"],
        "root_cause_chain": ["imbalance.primary", "theme", "narrative"],
        "deep_structure_interpretation": ["theme", "narrative", "imbalance.primary"],
        "healing_plan": ["healing", "imbalance.primary", "narrative"],
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
        narrative_plans = self._build_narrative_plans(record)
        knowledge_projections = self._build_knowledge_projections(record)
        if runtime is None:
            return {
                "build_info": {},
                "layer0_evidence": self._build_layer0_evidence(layer0),
                "narrative_plans": narrative_plans,
                "knowledge_projections": knowledge_projections,
                "topic_context_trace": self._build_topic_context_trace(record),
                "product_block_debug": self._build_product_block_debug(
                    record=record,
                    layer0=layer0,
                    field_to_knowledge_map={},
                ),
                "internal_compatibility": self._build_internal_compatibility(record),
                "query_results": {},
                "fallback_analysis": {
                    "used": bool(layer0.get("fallback_summary", {}).get("used")),
                    "levels": layer0.get("fallback_summary", {}).get("levels", []),
                    "warnings": layer0.get("fallback_summary", {}).get("warnings", []),
                    "fidelity_flags": layer0.get("fidelity_flags", layer0.get("quality_flags", [])),
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
            "narrative_plans": narrative_plans,
            "knowledge_projections": knowledge_projections,
            "topic_context_trace": self._build_topic_context_trace(record),
            "product_block_debug": self._build_product_block_debug(
                record=record,
                layer0=layer0,
                field_to_knowledge_map=field_to_knowledge_map,
            ),
            "internal_compatibility": self._build_internal_compatibility(record),
            "query_results": query_results,
            "fallback_analysis": fallback_analysis,
            "warning_analysis": warning_analysis,
            "source_refs": source_refs_list,
            "field_to_knowledge_map": field_to_knowledge_map,
        }

    def _build_topic_context_trace(self, record: InterpretationRecord) -> dict[str, Any]:
        theme = record.theme or "general"
        return {
            "topic": theme,
            "report_modes": list(record.version_purchased or []),
            "knowledge_route": "general" if theme == "general" else "theme_only",
            "general_mixed": False,
        }

    def _build_product_block_debug(
        self,
        *,
        record: InterpretationRecord,
        layer0: dict[str, Any],
        field_to_knowledge_map: dict[str, Any],
    ) -> dict[str, Any]:
        lite_final = record.layer_2_lite_final
        pro_draft = record.layer_3_pro_draft
        fidelity_flags = layer0.get("fidelity_flags", layer0.get("quality_flags", []))
        fallback_summary = layer0.get("fallback_summary", {})
        lite_healing_guidance = self._build_lite_healing_guidance_debug(lite_final)
        pro_report_entry = self._build_pro_report_entry_debug(lite_final)
        return {
            "lite": {
                "current_reading": self._product_block(
                    final=lite_final.overall_impression if lite_final else "",
                    field_key="current_reading",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="overall_impression",
                ),
                "visual_basis": self._product_block(
                    final=lite_final.visual_elements_rendered if lite_final else "",
                    field_key="visual_basis",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="visual_elements",
                ),
                "pattern_interpretation": self._product_block(
                    final=self._join_text([
                        lite_final.emotion_portrait_rendered if lite_final else "",
                        lite_final.story.pattern.content if lite_final else "",
                        lite_final.story.defense.content if lite_final else "",
                    ]),
                    field_key="pattern_interpretation",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="story_sections.pattern",
                ),
                "life_connection": self._product_block(
                    final=self._join_text([
                        lite_final.theme_insights.scene if lite_final else "",
                        lite_final.theme_insights.impact if lite_final else "",
                        lite_final.theme_insights.awareness if lite_final else "",
                    ]),
                    field_key="life_connection",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="theme_insights",
                ),
                "lite_healing_guidance": self._product_block(
                    final=lite_healing_guidance,
                    field_key="lite_healing_guidance",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="lite_healing_guidance",
                    compatibility_used=True,
                ),
                "pro_report_entry": self._product_block(
                    final=pro_report_entry,
                    field_key="pro_report_entry",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="pro_report_entry",
                    compatibility_used=True,
                ),
            },
            "pro": {
                "deep_impression": self._product_block(
                    final=pro_draft.first_impression if pro_draft else "",
                    field_key="deep_impression",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="first_impression",
                ),
                "evidence_digest": self._product_block(
                    final=self._build_pro_evidence_digest_debug(pro_draft),
                    field_key="evidence_digest",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="core_insight_table|three_circles_detailed|micro_analysis_detailed",
                    compatibility_used=True,
                ),
                "imbalance_diagnosis": self._product_block(
                    final=self._build_pro_imbalance_diagnosis_debug(pro_draft),
                    field_key="imbalance_diagnosis",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="imbalance_confirmed",
                    compatibility_used=True,
                ),
                "root_cause_chain": self._product_block(
                    final=self._build_pro_root_cause_chain_debug(pro_draft),
                    field_key="root_cause_chain",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="root_cause",
                    compatibility_used=True,
                ),
                "deep_structure_interpretation": self._product_block(
                    final=self._build_pro_deep_structure_interpretation_debug(record, pro_draft),
                    field_key="deep_structure_interpretation",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="deep_structure_interpretation",
                    compatibility_used=True,
                ),
                "healing_plan": self._product_block(
                    final=pro_draft.healing_suggestions if pro_draft else [],
                    field_key="healing_plan",
                    field_to_knowledge_map=field_to_knowledge_map,
                    fidelity_flags=fidelity_flags,
                    fallback_summary=fallback_summary,
                    narrative_section="healing_suggestions",
                    compatibility_used=True,
                ),
            },
        }

    def _product_block(
        self,
        *,
        final: Any,
        field_key: str,
        field_to_knowledge_map: dict[str, Any],
        fidelity_flags: list[Any],
        fallback_summary: dict[str, Any],
        narrative_section: str,
        compatibility_used: bool = False,
    ) -> dict[str, Any]:
        evidence = field_to_knowledge_map.get(field_key, {})
        return {
            "final": final,
            "narrative_trace": {
                "section": narrative_section,
            },
            "evidence_trace": {
                "visual_fact_refs": [],
                "knowledge_hit_refs": evidence.get("entity_ids", []) if isinstance(evidence, dict) else [],
                "rule_refs": [],
                "theme_projection_refs": evidence.get("source_paths", []) if isinstance(evidence, dict) else [],
            },
            "prompt_trace": {
                "schema_field": field_key,
            },
            "quality_trace": {
                "fidelity_flags": fidelity_flags,
                "fallback_summary": fallback_summary,
                "compatibility_used": compatibility_used,
            },
        }

    def _build_lite_healing_guidance_debug(self, lite_final: Any) -> dict[str, Any]:
        if lite_final is None:
            return {"directions": [], "micro_practices": []}
        theme_insights = (
            lite_final.theme_insights.to_dict()
            if getattr(lite_final, "theme_insights", None)
            else {"scene": "", "impact": "", "awareness": ""}
        )
        directions = []
        for title, content in [
            ("先稳住当前节奏", theme_insights.get("awareness", "")),
            ("把理解放回现实场景", theme_insights.get("impact", "")),
            ("保留一个更轻的动作方向", theme_insights.get("scene", "")),
        ]:
            if isinstance(content, str) and content.strip():
                directions.append({"title": title, "content": content.strip()})

        micro_practices = []
        for item in getattr(lite_final, "three_awareness", []) or []:
            practice = item.to_dict() if hasattr(item, "to_dict") else {}
            title = str(practice.get("title") or "").strip()
            content = str(practice.get("content") or "").strip()
            if title and content:
                micro_practices.append({"title": title, "content": content})

        experiment = str(getattr(lite_final, "experiment_rendered", "") or "").strip()
        if experiment:
            micro_practices.append({
                "title": "现在可以先做的小练习",
                "content": experiment,
            })

        return {
            "directions": directions[:3],
            "micro_practices": micro_practices[:3],
        }

    def _build_pro_report_entry_debug(self, lite_final: Any) -> dict[str, str]:
        teaser = str(getattr(lite_final, "pro_teaser", "") or "").strip() if lite_final else ""
        summary = "如果你希望从更深层结构继续理解这张画，Pro 会提供更完整的结构、根因与疗愈视角。"
        if teaser and "更深层结构" in teaser:
            summary = teaser
        return {
            "title": "另一份更深的独立报告",
            "summary": summary,
            "product_note": "Pro 不是 Lite 的升级版，而是另一份独立购买、独立成立的深度完整解读。",
        }

    def _build_pro_evidence_digest_debug(self, pro_draft: Any) -> str:
        if pro_draft is None:
            return ""
        circle_parts = []
        for item in (pro_draft.three_circles_detailed or {}).values():
            if not isinstance(item, dict):
                continue
            label = str(item.get("label") or "").strip()
            reading = str(item.get("reading") or "").strip()
            if reading:
                circle_parts.append(f"{label}：{reading}" if label else reading)
        micro_parts = [
            str(value).strip()
            for value in (pro_draft.micro_analysis_detailed or {}).values()
            if isinstance(value, str) and value.strip()
        ]
        core_parts = [
            str(value).strip()
            for value in (pro_draft.core_insight_table or {}).values()
            if isinstance(value, str) and value.strip()
        ]
        return self._join_text(core_parts[:2] + circle_parts + micro_parts)

    def _build_pro_imbalance_diagnosis_debug(self, pro_draft: Any) -> str:
        if pro_draft is None:
            return ""
        imbalance = pro_draft.imbalance_confirmed or {}
        preferred_keys = ["primary", "summary", "evidence", "energy_level", "psychological_level"]
        parts = [
            str(imbalance.get(key) or "").strip()
            for key in preferred_keys
            if isinstance(imbalance.get(key), str) and str(imbalance.get(key)).strip()
        ]
        if parts:
            return self._join_text(parts)
        return self._join_text([
            str(value).strip()
            for value in imbalance.values()
            if isinstance(value, str) and value.strip()
        ])

    def _build_pro_root_cause_chain_debug(self, pro_draft: Any) -> dict[str, str]:
        root_cause = pro_draft.root_cause if pro_draft else {}
        return {
            "surface": str(root_cause.get("surface") or root_cause.get("表面现象") or "").strip(),
            "mechanism": str(root_cause.get("deeper") or root_cause.get("形成机制") or "").strip(),
            "core": str(root_cause.get("core") or root_cause.get("核心信念") or "").strip(),
        }

    def _build_pro_deep_structure_interpretation_debug(
        self,
        record: InterpretationRecord,
        pro_draft: Any,
    ) -> str:
        if pro_draft is None:
            return ""
        topic = record.theme or "general"
        root_chain = self._build_pro_root_cause_chain_debug(pro_draft)
        return self._join_text([
            f"在 {topic} 这个议题下，这份 Pro 解读会把画面证据、失衡判断和根因链放在一起看。",
            root_chain.get("mechanism", ""),
            root_chain.get("core", ""),
        ])

    def _build_internal_compatibility(self, record: InterpretationRecord) -> dict[str, Any]:
        legacy_fields = []
        if record.layer_1_lite_draft and record.layer_1_lite_draft.pro_teaser:
            legacy_fields.append("pro_teaser")
        if record.layer_2_lite_final and record.layer_2_lite_final.story:
            legacy_fields.append("story")
        if record.layer_3_pro_draft and record.layer_3_pro_draft.healing_suggestions:
            legacy_fields.append("healing_suggestions")
        return {
            "legacy_fields": legacy_fields,
            "compatibility_used": bool(legacy_fields),
        }

    def _join_text(self, parts: list[Any]) -> str:
        cleaned = [
            str(part).strip()
            for part in parts
            if isinstance(part, str) and str(part).strip()
        ]
        return "\n\n".join(cleaned)

    def _build_layer0_evidence(self, layer0: dict[str, Any]) -> dict[str, Any]:
        return {
            "visual_facts": layer0.get("visual_facts", {}),
            "knowledge_hits": layer0.get("knowledge_hits", {}),
            "rule_evaluations": layer0.get("rule_evaluations", {}),
            "theme_projection": layer0.get("theme_projection", {}),
            "imbalance_candidates": layer0.get("imbalance_candidates", []),
            "fidelity_flags": layer0.get("fidelity_flags", layer0.get("quality_flags", [])),
            "quality_flags": layer0.get("quality_flags", []),
            "fallback_summary": layer0.get("fallback_summary", {}),
        }

    def _build_knowledge_projections(
        self,
        record: InterpretationRecord,
    ) -> dict[str, Any]:
        lite_projection: dict[str, Any] = {}
        if record.layer_1_lite_draft is not None:
            lite_projection = {
                "title": record.layer_1_lite_draft.title,
                "overall_impression": record.layer_1_lite_draft.overall_impression,
                "story_sections": {
                    "base": record.layer_1_lite_draft.story.base.content,
                    "contradiction": record.layer_1_lite_draft.story.contradiction.content,
                    "pattern": record.layer_1_lite_draft.story.pattern.content,
                    "defense": record.layer_1_lite_draft.story.defense.content,
                    "block": record.layer_1_lite_draft.story.block.content,
                    "light": record.layer_1_lite_draft.story.light.content,
                },
                "theme_insights": record.layer_1_lite_draft.theme_insights.to_dict(),
                "three_awareness": [
                    item.to_dict() for item in record.layer_1_lite_draft.three_awareness
                ],
                "pro_report_entry": {
                    "title": "另一份更深的独立报告",
                    "summary": record.layer_1_lite_draft.pro_teaser,
                },
            }

        pro_projection: dict[str, Any] = {}
        if record.layer_3_pro_draft is not None:
            pro_projection = {
                "first_impression": record.layer_3_pro_draft.first_impression,
                "core_insight_table": record.layer_3_pro_draft.core_insight_table,
                "three_circles_detailed": record.layer_3_pro_draft.three_circles_detailed,
                "micro_analysis_detailed": record.layer_3_pro_draft.micro_analysis_detailed,
                "imbalance_confirmed": record.layer_3_pro_draft.imbalance_confirmed,
                "root_cause": record.layer_3_pro_draft.root_cause,
                "healing_suggestions": record.layer_3_pro_draft.healing_suggestions,
            }

        return {
            "lite": lite_projection,
            "pro": pro_projection,
        }

    def _build_narrative_plans(
        self,
        record: InterpretationRecord,
    ) -> dict[str, Any]:
        lite_plan = {}
        if record.layer_1_lite_draft is not None and isinstance(
            record.layer_1_lite_draft.narrative_plan,
            dict,
        ):
            lite_plan = record.layer_1_lite_draft.narrative_plan

        pro_plan = {}
        if record.layer_3_pro_draft is not None and isinstance(
            record.layer_3_pro_draft.narrative_plan,
            dict,
        ):
            pro_plan = record.layer_3_pro_draft.narrative_plan

        return {
            "lite": lite_plan,
            "pro": pro_plan,
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
            "fidelity_flags": layer0.get("fidelity_flags", layer0.get("quality_flags", [])),
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
