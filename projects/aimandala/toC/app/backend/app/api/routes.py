"""Public API routes for the Aimandala report runtime."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core.llm import NoopLLMClient, create_llm_client_from_env
from app.core.mandala_interpretation_agent import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaInterpretationAgent,
    MandalaInterpretationArtifactStore,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.uploads import create_upload_storage_from_env


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
    if payload.report_mode != "lite":
        raise HTTPException(
            status_code=403,
            detail="Pro 版当前为 MVP 预备能力，暂不上线。",
        )
    configured_codes = os.getenv("AIMANDALA_REDEEM_CODES", "").strip()
    if not configured_codes:
        raise HTTPException(
            status_code=402,
            detail="报告生成需要先配置可用的优惠券或兑换码。",
        )
    submitted_code = payload.redeem_code.strip().upper()
    if not submitted_code:
        raise HTTPException(
            status_code=402,
            detail="请输入有效的优惠券或兑换码后再生成报告。",
        )


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
        store = MandalaInterpretationArtifactStore(output_dir=Path("data/reports") / report_id)
        store.write(result)
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
