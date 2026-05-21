"""Public API routes for the Aimandala report runtime."""

from __future__ import annotations

import json
import os
from typing import Any, Literal

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core.llm import NoopLLMClient, create_llm_client_from_env
from app.core.mandala_interpretation_agent import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaInterpretationAgent,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.mandala_interpretation_agent.knowledge_pack_builder import KnowledgePackBuilder
from app.core.uploads import create_upload_storage_from_env
from app.core.wealth_report import get_wealth_report_runtime

from .prompt_loader import load_prompt_template


router = APIRouter(prefix="/api", tags=["aimandala"])


class WealthReportRequest(BaseModel):
    """Input for one wealth-topic mandala report."""

    image_path: str = Field(..., description="Backend-readable local image path")
    report_mode: Literal["lite", "pro"] = "lite"
    painting_intention: str = ""
    painting_feeling: str = ""
    inner_radius: int = Field(default=35, ge=1, le=99)
    middle_radius: int = Field(default=65, ge=1, le=99)
    visual_observations: dict[str, Any] | None = Field(
        default=None,
        description="Optional pre-extracted visual evidence for dry-run or review flows.",
    )
    storage_backend: str = ""
    storage_key: str = ""
    redeem_code: str = Field(
        default="",
        description="Coupon or redeem code that authorizes generating the selected report mode.",
    )


class WealthReportResponse(BaseModel):
    """User-facing report payload plus runtime trace for review."""

    success: bool
    report_id: str
    topic: str
    report_mode: str
    final_report_md: str
    final_report: dict[str, Any]
    selected_signal_ids: list[str]
    selected_clause_ids: list[str]
    selected_module_ids: list[str]
    boundaries: list[str]
    topic_context: dict[str, Any]
    quality_gate: dict[str, Any]
    agent_output: dict[str, Any]
    report_context_package: dict[str, Any]


class UploadImageResponse(BaseModel):
    """Metadata returned after persisting one uploaded mandala image."""

    success: bool
    image_path: str
    storage_backend: str
    storage_key: str
    original_filename: str
    content_type: str | None = None
    size_bytes: int
    image_url: str | None = None
    image_local_expires_at: str | None = None


