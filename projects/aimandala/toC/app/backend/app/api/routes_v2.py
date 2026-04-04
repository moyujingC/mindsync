"""Minimal V2 API slice for the first AI-Mandala migration batch."""

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator

from .rate_limiter import pricing_endpoint_limit


class PricingInfo(BaseModel):
    """Current public pricing for the To C V2 flow."""

    lite: float = Field(default=9.9, description="一镜 Lite 版 price")
    pro: float = Field(default=49.0, description="一梳 Pro 版 price")
    upgrade_diff: float = Field(default=39.1, description="Legacy diff field kept for V2 compatibility")


router = APIRouter(prefix="/api/v2", tags=["aimandala-v2"])


@router.get("/pricing", response_model=PricingInfo)
@pricing_endpoint_limit()
async def get_pricing(request: Request):
    """Return the fixed V2 pricing baseline."""

    pricing = LayeredOrchestrator.get_pricing()
    return PricingInfo(**pricing.to_dict())
