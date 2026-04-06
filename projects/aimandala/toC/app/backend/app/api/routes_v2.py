"""Minimal V2 API slice for the first AI-Mandala migration batch."""

from typing import Literal, Optional

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
from app.core.pipeline.prompt_runtime import create_prompt_runtime_from_env
from app.core.uploads import LocalUploadStorage, UploadStorage, create_upload_storage_from_env

from .rate_limiter import pricing_endpoint_limit


class CreateInterpretationRequest(BaseModel):
    """Minimal request to initialize a To C interpretation record."""

    user_id: str = Field(..., description="User identifier")
    image_path: str = Field(..., description="Local image path used during migration")
    image_url: Optional[str] = Field(
        default=None,
        description="Public image URL returned by upload storage backend",
    )
    storage_backend: Optional[str] = Field(
        default=None,
        description="Upload storage backend name (local/s3/oss/cos/path)",
    )
    storage_key: Optional[str] = Field(
        default=None,
        description="Upload storage key for lifecycle tracking",
    )
    image_local_expires_at: Optional[str] = Field(
        default=None,
        description="Local temporary file expiry timestamp in ISO-8601 format",
    )
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


class DetectCirclesRequest(BaseModel):
    """Minimal request for standalone three-circle detection."""

    image_path: str = Field(..., description="Local image path used during migration")
    confidence_threshold: float = Field(
        default=0.3,
        description="Threshold passed to the migrated detector shell",
    )


class DetectCirclesResponse(BaseModel):
    """Normalized standalone three-circle detection response."""

    inner_radius: float
    middle_radius: float
    confidence: float
    method: str
    geometry_suggestion: Optional[dict] = None
    debug_info: Optional[dict] = None


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


class InterpretationStatusResponse(BaseModel):
    """Compact status payload for polling interpretation progress."""

    interpretation_id: str
    status: str
    generation_stage: str
    generation_progress: int
    report_ready: bool
    version_purchased: list[str]
    three_circles: dict
    auto_detected: bool
    can_upgrade: bool


class ReportResponse(BaseModel):
    """Minimal report response for the migrated V2 flow."""

    interpretation_id: str
    version: str
    title: Optional[str] = None
    overall_impression: Optional[str] = None
    structured: Optional[dict] = None
    report: Optional[str] = None
    ai_qa_context: Optional[str] = None
    can_upgrade: bool = False
    upgrade_price: Optional[float] = None
    error: Optional[str] = None


class UpgradePlaceholderResponse(BaseModel):
    """Compatibility-only response for the legacy V2 upgrade endpoint."""

    success: bool
    interpretation_id: str
    version: str = "pro"
    enabled: bool = False
    status: str
    message: str


class PricingInfo(BaseModel):
    """Current public pricing for the To C V2 flow."""

    lite: float = Field(default=9.9, description="一镜 Lite 版 price")
    pro: float = Field(default=49.0, description="一梳 Pro 版 price")
    upgrade_diff: float = Field(default=39.1, description="Legacy diff field kept for V2 compatibility")


class UploadImageResponse(BaseModel):
    """Response returned after storing a browser-uploaded image locally."""

    success: bool = True
    image_path: str
    storage_backend: str
    storage_key: str
    original_filename: str
    content_type: Optional[str] = None
    size_bytes: int
    image_url: Optional[str] = None
    image_local_expires_at: Optional[str] = None


router = APIRouter(prefix="/api/v2", tags=["aimandala-v2"])
_orchestrator: Optional[LayeredOrchestrator] = None
_upload_storage: Optional[UploadStorage] = None


def get_orchestrator() -> LayeredOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        try:
            _orchestrator = LayeredOrchestrator(
                prompt_runtime=create_prompt_runtime_from_env(),
            )
        except ValueError as error:
            raise HTTPException(status_code=501, detail=str(error)) from error
    return _orchestrator


def get_upload_storage() -> UploadStorage:
    global _upload_storage
    if _upload_storage is None:
        try:
            _upload_storage = create_upload_storage_from_env()
        except ValueError as error:
            raise HTTPException(status_code=501, detail=str(error)) from error
    return _upload_storage


