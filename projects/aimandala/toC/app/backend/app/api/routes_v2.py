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


@router.post("/interpretations", response_model=CreateInterpretationResponse)
async def create_interpretation(payload: CreateInterpretationRequest):
    """Initialize the migrated Lite record flow for a local image path."""

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

    record = await get_orchestrator().prepare_lite_record(
        image_path=payload.image_path,
        user_id=payload.user_id,
        theme=payload.theme,
        painting_intention=payload.painting_intention,
        painting_feeling=payload.painting_feeling,
        three_circles=manual_three_circles,
    )

    return CreateInterpretationResponse(
        interpretation_id=record.interpretation_id,
        status=record.status,
        generation_stage=record.generation_stage,
        generation_progress=record.generation_progress,
        three_circles=record.three_circles or {},
        auto_detected=record.three_circles_auto_detect is not None,
    )


@router.get("/pricing", response_model=PricingInfo)
@pricing_endpoint_limit()
async def get_pricing(request: Request):
    """Return the fixed V2 pricing baseline."""

    pricing = get_orchestrator().get_pricing()
    return PricingInfo(**pricing.to_dict())
