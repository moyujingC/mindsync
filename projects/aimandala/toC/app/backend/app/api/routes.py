"""Public API routes for the Aimandala report runtime."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core.llm import NoopLLMClient, create_llm_client_from_env
from app.core.mandala_interpretation_agent import (
    MandalaAgentInput,
    MandalaAgentResult,
    MandalaImageInput,
    MandalaInterpretationAgent,
    MandalaInterpretationArtifactStore,
    MandalaOutputRequirements,
    MandalaUserContext,
    ReportFollowupContext,
    ReportFollowupInput,
    ReportPersona,
)
from app.core.uploads import create_upload_storage_from_env
from app.core.mandala_interpretation_agent.report_followup_agent import ReportFollowupAgent
from app.core.mandala_interpretation_agent.report_followup_context import (
    ReportFollowupContextStore,
    build_report_section_map,
)


router = APIRouter(prefix="/api", tags=["aimandala"])


class WealthReportRequest(BaseModel):
    image_path: str = Field(..., description="Backend-readable local image path")
    report_mode: Literal["lite", "pro"] = "lite"
    agent_variant: Literal["two_pass_e2e", "single_pass_e2e"] = "two_pass_e2e"
    painting_intention: str = ""
    painting_feeling: str = ""
    inner_radius: int = Field(default=35, ge=1, le=99)
    middle_radius: int = Field(default=65, ge=1, le=99)
    storage_backend: str = ""
    storage_key: str = ""
    redeem_code: str = Field(default="", description="Coupon or redeem code.")


class WealthReportResponse(BaseModel):
    success: bool
    report_id: str
    report_mode: str
    final_report_md: str
    final_report: dict[str, object]
    visual_draft: dict[str, object]
    prompt_pack_manifest: dict[str, object]
    quality_gate: dict[str, object]
    run_summary: dict[str, object]


class WealthReportRecordResponse(BaseModel):
    report_id: str
    report_mode: Literal["lite", "pro"] | str = "lite"
    theme: str = "wealth"
    status: str = "completed"
    generation_stage: str = "report_ready"
    generation_progress: int = 100
    created_at: str = ""


class ReportFollowupTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ReportFollowupRequest(BaseModel):
    report_id: str
    question: str
    report_mode: Literal["lite", "pro"] | str = "lite"
    final_report_md: str = ""
    final_report: dict[str, object] = Field(default_factory=dict)
    visual_draft: dict[str, object] | None = None
    history: list[ReportFollowupTurn] = Field(default_factory=list)
    theme: str = "wealth"
    theme_label: str = "财富关系"
    painting_intention: str = ""
    painting_feeling: str = ""


class ReportFollowupResponse(BaseModel):
    success: bool
    report_id: str
    answer_md: str
    referenced_report_sections: list[dict[str, str]]
    safety: dict[str, object]
    out_of_scope: bool
    persona: dict[str, object]


class UploadImageResponse(BaseModel):
    success: bool
    image_path: str
    storage_backend: str
    storage_key: str
    original_filename: str
    content_type: str | None = None
    size_bytes: int
    image_url: str | None = None
    image_local_expires_at: str | None = None


def _build_llm_client() -> object:
    llm_client = create_llm_client_from_env()
    if isinstance(llm_client, NoopLLMClient):
        raise HTTPException(
            status_code=501,
            detail="LLM runtime is not configured.",
        )
    return llm_client


def _followup_context_store() -> ReportFollowupContextStore:
    root_dir = os.getenv("AIMANDALA_REPORT_FOLLOWUP_CONTEXT_DIR", "data/report-followup-contexts")
    return ReportFollowupContextStore(root_dir=Path(root_dir))


def _persona_from_payload(payload: dict[str, object] | None) -> ReportPersona:
    if isinstance(payload, dict):
        return ReportPersona(
            persona_id=str(payload.get("persona_id") or "manman"),
            persona_version=str(payload.get("persona_version") or "manman-report-companion-v0.1"),
            display_name=str(payload.get("display_name") or "曼曼"),
            role_label=str(payload.get("role_label") or "AI 报告陪读 avatar"),
            scope=str(payload.get("scope") or "陪用户读懂本次曼陀罗报告，并在报告范围内回答追问"),
            boundaries=[
                str(item)
                for item in payload.get("boundaries", [])
                if isinstance(item, str) and item.strip()
            ],
        )
    return ReportPersona()


def _build_followup_context_from_request(payload: ReportFollowupRequest) -> ReportFollowupContext:
    persona_payload = payload.final_report.get("persona") if isinstance(payload.final_report, dict) else None
    return ReportFollowupContext(
        report_id=payload.report_id,
        report_mode=payload.report_mode,
        theme=payload.theme,
        theme_label=payload.theme_label,
        painting_intention=payload.painting_intention,
        painting_feeling=payload.painting_feeling,
        final_report_md=payload.final_report_md,
        final_report=payload.final_report,
        visual_draft=payload.visual_draft,
        report_sections=build_report_section_map(payload.final_report_md),
        recent_followup_turns=[turn.model_dump() for turn in payload.history],
        persona=_persona_from_payload(persona_payload),
    )


def _build_followup_context_from_result(
    *,
    payload: WealthReportRequest,
    result: MandalaAgentResult,
    report_id: str,
) -> ReportFollowupContext:
    persona_payload = result.final_report.get("persona") if isinstance(result.final_report, dict) else None
    return ReportFollowupContext(
        report_id=report_id,
        report_mode=payload.report_mode,
        theme="wealth",
        theme_label="财富关系",
        painting_intention=payload.painting_intention,
        painting_feeling=payload.painting_feeling,
        final_report_md=result.final_report_md,
        final_report=result.final_report,
        visual_draft=result.visual_draft,
        report_sections=build_report_section_map(result.final_report_md),
        persona=_persona_from_payload(persona_payload),
    )


def _resolve_followup_context(payload: ReportFollowupRequest) -> ReportFollowupContext:
    stored_context = _followup_context_store().read(payload.report_id)
    if stored_context is not None:
        report_id_from_artifact = stored_context.final_report.get("report_id")
        if report_id_from_artifact and str(report_id_from_artifact) != payload.report_id:
            raise HTTPException(status_code=422, detail="追问请求与当前报告不匹配。")
        return ReportFollowupContext(
            report_id=stored_context.report_id,
            report_mode=stored_context.report_mode,
            theme=stored_context.theme,
            theme_label=stored_context.theme_label,
            painting_intention=stored_context.painting_intention,
            painting_feeling=stored_context.painting_feeling,
            final_report_md=stored_context.final_report_md,
            final_report=stored_context.final_report,
            visual_draft=stored_context.visual_draft,
            report_sections=stored_context.report_sections,
            recent_followup_turns=[turn.model_dump() for turn in payload.history],
            persona=stored_context.persona,
        )
    if not payload.final_report_md.strip():
        raise HTTPException(status_code=404, detail="未找到本次报告追问上下文，请重新打开或生成报告。")
    return _build_followup_context_from_request(payload)


def _build_agent_input(payload: WealthReportRequest) -> MandalaAgentInput:
    return MandalaAgentInput(
        report_mode=payload.report_mode,
        agent_variant=payload.agent_variant,
        image=MandalaImageInput(
            local_path=payload.image_path,
            storage_backend=payload.storage_backend,
            storage_key=payload.storage_key,
        ),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention=payload.painting_intention,
            painting_feeling=payload.painting_feeling,
        ),
        circle_boundaries={
            "inner_radius": payload.inner_radius,
            "middle_radius": payload.middle_radius,
            "radius_unit": "normalized_percent",
            "source": "user_or_client",
        },
        output_requirements=MandalaOutputRequirements(
            forbidden_terms=["stage", "placeholder", "legacy", "quality_gate"],
        ),
    )


def _authorize_report_access(payload: WealthReportRequest) -> None:
    # MVP trial path: payment is intentionally bypassed so Lite and Pro can both
    # be generated end-to-end before the real order/payment chain is rebuilt.
    _ = payload


def _report_root_dir() -> Path:
    return Path(os.getenv("AIMANDALA_REPORT_ARTIFACT_DIR", "data/reports"))


def _read_report_json(report_dir: Path, filename: str) -> dict[str, object]:
    path = report_dir / filename
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}


def _read_wealth_report_artifact(report_id: str) -> WealthReportResponse:
    report_dir = _report_root_dir() / report_id
    final_report_md_path = report_dir / "final_report.md"
    if not final_report_md_path.exists():
        raise HTTPException(status_code=404, detail="Report artifact not found.")

    final_report = _read_report_json(report_dir, "final_report.json")
    run_summary = _read_report_json(report_dir, "run_summary.json")
    report_mode = str(final_report.get("report_mode") or run_summary.get("report_mode") or "lite")

    return WealthReportResponse(
        success=True,
        report_id=report_id,
        report_mode=report_mode,
        final_report_md=final_report_md_path.read_text(encoding="utf-8"),
        final_report=final_report,
        visual_draft=_read_report_json(report_dir, "visual_draft.json"),
        prompt_pack_manifest=_read_report_json(report_dir, "prompt_pack_manifest.json"),
        quality_gate=_read_report_json(report_dir, "quality_gate.json"),
        run_summary=run_summary,
    )


def _authorize_followup_access(payload: ReportFollowupRequest) -> None:
    if os.getenv("AIMANDALA_REPORT_FOLLOWUP_ENABLED", "1").strip() == "0":
        raise HTTPException(status_code=403, detail="报告追问功能当前未开启。")
    report_id_from_artifact = payload.final_report.get("report_id")
    if report_id_from_artifact and str(report_id_from_artifact) != payload.report_id:
        raise HTTPException(status_code=422, detail="追问请求与当前报告不匹配。")


@router.post("/wealth-reports", response_model=WealthReportResponse)
async def create_wealth_report(payload: WealthReportRequest) -> WealthReportResponse:
    _authorize_report_access(payload)
    agent = MandalaInterpretationAgent(llm_client=_build_llm_client())
    result = agent.run(agent_input=_build_agent_input(payload))
    if not result.quality_gate["passed"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "财富报告质量检查未通过。",
                "quality_gate": result.quality_gate,
            },
        )
    report_id = str(result.run_summary.get("report_id") or result.final_report.get("report_id") or "")
    if report_id:
        store = MandalaInterpretationArtifactStore(output_dir=_report_root_dir() / report_id)
        store.write(result)
        _followup_context_store().write(
            _build_followup_context_from_result(
                payload=payload,
                result=result,
                report_id=report_id,
            )
        )
    return WealthReportResponse(
        success=True,
        report_id=report_id,
        report_mode=payload.report_mode,
        final_report_md=result.final_report_md,
        final_report=result.final_report,
        visual_draft=result.visual_draft,
        prompt_pack_manifest=result.prompt_pack_manifest,
        quality_gate=result.quality_gate,
        run_summary=result.run_summary,
    )


@router.get("/wealth-reports", response_model=list[WealthReportRecordResponse])
async def list_wealth_reports() -> list[WealthReportRecordResponse]:
    root_dir = _report_root_dir()
    if not root_dir.exists():
        return []

    records: list[WealthReportRecordResponse] = []
    for report_dir in sorted(root_dir.iterdir(), key=lambda path: path.stat().st_mtime, reverse=True):
        if not report_dir.is_dir() or not (report_dir / "final_report.md").exists():
            continue
        final_report = _read_report_json(report_dir, "final_report.json")
        run_summary = _read_report_json(report_dir, "run_summary.json")
        report_mode = str(final_report.get("report_mode") or run_summary.get("report_mode") or "lite")
        records.append(
            WealthReportRecordResponse(
                report_id=report_dir.name,
                report_mode=report_mode,
                theme=str(run_summary.get("theme") or "wealth"),
                created_at=str(
                    run_summary.get("created_at")
                    or datetime.fromtimestamp(report_dir.stat().st_mtime, tz=timezone.utc).isoformat()
                ),
            )
        )
    return records


@router.get("/wealth-reports/{report_id}", response_model=WealthReportResponse)
async def get_wealth_report(report_id: str) -> WealthReportResponse:
    return _read_wealth_report_artifact(report_id)


@router.post("/report-followups", response_model=ReportFollowupResponse)
async def create_report_followup(payload: ReportFollowupRequest) -> ReportFollowupResponse:
    _authorize_followup_access(payload)
    context = _resolve_followup_context(payload)
    result = ReportFollowupAgent(llm_client=_build_llm_client()).run(
        followup_input=ReportFollowupInput(context=context, question=payload.question)
    )
    return ReportFollowupResponse(success=True, **result.to_dict())


@router.post("/uploads", response_model=UploadImageResponse)
async def upload_image(file: UploadFile = File(...)) -> UploadImageResponse:
    content_type = (file.content_type or "").lower()
    if content_type and not content_type.startswith("image/"):
        await file.close()
        raise HTTPException(status_code=415, detail="Only image uploads are supported.")

    try:
        stored = await create_upload_storage_from_env().save_upload(file)
    except NotImplementedError as error:
        raise HTTPException(status_code=501, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Image upload failed.") from error

    return UploadImageResponse(
        success=True,
        image_path=stored.image_path,
        storage_backend=stored.storage_backend,
        storage_key=stored.storage_key,
        original_filename=stored.original_filename,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        image_url=stored.image_url,
        image_local_expires_at=stored.local_expires_at,
    )


@router.get("/wealth-reports/{report_id}/visual-draft")
async def get_visual_draft(report_id: str) -> dict:
    path = Path("data/reports") / report_id / "visual_draft.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Visual draft not found")
    return json.loads(path.read_text(encoding="utf-8"))