def to_record_response(record) -> InterpretationRecordResponse:
    report_ready = record.layer_2_lite_final is not None
    return InterpretationRecordResponse(
        interpretation_id=record.interpretation_id,
        user_id=record.user_id,
        theme=record.theme,
        status=record.status,
        generation_stage="completed" if report_ready else record.generation_stage,
        generation_progress=100 if report_ready else record.generation_progress,
        version_purchased=record.version_purchased,
        three_circles=record.three_circles or {},
        auto_detected=record.three_circles_auto_detect is not None,
        can_upgrade=record.can_upgrade_to_pro(),
        created_at=record.created_at,
    )


@router.post("/detect-circles", response_model=DetectCirclesResponse)
async def detect_circles(payload: DetectCirclesRequest):
    """Run the migrated three-circle detector as a standalone API."""

    result = await get_orchestrator().detect_three_circles(
        image_path=payload.image_path,
        confidence_threshold=payload.confidence_threshold,
    )
    return DetectCirclesResponse(**result.to_dict())


@router.get("/uploads/{storage_key}", name="get_uploaded_image")
async def get_uploaded_image(storage_key: str):
    """Serve a locally stored migration-time browser upload back to the client."""

    storage = get_upload_storage()
    if not isinstance(storage, LocalUploadStorage):
        raise HTTPException(status_code=404, detail="Local upload serving is not enabled")

    try:
        file_path = storage.resolve_storage_path(storage_key)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Uploaded file not found")

    return FileResponse(path=file_path, filename=file_path.name)


@router.post("/upload-image", response_model=UploadImageResponse)
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Store a browser-uploaded image locally and return a migrated image path."""

    try:
        stored = await get_upload_storage().save_upload(file)
    except NotImplementedError as error:
        raise HTTPException(status_code=501, detail=str(error)) from error

    return UploadImageResponse(
        image_path=stored.image_path,
        storage_backend=stored.storage_backend,
        storage_key=stored.storage_key,
        original_filename=stored.original_filename,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        image_local_expires_at=stored.local_expires_at,
        image_url=(
            stored.image_url
            or str(request.url_for("get_uploaded_image", storage_key=stored.storage_key))
            if stored.storage_backend == "local"
            else stored.image_url
        ),
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
            image_url=payload.image_url,
            image_storage_backend=payload.storage_backend,
            image_storage_key=payload.storage_key,
            image_local_expires_at=payload.image_local_expires_at,
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
    "/interpretations/{interpretation_id}/status",
    response_model=InterpretationStatusResponse,
)
async def get_interpretation_status(interpretation_id: str):
    """Fetch a polling-friendly status snapshot for a migrated record."""

    result = get_orchestrator().get_status(interpretation_id)
    if result is None:
        raise HTTPException(status_code=404, detail="interpretation not found")
    return InterpretationStatusResponse(**result)


@router.get(
    "/users/{user_id}/interpretations",
    response_model=list[InterpretationRecordResponse],
)
async def get_user_interpretations(
    user_id: str,
    filter: Literal["all", "ready", "pending"] = "all",
    limit: int = Query(default=10, ge=1, le=100),
    theme: Optional[str] = None,
):
    """List migrated interpretation records for a user."""

    records = get_orchestrator().store.get_user_records(user_id=user_id, limit=None)
    if theme:
        records = [record for record in records if record.theme == theme]
    if filter == "ready":
        records = [record for record in records if record.layer_2_lite_final is not None]
    elif filter == "pending":
        records = [record for record in records if record.layer_2_lite_final is None]
    return [to_record_response(record) for record in records[:limit]]


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
        title=result.get("title"),
        overall_impression=result.get("overall_impression"),
        structured=result.get("structured"),
        report=result.get("report"),
        ai_qa_context=result.get("ai_qa_context"),
        can_upgrade=result.get("can_upgrade", False),
        upgrade_price=result.get("upgrade_price"),
        error=result.get("error"),
    )


@router.post(
    "/interpretations/{interpretation_id}/upgrade",
    response_model=UpgradePlaceholderResponse,
)
async def upgrade_interpretation_placeholder(interpretation_id: str):
    """Upgrade a migrated Lite record into the current Pro placeholder flow."""

    try:
        result = get_orchestrator().upgrade_to_pro(interpretation_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if result is None:
        raise HTTPException(status_code=404, detail="interpretation not found")
    return UpgradePlaceholderResponse(**result)


@router.get("/pricing", response_model=PricingInfo)
@pricing_endpoint_limit()
async def get_pricing(request: Request):
    """Return the fixed V2 pricing baseline."""

    pricing = get_orchestrator().get_pricing()
    return PricingInfo(**pricing.to_dict())
