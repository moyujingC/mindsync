"""FastAPI 路由层，只负责接入 Agent、Resume、Trace、Eval 和 Feedback。"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from agents.customer_service_agent import Lesson41Agent
from api.schemas import *
from config.settings import CASES_PATH, load_agent_capabilities
from evals.runner import EvalRunner
from feedback.attribution import FailureAttributor, build_backfilled_case
from integrations.wecom_kf.crypto import WecomCryptoError
from integrations.wecom_kf.handler import WecomKfHandler
from observability.trace import trace_store
from state.session_state import BACKFILLED_CASES, FEEDBACK_RECORDS

agent = Lesson41Agent()
wecom_handler = WecomKfHandler(agent)
eval_runner = EvalRunner(agent, CASES_PATH)
eval_runner.backfilled_cases = BACKFILLED_CASES
failure_attributor = FailureAttributor()
app = FastAPI(title="Lesson 41 Xiaozhe Agent Final Rehearsal")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """提供课程快照健康检查。"""
    return {"status": "ok", "lesson": "41"}


@app.get("/capabilities")
def capabilities() -> dict[str, Any]:
    """返回当前课程能力清单。"""
    return load_agent_capabilities()


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """处理一次总演习聊天请求。"""
    return agent.chat(request)


@app.get("/sessions/{session_id}/trace", response_model=list[TraceEvent])
def session_trace(session_id: str) -> list[TraceEvent]:
    """返回指定会话的公开 Trace。"""
    return trace_store.list(session_id)


@app.post("/eval/run", response_model=EvalRunResponse)
def run_eval(request: EvalRunRequest) -> EvalRunResponse:
    """运行第 41 课大促总演习回归评测。"""
    return eval_runner.run(case_id=request.case_id)


@app.post("/feedback/submit", response_model=FeedbackSubmitResponse)
def submit_feedback(request: FeedbackRequest) -> FeedbackSubmitResponse:
    """提交反馈、生成归因并回填成临时回归 case。"""
    eval_report = eval_runner.run(case_id=request.case_id) if request.case_id else None
    eval_result = eval_report.results[0] if eval_report and eval_report.results else None
    events = trace_store.list(request.session_id)
    attributions = failure_attributor.attribute(feedback=request, trace_events=events, eval_result=eval_result)
    base_case = next((case for case in eval_runner.load_cases() if case["case_id"] == request.case_id), None)
    backfilled_case = build_backfilled_case(request, attributions, base_case)
    BACKFILLED_CASES.append(backfilled_case)
    record = FeedbackRecord(
        feedback_id=f"fb-{len(FEEDBACK_RECORDS) + 1:03d}",
        session_id=request.session_id,
        case_id=request.case_id,
        rating=request.rating,
        user_comment=request.user_comment,
        trace_event_names=[event.event_type for event in events],
        eval_failure_categories=eval_result.failure_categories if eval_result else [],
        attributions=attributions,
        backfilled_case=backfilled_case,
    )
    FEEDBACK_RECORDS.append(record)
    return FeedbackSubmitResponse(record=record, eval_report=eval_report)


@app.get("/wecom/kf/callback")
def wecom_kf_verify(msg_signature: str, timestamp: str, nonce: str, echostr: str) -> PlainTextResponse:
    """企业微信「微信客服」回调 URL 验证：解密 echostr 原样回显。"""
    try:
        plain = wecom_handler.verify_url(msg_signature, timestamp, nonce, echostr)
        return PlainTextResponse(plain)
    except WecomCryptoError as exc:
        return PlainTextResponse(str(exc), status_code=400)


@app.post("/wecom/kf/callback")
async def wecom_kf_event(request: Request) -> PlainTextResponse:
    """企业微信「微信客服」消息事件回调：验签解密后后台处理，立即返回。"""
    body = (await request.body()).decode("utf-8")
    wecom_handler.handle_event(
        body,
        request.query_params.get("msg_signature", ""),
        request.query_params.get("timestamp", ""),
        request.query_params.get("nonce", ""),
    )
    return PlainTextResponse("success")
