"""Minimal V2 API slice for the first AI-Mandala migration batch."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator

from .rate_limiter import pricing_endpoint_limit


class CreateInterpretationRequest(BaseModel):
    """Minimal request to initialize a To C interpretation record."""

    user_id: str = Field(..., description="User identifier")
    image_path: str = Field(..., description="Local image path used during migration")
    theme: str = Field(default="general", description="Interpretation theme")
    painting_intention: Optional[str] = Field(
        default=None,
        description="Optional intention before painting",
    )
    painting_feeling: Optional[str] = Field(
        default=None,
        description="Optional feeling during painting",
    )
    inner_radius: Optional[int] = Field(
        default=None,
        description="Optional manually confirmed inner circle percentage",
    )
    middle_radius: Optional[int] = Field(
        default=None,
        description="Optional manually confirmed middle circle percentage",
    )


class CreateInterpretationResponse(BaseModel):
    """Minimal response for the migrated To C initialization flow."""

    success: bool = True
    interpretation_id: str
    version: str = "lite"
    status: str
    generation_stage: str
    generation_progress: int
    three_circles: dict
    auto_detected: bool
    existing: bool = False
    report_ready: bool = False


class InterpretationRecordResponse(BaseModel):
    """Minimal serialized interpretation record for the migrated V2 flow."""

    interpretation_id: str
    user_id: str
    theme: str
    status: str
    generation_stage: str
    generation_progress: int
    version_purchased: list[str]
    three_circles: dict
    auto_detected: bool
    can_upgrade: bool
    created_at: str


class ReportResponse(BaseModel):
    """Minimal report response for the migrated V2 flow."""

    interpretation_id: str
    version: str
    report: Optional[str] = None
    ai_qa_context: Optional[str] = None
    can_upgrade: bool = False
    upgrade_price: Optional[float] = None
    error: Optional[str] = None


class PricingInfo(BaseModel):
    """Current public pricing for the To C V2 flow."""

    lite: float = Field(default=9.9, description="一镜 Lite 版 price")
    pro: float = Field(default=49.0, description="一梳 Pro 版 price")
    upgrade_diff: float = Field(default=39.1, description="Legacy diff field kept for V2 compatibility")


router = APIRouter(prefix="/api/v2", tags=["aimandala-v2"])
_orchestrator: Optional[LayeredOrchestrator] = None


def get_orchestrator() -> LayeredOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = LayeredOrchestrator()
    return _orchestrator


def to_record_response(record) -> InterpretationRecordResponse:
    return InterpretationRecordResponse(
        interpretation_id=record.interpretation_id,
        user_id=record.user_id,
        theme=record.theme,
        status=record.status,
        generation_stage=record.generation_stage,
        generation_progress=record.generation_progress,
        version_purchased=record.version_purchased,
        three_circles=record.three_circles or {},
        auto_detected=record.three_circles_auto_detect is not None,
        can_upgrade=record.can_upgrade_to_pro(),
        created_at=record.created_at,
    )


@router.post("/interpretations", response_model=CreateInterpretationResponse)
async def create_interpretation(payload: CreateInterpretationRequest):
    """Initialize the migrated Lite record flow for a local image path."""

    orchestrator = get_orchestrator()
    manual_three_circles = None
    if payload.inner_radius is not None or payload.middle_radius is not None:
        if payload.inner_radius is None or payload.middle_radius is None:
            raise HTTPException(
                status_code=400,
                detail="inner_radius and middle_radius must be provided together",
            )
        manual_three_circles = {
            "inner_radius": payload.inner_radius,
            "middle_radius": payload.middle_radius,
        }

    image_hash = orchestrator._hash_image(payload.image_path)
    existing_record = orchestrator.store.find_existing_record(
        image_hash=image_hash,
        user_id=payload.user_id,
        theme=payload.theme,
    )

    if existing_record is not None:
        record = existing_record
    else:
        record = await orchestrator.generate_lite_placeholder(
            image_path=payload.image_path,
            user_id=payload.user_id,
            theme=payload.theme,
            painting_intention=payload.painting_intention,
            painting_feeling=payload.painting_feeling,
            three_circles=manual_three_circles,
            check_existing=False,
        )

    return CreateInterpretationResponse(
        interpretation_id=record.interpretation_id,
        status=record.status,
        generation_stage=record.generation_stage,
        generation_progress=record.generation_progress,
        three_circles=record.three_circles or {},
        auto_detected=record.three_circles_auto_detect is not None,
        existing=existing_record is not None,
        report_ready=record.layer_2_lite_final is not None,
    )


@router.get(
    "/interpretations/{interpretation_id}",
    response_model=InterpretationRecordResponse,
)
async def get_interpretation(interpretation_id: str):
    """Fetch a single migrated interpretation record."""

    record = get_orchestrator().store.load(interpretation_id)
    if record is None:
        raise HTTPException(status_code=404, detail="interpretation not found")
    return to_record_response(record)


@router.get(
    "/users/{user_id}/interpretations",
    response_model=list[InterpretationRecordResponse],
)
async def get_user_interpretations(user_id: str):
    """List migrated interpretation records for a user."""

    records = get_orchestrator().store.get_user_records(user_id=user_id)
    return [to_record_response(record) for record in records]


@router.get(
    "/interpretations/{interpretation_id}/report",
    response_model=ReportResponse,
)
async def get_report(interpretation_id: str, version: Optional[str] = None):
    """Fetch the currently available report view for a migrated record."""

    result = get_orchestrator().get_report(interpretation_id, version)
    if result is None:
        raise HTTPException(status_code=404, detail="interpretation not found")

    return ReportResponse(
        interpretation_id=interpretation_id,
        version=result.get("version", version or "lite"),
        report=result.get("report"),
        ai_qa_context=result.get("ai_qa_context"),
        can_upgrade=result.get("can_upgrade", False),
        upgrade_price=result.get("upgrade_price"),
        error=result.get("error"),
    )


@router.get("/pricing", response_model=PricingInfo)
@pricing_endpoint_limit()
async def get_pricing(request: Request):
    """Return the fixed V2 pricing baseline."""

    pricing = get_orchestrator().get_pricing()
    return PricingInfo(**pricing.to_dict())
