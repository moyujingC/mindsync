"""Minimal V2 API slice for the first AI-Mandala migration batch."""

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from .rate_limiter import pricing_endpoint_limit


class PricingInfo(BaseModel):
    """Current public pricing for the To C V2 flow."""

    lite: float = Field(default=9.9, description="Lite version price")
    pro: float = Field(default=49.0, description="Pro version price")
    upgrade_diff: float = Field(default=39.1, description="Upgrade price diff")


router = APIRouter(prefix="/api/v2", tags=["aimandala-v2"])


@router.get("/pricing", response_model=PricingInfo)
@pricing_endpoint_limit()
async def get_pricing(request: Request):
    """Return the fixed V2 pricing baseline."""

    return PricingInfo()