class SeededMandalaLLMClient:
    """Use supplied visual evidence while still allowing configured text generation."""

    def __init__(self, *, visual_observations: dict[str, Any], delegate: Any | None) -> None:
        self.visual_observations = visual_observations
        self.delegate = delegate
        self.last_attempt_trace = [{"source": "request.visual_observations"}]
        self.allow_seeded_short_report = delegate is None

    def generate_structured(
        self,
        *,
        task: str,
        prompt: str,
        schema: dict[str, Any],
        image_path: str | None = None,
        image_paths: list[str] | None = None,
    ) -> dict[str, Any]:
        return self.visual_observations

    def generate_text(
        self,
        *,
        task: str,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        if "生成圈内五行识别、圈内关系和三圈能量流动" in user_prompt:
            foundation = self.visual_observations.get("foundation_image_reading")
            if isinstance(foundation, dict):
                return json.dumps(
                    {
                        "element_sensing": foundation.get("element_sensing", {}),
                        "intra_circle_relations": foundation.get("intra_circle_relations", {}),
                        "cross_circle_flow": foundation.get("cross_circle_flow", {}),
                    },
                    ensure_ascii=False,
                )
        if self.delegate is not None:
            generated = self.delegate.generate_text(
                task=task,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
            if generated:
                return generated
        if "请从已有证据中选择报告切入点" in user_prompt:
            return json.dumps(
                {
                    "core_thesis": "画面显示财富议题里需要先稳住承载，再向外表达价值。",
                    "user_facing_framing": "这份解读会先看画面证据，再把它翻译到财富关系里。",
                    "healing_direction": "先降低紧绷和证明感，再练习稳定接住资源。",
                    "evidence_refs": ["inner-001", "middle-001", "outer-001"],
                },
                ensure_ascii=False,
            )
        report_mode = "pro" if '"report_mode": "pro"' in user_prompt else "lite"
        if report_mode == "pro":
            return load_prompt_template("fallback/seeded_report_pro.md")
        return load_prompt_template("fallback/seeded_report_lite.md")


def _build_llm_client(visual_observations: dict[str, Any] | None) -> Any:
    llm_client = create_llm_client_from_env()
    if visual_observations is None:
        if isinstance(llm_client, NoopLLMClient):
            raise HTTPException(
                status_code=501,
                detail="LLM runtime is not configured and visual_observations was not provided.",
            )
        return llm_client
    delegate = None if isinstance(llm_client, NoopLLMClient) else llm_client
    return SeededMandalaLLMClient(
        visual_observations=visual_observations,
        delegate=delegate,
    )


def _build_agent_input(payload: WealthReportRequest) -> MandalaAgentInput:
    return MandalaAgentInput(
        report_mode=payload.report_mode,
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
            forbidden_terms=["stage", "placeholder"],
        ),
    )


def _parse_redeem_code_config(raw_config: str) -> dict[str, set[str]]:
    """Parse CODE:lite,pro;OTHER:lite into a normalized code -> modes map."""

    codes: dict[str, set[str]] = {}
    for entry in raw_config.split(";"):
        normalized_entry = entry.strip()
        if not normalized_entry or ":" not in normalized_entry:
            continue
        code, modes = normalized_entry.split(":", 1)
        normalized_code = code.strip().upper()
        allowed_modes = {
            mode.strip().lower()
            for mode in modes.split(",")
            if mode.strip().lower() in {"lite", "pro"}
        }
        if normalized_code and allowed_modes:
            codes[normalized_code] = allowed_modes
    return codes


def _authorize_report_access(payload: WealthReportRequest) -> None:
    configured_codes = _parse_redeem_code_config(
        os.getenv("AIMANDALA_REDEEM_CODES", "")
    )
    submitted_code = payload.redeem_code.strip().upper()

    if not configured_codes:
        raise HTTPException(
            status_code=402,
            detail="报告生成需要先配置可用的优惠券或兑换码。",
        )

    if not submitted_code:
        raise HTTPException(
            status_code=402,
            detail="请输入有效的优惠券或兑换码后再生成报告。",
        )

    allowed_modes = configured_codes.get(submitted_code)
    if not allowed_modes or payload.report_mode not in allowed_modes:
        raise HTTPException(
            status_code=402,
            detail=f"兑换码无效或不适用于 {payload.report_mode.upper()} 报告。",
        )


@router.post("/wealth-reports", response_model=WealthReportResponse)
async def create_wealth_report(payload: WealthReportRequest) -> WealthReportResponse:
    """Generate one wealth-topic mandala report through the native agent path."""

    _authorize_report_access(payload)

    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    agent = MandalaInterpretationAgent(
        llm_client=_build_llm_client(payload.visual_observations)
    )
    result = agent.run(
        agent_input=_build_agent_input(payload),
        knowledge_pack=knowledge_pack,
    )
    wealth_runtime = get_wealth_report_runtime()
    route = wealth_runtime.route_visual_observations(
        result.report_context_package.get("foundation_image_reading", {}),
        report_mode=payload.report_mode,
    )
    if not result.quality_gate["passed"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "财富报告质量检查未通过。",
                "quality_gate": result.quality_gate,
                "agent_output": result.agent_output,
            },
        )
    return WealthReportResponse(
        success=result.quality_gate["passed"],
        report_id=str(result.final_report.get("report_id") or ""),
        topic="wealth",
        report_mode=payload.report_mode,
        final_report_md=result.final_report_md,
        final_report=result.final_report,
        selected_signal_ids=list(route.selected_signal_ids),
        selected_clause_ids=list(route.selected_clause_ids),
        selected_module_ids=list(route.selected_module_ids),
        boundaries=list(route.boundaries),
        topic_context=wealth_runtime.get_topic_context(report_mode=payload.report_mode),
        quality_gate=result.quality_gate,
        agent_output=result.agent_output,
        report_context_package=result.report_context_package,
    )


@router.post("/uploads", response_model=UploadImageResponse)
async def upload_image(file: UploadFile = File(...)) -> UploadImageResponse:
    """Persist one browser-uploaded mandala image for report generation."""

    content_type = (file.content_type or "").lower()
    if content_type and not content_type.startswith("image/"):
        await file.close()
        raise HTTPException(
            status_code=415,
            detail="Only image uploads are supported.",
        )

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
