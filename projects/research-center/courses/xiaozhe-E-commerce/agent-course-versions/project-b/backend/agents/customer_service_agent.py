"""项目 B 疗愈客服 Agent 编排层。复用 RAG、护栏、转人工、Trace 和成本治理能力。"""

from __future__ import annotations

from typing import Any

from api.schemas import *
from config.settings import load_course_env
from context.builder import build_context, update_memory
from cost.governance import build_cost_summary
from hooks.manager import HookManager
from models.answer_client import FinalAnswerModelClient, FinalAnswerModelResult
from models.router_client import ModelRouteResult, RouteModelClient
from observability.trace import public_trace_summary, record_initial_chat_trace, record_trace_events, trace_store
from rag.knowledge import (
    concept_faq_result,
    crisis_result,
    intake_collect_result,
    low_confidence_result,
    pricing_result,
    service_intro_result,
    transfer_human_result,
)
from safety.source_guard import inspect_source
from state.session_state import MESSAGE_COUNT_BY_SESSION
from tools.planning import build_route_plan, classify_guard_intent, classify_intent, estimate_tokens
from tools.runtime_context import (
    general_chat_answer,
    is_runtime_identity_query,
    runtime_context_summary,
    runtime_identity_answer,
)


class Lesson41Agent:
    """项目 B 疗愈客服版：复用骨架能力，服务疗愈业务初访接待与转人工。"""

    def __init__(self) -> None:
        self.route_model_client = RouteModelClient()
        self.answer_model_client = FinalAnswerModelClient()

    def chat(self, request: ChatRequest) -> ChatResponse:
        """编排疗愈客服聊天链路，串联意图路由、RAG、护栏、转人工、Trace 和成本治理。"""
        load_course_env()
        MESSAGE_COUNT_BY_SESSION[request.session_id] = MESSAGE_COUNT_BY_SESSION.get(request.session_id, 0) + 1
        message_count = MESSAGE_COUNT_BY_SESSION[request.session_id]
        fallback_intent = classify_intent(request.user_message)
        route_result = self.route_model_client.plan_intent(request.user_message, fallback_intent=fallback_intent)
        route_result = self._apply_route_guard(
            user_message=request.user_message,
            route_result=route_result,
        )
        intent = route_result.intent
        route_was_guarded = str(route_result.fallback_reason or "").startswith("rule_guard_")
        route_plan = build_route_plan(
            intent=intent,
            user_message=request.user_message,
            model_used=route_result.used_model and not route_was_guarded,
        )
        runtime_context = runtime_context_summary(request)
        uses_runtime_identity = is_runtime_identity_query(request.user_message)
        citations: list[Citation] = []
        tool_calls: list[ToolCallTrace] = []
        workflow: dict[str, Any] | None = None
        cache_hit = False
        degraded = False
        degradation_reason: str | None = None
        rag_retrieval: dict[str, Any] | None = None
        hooks = HookManager()
        context_report, compression_report = build_context(request)

        record_initial_chat_trace(
            session_id=request.session_id,
            runtime_user_id=request.runtime_user_id,
            runtime_nickname=request.runtime_nickname,
            runtime_member_level=request.runtime_member_level,
            runtime_risk_level=request.runtime_risk_level,
            intent=intent,
            estimated_tokens=estimate_tokens(request.user_message),
            route_result=route_result,
            context_report=context_report,
            compression_report=compression_report,
        )
        trace_store.add(
            request.session_id,
            "route_plan_built",
            {
                "session_id": request.session_id,
                "intent": route_plan.intent,
                "source": route_plan.source,
                "required_tools": route_plan.required_tools,
                "needs_rag": route_plan.needs_rag,
                "needs_business_tools": route_plan.needs_business_tools,
                "requires_workflow": route_plan.requires_workflow,
                "risk_level": route_plan.risk_level,
            },
        )

        if uses_runtime_identity:
            answer = runtime_identity_answer(request)
            risk_level = "low"
            next_action = "answer_user"
            needs_human_approval = False
            trace_store.add(
                request.session_id,
                "runtime_identity_answered",
                {"session_id": request.session_id, "intent": intent, "used_runtime_context": True},
            )
        elif intent == "crisis":
            knowledge_result = crisis_result(request.session_id)
            record_trace_events(request.session_id, knowledge_result.trace_events)
            answer, citations = knowledge_result.answer, knowledge_result.citations
            risk_level, next_action = knowledge_result.risk_level, knowledge_result.next_action
            needs_human_approval = knowledge_result.needs_human_approval
        elif intent == "security_request":
            trace_store.add(
                request.session_id,
                "prompt_security_blocked",
                {"session_id": request.session_id, "intent": intent, "risk_level": "high", "status": "blocked"},
            )
            answer = "我不能提供受保护系统信息、受保护推理摘要、工具细节或内部策略。"
            risk_level: RiskLevel = "high"
            next_action: NextAction = "answer_user"
            needs_human_approval = False
        elif intent == "transfer_human":
            knowledge_result = transfer_human_result(request.session_id)
            record_trace_events(request.session_id, knowledge_result.trace_events)
            answer, citations = knowledge_result.answer, knowledge_result.citations
            risk_level, next_action = knowledge_result.risk_level, knowledge_result.next_action
            needs_human_approval = knowledge_result.needs_human_approval
        elif intent == "low_confidence_query":
            knowledge_result = low_confidence_result(request.session_id, intent)
            record_trace_events(request.session_id, knowledge_result.trace_events)
            answer, citations = knowledge_result.answer, knowledge_result.citations
            risk_level, next_action = knowledge_result.risk_level, knowledge_result.next_action
            needs_human_approval = knowledge_result.needs_human_approval
        elif intent == "concept_faq":
            knowledge_result = concept_faq_result(request.session_id, request.user_message)
            record_trace_events(request.session_id, knowledge_result.trace_events)
            answer, citations = knowledge_result.answer, knowledge_result.citations
            risk_level, next_action = knowledge_result.risk_level, knowledge_result.next_action
            needs_human_approval = knowledge_result.needs_human_approval
            rag_retrieval = knowledge_result.retrieval_debug
        elif intent == "service_intro":
            knowledge_result = service_intro_result(request.session_id, request.user_message)
            record_trace_events(request.session_id, knowledge_result.trace_events)
            answer, citations = knowledge_result.answer, knowledge_result.citations
            risk_level, next_action = knowledge_result.risk_level, knowledge_result.next_action
            needs_human_approval = knowledge_result.needs_human_approval
            rag_retrieval = knowledge_result.retrieval_debug
        elif intent == "pricing_process":
            knowledge_result = pricing_result(request.session_id, request.user_message)
            record_trace_events(request.session_id, knowledge_result.trace_events)
            answer, citations = knowledge_result.answer, knowledge_result.citations
            risk_level, next_action = knowledge_result.risk_level, knowledge_result.next_action
            needs_human_approval = knowledge_result.needs_human_approval
            rag_retrieval = knowledge_result.retrieval_debug
        elif intent == "intake_collect":
            knowledge_result = intake_collect_result(request.session_id)
            record_trace_events(request.session_id, knowledge_result.trace_events)
            answer, citations = knowledge_result.answer, knowledge_result.citations
            risk_level, next_action = knowledge_result.risk_level, knowledge_result.next_action
            needs_human_approval = knowledge_result.needs_human_approval
        else:
            answer = general_chat_answer(request.user_message)
            risk_level = "low"
            next_action = "answer_user"
            needs_human_approval = False

        # RAG citation 也是外部数据，进入最终模型前按来源做污染检查。
        external_reports: list[dict[str, Any]] = []
        for citation in citations:
            report = inspect_source("rag_document", citation.snippet)
            if report["tainted"]:
                citation.snippet = str(report["sanitized_content"])
            external_reports.append({key: value for key, value in report.items() if key != "sanitized_content"})
        if external_reports:
            source_safety = context_report["source_safety"]
            source_safety["reports"].extend(external_reports)
            source_safety["tainted"] = source_safety["tainted"] or any(report["tainted"] for report in external_reports)
            source_safety["tainted_sources"] = sorted(
                set(source_safety["tainted_sources"])
                | {report["source"] for report in external_reports if report["tainted"]}
            )
            trace_store.add(
                request.session_id,
                "context_source_safety_checked",
                {
                    "session_id": request.session_id,
                    "tainted": source_safety["tainted"],
                    "tainted_sources": source_safety["tainted_sources"],
                    "source_count": len(source_safety["reports"]),
                },
            )

        if rag_retrieval:
            trace_store.add(
                request.session_id,
                "rag_hybrid_retrieved",
                {
                    "session_id": request.session_id,
                    "mode": rag_retrieval.get("mode"),
                    "rewritten_query": (rag_retrieval.get("plan") or {}).get("rewritten_query"),
                    "index_version": rag_retrieval.get("index_version"),
                    "index_chunk_count": rag_retrieval.get("index_chunk_count"),
                    "index_cache_hit": rag_retrieval.get("index_cache_hit"),
                    "retrieval_cache_hit": rag_retrieval.get("retrieval_cache_hit"),
                    "vector_policy_ids": rag_retrieval.get("vector_policy_ids", []),
                    "keyword_policy_ids": rag_retrieval.get("keyword_policy_ids", []),
                    "hit_count": len(citations),
                    "retrieval_stage": "hybrid_retrieval",
                },
            )

        model_answer = self._compose_final_answer(
            request=request,
            intent=intent,
            answer=answer,
            risk_level=risk_level,
            next_action=next_action,
            tool_calls=tool_calls,
            citations=citations,
            workflow=workflow,
            cache_hit=cache_hit,
            degraded=degraded,
            skip_final_model=uses_runtime_identity,
            enable_reasoning=request.reasoning_view == "teaching",
            context_report=context_report,
        )
        answer = model_answer.answer
        reasoning_content = model_answer.reasoning_content if request.reasoning_view == "teaching" else None
        prompt_fragments = [*route_result.prompt_fragments, *model_answer.prompt_fragments]

        if prompt_fragments:
            trace_store.add(
                request.session_id,
                "prompt_context_built",
                {
                    "session_id": request.session_id,
                    "registry_schema": "prompt_registry_v1",
                    "selected_fragments": prompt_fragments,
                    "prompt_body_exposed": False,
                },
            )

        memory = update_memory(
            session_id=request.session_id,
            runtime_user_id=request.runtime_user_id,
            intent=intent,
            user_message=request.user_message,
        )
        hook_completion = hooks.on_completion(risk_level=risk_level, next_action=next_action, degraded=degraded)
        for hook_event in hooks.events:
            trace_store.add(request.session_id, "hook_executed", {"session_id": request.session_id, **hook_event})
        cost_summary = build_cost_summary(
            request=request,
            intent=intent,
            tool_calls=tool_calls,
            citations=citations,
            workflow=workflow,
            answer=answer,
            cache_hit=cache_hit,
            route_model_used=route_result.used_model,
            answer_model_used=model_answer.used_model,
            reasoning_content_returned=bool(reasoning_content),
            reasoning_source=model_answer.reasoning_source,
            degraded=degraded,
            degradation_reason=degradation_reason,
            prompt_fragments=prompt_fragments,
            tool_agent_model_calls=0,
        )
        trace_store.add(request.session_id, "cost_recorded", cost_summary)
        trace_store.add(
            request.session_id,
            "final_answer_generated",
            {
                "session_id": request.session_id,
                "intent": intent,
                "status": "success",
                "risk_level": risk_level,
                "used_model": model_answer.used_model,
                "reasoning_content_returned": bool(reasoning_content),
            },
        )

        return ChatResponse(
            session_id=request.session_id,
            answer=answer,
            citations=citations,
            tool_calls=tool_calls,
            clarification=None,
            reasoning_summary=[
                "Trace 记录的是公开执行摘要：Runtime Context、Context、RAG、护栏、Hooks 和 Cost。",
                "citations 是可观察证据，不是 hidden CoT。",
                "教学模式会尝试展示主链路最终模型返回的 reasoning_content；系统提示词、密钥、隐私原文和内部堆栈不会写入公开 trace。",
            ],
            reasoning_content=reasoning_content,
            session_state={
                "agent_version": "project-b-healing-service",
                "message_count": message_count,
                "intent": intent,
                "model": {
                    "route_planner": {
                        "used_model": route_result.used_model,
                        "model_name": route_result.model_name,
                        "fallback_reason": route_result.fallback_reason,
                        "prompt_fragments": route_result.prompt_fragments,
                    },
                    "final_answer": {
                        "used_model": model_answer.used_model,
                        "model_name": model_answer.model_name,
                        "fallback_reason": model_answer.fallback_reason,
                        "prompt_fragments": model_answer.prompt_fragments,
                    },
                },
                "prompt_registry": {
                    "schema_version": "prompt_registry_v1",
                    "selected_fragments": prompt_fragments,
                    "selected_fragment_ids": [fragment["name"] for fragment in prompt_fragments],
                    "prompt_body_exposed": False,
                },
                "route_plan": route_plan.model_dump(),
                "frameworks": {
                    "langchain": {
                        "used": route_result.used_model or model_answer.used_model,
                        "route_chain": route_result.framework,
                        "final_answer_chain": model_answer.framework,
                        "prompt_registry": "prompts/prompt_registry.yml",
                        "selected_fragment_ids": [fragment["name"] for fragment in prompt_fragments],
                    },
                },
                "risk_level": risk_level,
                "next_action": next_action,
                "needs_human_approval": needs_human_approval,
                "runtime_context": runtime_context,
                "memory": memory,
                "context_report": context_report,
                "compression_report": compression_report,
                "hook_events": hooks.events,
                "hook_completion": hook_completion,
                "rag": {
                    "low_confidence": intent == "low_confidence_query",
                    "hit_count": len(citations),
                    "citation_ids": [citation.metadata.get("policy_id") for citation in citations if citation.metadata],
                    "retrieval_mode": rag_retrieval.get("mode") if rag_retrieval else None,
                    "rewritten_query": (rag_retrieval.get("plan") or {}).get("rewritten_query") if rag_retrieval else None,
                    "index_version": rag_retrieval.get("index_version") if rag_retrieval else None,
                    "index_chunk_count": rag_retrieval.get("index_chunk_count") if rag_retrieval else 0,
                    "index_cache_hit": rag_retrieval.get("index_cache_hit") if rag_retrieval else False,
                    "retrieval_cache_hit": rag_retrieval.get("retrieval_cache_hit") if rag_retrieval else False,
                    "vector_policy_ids": rag_retrieval.get("vector_policy_ids", []) if rag_retrieval else [],
                    "keyword_policy_ids": rag_retrieval.get("keyword_policy_ids", []) if rag_retrieval else [],
                    "source_scores": rag_retrieval.get("source_scores", {}) if rag_retrieval else {},
                    "embedding": rag_retrieval.get("embedding") if rag_retrieval else None,
                },
                "degraded": degraded,
                "cost_summary": cost_summary,
                "trace": public_trace_summary(request.session_id),
                "next_gap": "语料与话术为初版占位，上线后靠评测 badcase 回流持续更新；真实渠道接入待起号后完成。",
            },
        )

    def _compose_final_answer(
        self,
        *,
        request: ChatRequest,
        intent: Intent,
        answer: str,
        risk_level: str,
        next_action: str,
        tool_calls: list[ToolCallTrace],
        citations: list[Citation],
        workflow: dict[str, Any] | None,
        cache_hit: bool,
        degraded: bool,
        skip_final_model: bool = False,
        enable_reasoning: bool = False,
        context_report: dict[str, Any],
    ) -> FinalAnswerModelResult:
        """让真实模型生成最终话术，但安全、低置信、危机、转人工和初访收集保留确定性边界。"""
        skip_reason: str | None = None
        if skip_final_model:
            skip_reason = "runtime_context_direct_answer"
        elif next_action == "ask_clarification":
            skip_reason = "clarification_required"
        elif intent in {"security_request", "low_confidence_query", "crisis", "transfer_human", "intake_collect"}:
            skip_reason = "safety_or_boundary"
        elif degraded:
            skip_reason = "degraded_path"
        elif cache_hit:
            skip_reason = "common_hit_cache"
        if skip_reason:
            result = FinalAnswerModelResult(answer=answer, fallback_reason=skip_reason)
            trace_store.add(
                request.session_id,
                "model_answer_skipped",
                {"session_id": request.session_id, "intent": intent, "reason": skip_reason},
            )
            return result

        result = self.answer_model_client.compose_answer(
            request=request,
            intent=intent,
            deterministic_answer=answer,
            risk_level=risk_level,
            next_action=next_action,
            tool_calls=tool_calls,
            citations=citations,
            workflow=workflow,
            enable_reasoning=enable_reasoning,
            model_context=context_report["model_context"],
        )
        trace_store.add(
            request.session_id,
            "model_answer_generated",
            {
                "session_id": request.session_id,
                "intent": intent,
                "used_model": result.used_model,
                "model_name": result.model_name,
                "fallback_reason": result.fallback_reason,
            },
        )
        return result

    @staticmethod
    def _apply_route_guard(
        *,
        user_message: str,
        route_result: ModelRouteResult,
    ) -> ModelRouteResult:
        """仅让明确边界覆盖模型，宽泛关键词只用于模型不可用时的 fallback。"""
        guard_intent = classify_guard_intent(user_message)
        if guard_intent is None or route_result.intent == guard_intent:
            return route_result
        return ModelRouteResult(
            intent=guard_intent,
            used_model=route_result.used_model,
            model_name=route_result.model_name,
            fallback_reason=f"rule_guard_{guard_intent}",
            framework=route_result.framework,
            prompt_fragments=route_result.prompt_fragments,
        )
