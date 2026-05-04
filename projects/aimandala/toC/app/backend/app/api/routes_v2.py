"""Minimal V2 API slice for the first AI-Mandala migration batch."""

import os
import threading
from typing import Literal, Optional

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.core.analysis.circle_detector import CircleDetector
from app.core.llm import (
    LLMReportChatRuntime,
    NoopLLMClient,
    create_llm_client_from_env,
)
from app.core.pipeline.generation_runtime import DeterministicReportGenerationRuntime
from app.core.miniapp_runtime import (
    build_wechatpay_payload,
    exchange_wechat_session,
    get_miniapp_gray_config,
)
from app.core.knowledge_runtime.workbench import KnowledgeWorkbench
from app.core.miniapp_stub_store import MiniappStubStore
from app.core.pipeline.data_models import GenerationStatus
from app.core.pipeline.orchestrator_v2 import GenerationStage, LayeredOrchestrator
from app.core.pipeline.store import UnsupportedInterpretationSchemaError
from app.core.uploads import LocalUploadStorage, UploadStorage, create_upload_storage_from_env

from .rate_limiter import pricing_endpoint_limit


class CreateInterpretationRequest(BaseModel):
    """Request to initialize one formal To C interpretation record."""

    user_id: str = Field(..., description="User identifier")
    image_path: str = Field(..., description="Runtime-readable local image cache path")
    image_url: Optional[str] = Field(
        default=None,
        description="Temporary image access URL kept only for backward compatibility",
    )
    storage_backend: Optional[str] = Field(
        default=None,
        description="Formal upload storage backend name (long-lived identity field)",
    )
    storage_key: Optional[str] = Field(
        default=None,
        description="Formal upload storage key for lifecycle tracking and URL refresh",
    )
    image_local_expires_at: Optional[str] = Field(
        default=None,
        description="Local runtime cache expiry timestamp in ISO-8601 format",
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
    upgrade_history: list[dict] = []
    image_url: Optional[str] = None
    storage_backend: Optional[str] = None
    storage_key: Optional[str] = None
    image_local_expires_at: Optional[str] = None


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
    image_url: Optional[str] = None
    storage_backend: Optional[str] = None
    storage_key: Optional[str] = None
    image_local_expires_at: Optional[str] = None


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
    image_url: Optional[str] = None
    storage_backend: Optional[str] = None
    storage_key: Optional[str] = None
    image_local_expires_at: Optional[str] = None


class ReportDebugProfileResponse(BaseModel):
    """Development-oriented payload describing report generation internals."""

    interpretation_id: str
    theme: str
    status: str
    generation_stage: str
    generation_progress: int
    version_purchased: list[str]
    steps: list[dict]
    layers: dict
    field_provenance: dict
    diagnostics: dict
    prompt_debug: dict
    knowledge_debug: Optional[dict] = None
    insight_context_summary: Optional[dict] = None
    evidence_summary: Optional[dict] = None
    fallback_summary: Optional[dict] = None


class KnowledgeBuildSummaryResponse(BaseModel):
    """Knowledge workbench summary for one compiled build selector."""

    build_info: dict
    quality: dict
    eval_summary: Optional[dict] = None


class KnowledgeFixturePreviewRequest(BaseModel):
    """Input for local fixture preview against one build selector."""

    fixture_id: str
    build_selector: str
    version: Literal["lite", "pro"] = "lite"


class KnowledgeFixturePreviewResponse(BaseModel):
    """Local fixture preview output for the knowledge workbench."""

    fixture_meta: dict
    report_summary: dict
    knowledge_summary: dict
    regression_flags: list[str]
    diff_from_current: Optional[dict] = None


class ReportChatMessage(BaseModel):
    """Minimal chat message used by the Pro report follow-up QA endpoint."""

    role: Literal["user", "assistant"]
    content: str = Field(..., description="Chat message content")


class ReportChatRequest(BaseModel):
    """Request payload for report-grounded follow-up QA."""

    message: str = Field(..., description="Current user question about the report")
    history: list[ReportChatMessage] = Field(
        default_factory=list,
        description="Previous chat messages, ordered from oldest to newest",
    )


class ReportChatResponse(BaseModel):
    """LLM reply grounded in the interpretation report."""

    interpretation_id: str
    reply: str


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
    pro: float = Field(default=39.0, description="一梳 Pro 版 price")
    upgrade_diff: float = Field(default=39.1, description="Legacy diff field kept for V2 compatibility")


class MiniappSessionExchangeRequest(BaseModel):
    code: Optional[str] = None
    open_id: Optional[str] = None
    debug_canonical_user_id: Optional[str] = None


class MiniappSessionExchangeResponse(BaseModel):
    canonical_user_id: str
    open_id: str
    session_id: Optional[str] = None
    linked: bool
    is_new_user: Optional[bool] = None
    display_label: Optional[str] = None


class StubWechatPayPayload(BaseModel):
    mode: Literal["stub"] = "stub"
    order_id: str
    next_action: Literal["reconcile_after_host_payment"] = "reconcile_after_host_payment"


class WechatPayRequestPaymentArgs(BaseModel):
    timeStamp: str
    nonceStr: str
    package: str
    signType: str
    paySign: str


class WechatPayHostPayload(BaseModel):
    mode: Literal["wechatpay"] = "wechatpay"
    order_id: str
    next_action: Literal["wait_for_payment_confirmation"] = "wait_for_payment_confirmation"
    dry_run: bool
    request_payment_args: WechatPayRequestPaymentArgs


class CreateMiniappOrderRequest(BaseModel):
    interpretation_id: str
    product_type: Literal["lite", "pro"]
    channel: Literal["miniapp"]
    open_id: Optional[str] = None
    debug_canonical_user_id: Optional[str] = None


class MiniappOrderResponse(BaseModel):
    order_id: str
    interpretation_id: str
    product_type: Literal["lite", "pro"]
    channel: Literal["miniapp"]
    purchase_state: Literal["created", "pending", "paid", "failed", "cancelled", "fulfilled"]
    payable_amount: float
    currency: str
    version_granted: Optional[list[Literal["lite", "pro"]]] = None
    latest_purchase_updated_at: Optional[str] = None
    wechat_pay_payload: Optional[StubWechatPayPayload | WechatPayHostPayload] = None


class ReconcileMiniappOrderResponse(MiniappOrderResponse):
    reconciled: bool


class NotifyMiniappWechatPaymentRequest(BaseModel):
    order_id: str
    event: Literal["paid", "failed", "cancelled"]
    payment_reference: Optional[str] = None
    raw_payload: Optional[dict] = None


class UploadImageResponse(BaseModel):
    """Response returned after persisting one browser upload under the formal contract."""

    success: bool = True
    image_path: str
    storage_backend: str
    storage_key: str
    original_filename: str
    content_type: Optional[str] = None
    size_bytes: int
    # Temporary access URL. Long-lived identity lives in storage_backend + storage_key.
    image_url: Optional[str] = None
    image_local_expires_at: Optional[str] = None


router = APIRouter(prefix="/api/v2", tags=["aimandala-v2"])
_orchestrator: Optional[LayeredOrchestrator] = None
_upload_storage: Optional[UploadStorage] = None
_knowledge_workbench: Optional[KnowledgeWorkbench] = None
_miniapp_stub_store: Optional[MiniappStubStore] = None
_active_pro_upgrade_jobs: set[str] = set()
_pro_upgrade_jobs_lock = threading.Lock()


def get_orchestrator() -> LayeredOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        try:
            llm_client = create_llm_client_from_env()
            is_noop = isinstance(llm_client, NoopLLMClient)
            report_chat_runtime = (
                LLMReportChatRuntime(llm_client)
                if not is_noop
                else None
            )
            _orchestrator = LayeredOrchestrator(
                circle_detector=CircleDetector(),
                report_chat_runtime=report_chat_runtime,
                enable_vision=not is_noop,
                generation_runtime=(
                    DeterministicReportGenerationRuntime()
                    if is_noop
                    else None
                ),
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


def get_knowledge_workbench() -> KnowledgeWorkbench:
    global _knowledge_workbench
    if _knowledge_workbench is None:
        _knowledge_workbench = KnowledgeWorkbench()
    return _knowledge_workbench


def get_miniapp_stub_store() -> MiniappStubStore:
    global _miniapp_stub_store
    if _miniapp_stub_store is None:
        _miniapp_stub_store = MiniappStubStore()
    return _miniapp_stub_store


def _ensure_debug_workbench_enabled() -> None:
    enabled = str(os.getenv("AIMANDALA_ENABLE_DEBUG_WORKBENCH", "")).strip().lower()
    if enabled not in {"1", "true", "yes", "on"}:
        raise HTTPException(status_code=404, detail="knowledge debug workbench is disabled")


def _mark_pro_upgrade_failed(interpretation_id: str, error: Exception) -> None:
    orchestrator = get_orchestrator()
    try:
        record = orchestrator.store.load(interpretation_id)
    except UnsupportedInterpretationSchemaError:
        return
    if record is None:
        return

    record.status = GenerationStatus.FAILED
    record.update_progress(GenerationStage.FAILED.value, record.generation_progress or 85)
    orchestrator.store.save(record)
    print(f"Pro upgrade failed for {interpretation_id}: {error}")


def _run_pro_upgrade_job(interpretation_id: str) -> None:
    try:
        get_orchestrator().complete_pro_upgrade(interpretation_id)
    except Exception as error:  # pragma: no cover - defensive background fallback
        _mark_pro_upgrade_failed(interpretation_id, error)
    finally:
        with _pro_upgrade_jobs_lock:
            _active_pro_upgrade_jobs.discard(interpretation_id)


def _ensure_pro_upgrade_job(interpretation_id: str) -> None:
    with _pro_upgrade_jobs_lock:
        if interpretation_id in _active_pro_upgrade_jobs:
            return
        _active_pro_upgrade_jobs.add(interpretation_id)

    threading.Thread(
        target=_run_pro_upgrade_job,
        args=(interpretation_id,),
        daemon=True,
    ).start()


def _resolve_record_image_url(
    request: Request | None,
    *,
    storage_backend: str | None,
    storage_key: str | None,
) -> str | None:
    if not storage_backend or not storage_key:
        return None

    if storage_backend == "local":
        if request is None:
            return None
        return str(request.url_for("get_uploaded_image", storage_key=storage_key))

    storage = get_upload_storage()
    if storage_backend == "cos" and hasattr(storage, "build_temporary_url"):
        return storage.build_temporary_url(storage_key)

    return None


def _to_miniapp_order_response(record) -> MiniappOrderResponse:
    payload = None
    if record.wechat_pay_payload:
        if record.wechat_pay_payload.get("mode") == "wechatpay":
            payload = WechatPayHostPayload(**record.wechat_pay_payload)
        else:
            payload = StubWechatPayPayload(**record.wechat_pay_payload)

    return MiniappOrderResponse(
        order_id=record.order_id,
        interpretation_id=record.interpretation_id,
        product_type=record.product_type,
        channel=record.channel,
        purchase_state=record.purchase_state,
        payable_amount=record.payable_amount,
        currency=record.currency,
        version_granted=record.version_granted,
        latest_purchase_updated_at=record.latest_purchase_updated_at,
        wechat_pay_payload=payload,
    )


def _resolve_stub_purchase_amount(record, product_type: str) -> float:
    pricing = get_orchestrator().get_pricing()
    if product_type == "lite":
        return pricing.lite
    return pricing.pro


def _resolve_canonical_user_id(
    *,
    open_id: str | None,
    debug_canonical_user_id: str | None,
) -> str | None:
    if debug_canonical_user_id:
        return debug_canonical_user_id
    if open_id:
        return f"wechat:{open_id}"
    return None


def _apply_miniapp_purchase(record, product_type: str) -> None:
    if product_type not in record.version_purchased:
        record.version_purchased.append(product_type)


def to_record_response(request: Request | None, record) -> InterpretationRecordResponse:
    report_ready = _is_history_record_ready(record)
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
        upgrade_history=[history.to_dict() for history in record.upgrade_history],
        image_url=_resolve_record_image_url(
            request,
            storage_backend=record.image_storage_backend,
            storage_key=record.image_storage_key,
        ),
        storage_backend=record.image_storage_backend,
        storage_key=record.image_storage_key,
        image_local_expires_at=record.image_local_expires_at,
    )


def _has_pro_generation_in_progress(record) -> bool:
    return "pro" in record.version_purchased and record.get_pro_report() is None


def _is_history_record_ready(record) -> bool:
    if _has_pro_generation_in_progress(record):
        return False
    return record.layer_2_lite_final is not None


def _load_record_or_http_error(interpretation_id: str):
    try:
        record = get_orchestrator().store.load(interpretation_id)
    except UnsupportedInterpretationSchemaError as error:
        raise HTTPException(status_code=410, detail=str(error)) from error
    if record is None:
        raise HTTPException(status_code=404, detail="interpretation not found")
    return record


@router.post("/detect-circles", response_model=DetectCirclesResponse)
async def detect_circles(payload: DetectCirclesRequest):
    """Run the migrated three-circle detector as a standalone API."""

    result = await get_orchestrator().detect_three_circles(
        image_path=payload.image_path,
        confidence_threshold=payload.confidence_threshold,
    )
    return DetectCirclesResponse(**result.to_dict())


@router.post(
    "/miniapp/session/exchange",
    response_model=MiniappSessionExchangeResponse,
)
async def exchange_miniapp_session(payload: MiniappSessionExchangeRequest):
    code = (payload.code or "").strip()
    open_id = (payload.open_id or "").strip()
    debug_canonical_user_id = (payload.debug_canonical_user_id or "").strip()

    if not code and not open_id and not debug_canonical_user_id:
        raise HTTPException(
            status_code=400,
            detail="At least one of code, open_id, or debug_canonical_user_id is required",
        )

    gray = get_miniapp_gray_config()
    if debug_canonical_user_id:
        resolved_open_id = open_id or MiniappStubStore.build_stub_open_id(code or debug_canonical_user_id)
    elif open_id:
        resolved_open_id = open_id
    elif gray.miniapp_live_enabled and gray.wechat_session_enabled and code:
        session_info = exchange_wechat_session(code)
        resolved_open_id = session_info.open_id
    else:
        resolved_open_id = MiniappStubStore.build_stub_open_id(code)

    if debug_canonical_user_id:
        canonical_user_id = debug_canonical_user_id
        linked = True
        is_new_user = False
        display_label = debug_canonical_user_id
    else:
        canonical_user_id = f"wechat:{resolved_open_id}"
        linked = False
        is_new_user = True
        display_label = f"微信访客 {resolved_open_id[-6:]}"

    return MiniappSessionExchangeResponse(
        canonical_user_id=canonical_user_id,
        open_id=resolved_open_id,
        session_id=MiniappStubStore.build_session_id(
            resolved_open_id,
            canonical_user_id,
        ),
        linked=linked,
        is_new_user=is_new_user,
        display_label=display_label,
    )


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
    """Store a browser upload and return the long-lived storage contract metadata."""

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


@router.post(
    "/miniapp/orders",
    response_model=MiniappOrderResponse,
)
async def create_miniapp_order(payload: CreateMiniappOrderRequest):
    record = _load_record_or_http_error(payload.interpretation_id)
    gray = get_miniapp_gray_config()
    canonical_user_id = _resolve_canonical_user_id(
        open_id=payload.open_id,
        debug_canonical_user_id=payload.debug_canonical_user_id,
    )
    order = get_miniapp_stub_store().create_order(
        interpretation_id=payload.interpretation_id,
        product_type=payload.product_type,
        channel=payload.channel,
        payable_amount=_resolve_stub_purchase_amount(record, payload.product_type),
        currency="CNY",
        wechat_pay_payload={},
        open_id=payload.open_id,
        debug_canonical_user_id=payload.debug_canonical_user_id,
        canonical_user_id=canonical_user_id,
    )
    if gray.miniapp_live_enabled and gray.wechat_pay_enabled:
        order.wechat_pay_payload = build_wechatpay_payload(
            order_id=order.order_id,
            payable_amount=order.payable_amount,
            dry_run=not bool(payload.open_id),
        ).to_dict()
    else:
        order.wechat_pay_payload = {
            "mode": "stub",
            "order_id": order.order_id,
            "next_action": "reconcile_after_host_payment",
        }
    get_miniapp_stub_store().save_order(order)
    return _to_miniapp_order_response(order)


@router.post("/interpretations", response_model=CreateInterpretationResponse)
async def create_interpretation(payload: CreateInterpretationRequest):
    """Initialize one Lite interpretation using the formal upload/report contract."""

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
        try:
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
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

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
async def get_interpretation(interpretation_id: str, request: Request):
    """Fetch a single migrated interpretation record."""

    return to_record_response(request, _load_record_or_http_error(interpretation_id))


@router.get(
    "/interpretations/{interpretation_id}/status",
    response_model=InterpretationStatusResponse,
)
async def get_interpretation_status(interpretation_id: str, request: Request):
    """Fetch a polling-friendly status snapshot for a migrated record."""

    try:
        result = get_orchestrator().get_status(interpretation_id)
    except UnsupportedInterpretationSchemaError as error:
        raise HTTPException(status_code=410, detail=str(error)) from error
    if result is None:
        raise HTTPException(status_code=404, detail="interpretation not found")
    record = _load_record_or_http_error(interpretation_id)
    return InterpretationStatusResponse(
        **result,
        image_url=_resolve_record_image_url(
            request,
            storage_backend=record.image_storage_backend,
            storage_key=record.image_storage_key,
        ),
        storage_backend=record.image_storage_backend,
        storage_key=record.image_storage_key,
        image_local_expires_at=record.image_local_expires_at,
    )


@router.get(
    "/users/{user_id}/interpretations",
    response_model=list[InterpretationRecordResponse],
)
async def get_user_interpretations(
    request: Request,
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
        records = [record for record in records if _is_history_record_ready(record)]
    elif filter == "pending":
        records = [record for record in records if not _is_history_record_ready(record)]
    return [to_record_response(request, record) for record in records[:limit]]


@router.get(
    "/miniapp/orders/{order_id}",
    response_model=MiniappOrderResponse,
)
async def get_miniapp_order(order_id: str):
    record = get_miniapp_stub_store().load_order(order_id)
    if record is None:
        raise HTTPException(status_code=404, detail="miniapp order not found")
    return _to_miniapp_order_response(record)


@router.post(
    "/miniapp/orders/{order_id}/reconcile",
    response_model=ReconcileMiniappOrderResponse,
)
async def reconcile_miniapp_order(order_id: str):
    record = get_miniapp_stub_store().load_order(order_id)
    if record is None:
        raise HTTPException(status_code=404, detail="miniapp order not found")

    reconciled = False
    if record.purchase_state == "paid":
        interpretation_record = _load_record_or_http_error(record.interpretation_id)
        _apply_miniapp_purchase(interpretation_record, record.product_type)
        get_orchestrator().store.save(interpretation_record)
        if record.product_type == "pro":
            get_orchestrator().fulfill_direct_pro_purchase(record.interpretation_id)
        record = get_miniapp_stub_store().update_order_state(
            order_id,
            purchase_state="fulfilled",
            version_granted=[record.product_type],
        )
        reconciled = True

    assert record is not None
    response = _to_miniapp_order_response(record)
    return ReconcileMiniappOrderResponse(
        **response.model_dump(),
        reconciled=reconciled,
    )


@router.post(
    "/miniapp/payments/wechat/notify",
    response_model=MiniappOrderResponse,
)
async def notify_miniapp_wechat_payment(payload: NotifyMiniappWechatPaymentRequest):
    record = get_miniapp_stub_store().update_order_state(
        payload.order_id,
        purchase_state=payload.event,
        payment_reference=payload.payment_reference,
        raw_payload=payload.raw_payload,
    )
    if record is None:
        raise HTTPException(status_code=404, detail="miniapp order not found")
    return _to_miniapp_order_response(record)


@router.get(
    "/interpretations/{interpretation_id}/report",
    response_model=ReportResponse,
)
async def get_report(
    interpretation_id: str,
    request: Request,
    version: Optional[str] = None,
):
    """Fetch the currently available report view for a migrated record."""

    try:
        result = get_orchestrator().get_report(interpretation_id, version)
    except UnsupportedInterpretationSchemaError as error:
        raise HTTPException(status_code=410, detail=str(error)) from error
    if result is None:
        raise HTTPException(status_code=404, detail="interpretation not found")
    record = _load_record_or_http_error(interpretation_id)

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
        image_url=_resolve_record_image_url(
            request,
            storage_backend=record.image_storage_backend,
            storage_key=record.image_storage_key,
        ),
        storage_backend=record.image_storage_backend,
        storage_key=record.image_storage_key,
        image_local_expires_at=record.image_local_expires_at,
    )


@router.get(
    "/interpretations/{interpretation_id}/report-debug",
    response_model=ReportDebugProfileResponse,
)
async def get_report_debug_profile(interpretation_id: str):
    """Return development-only insight into intermediate report generation layers."""

    try:
        result = get_orchestrator().get_report_debug_profile(interpretation_id)
    except UnsupportedInterpretationSchemaError as error:
        raise HTTPException(status_code=410, detail=str(error)) from error
    if result is None:
        raise HTTPException(status_code=404, detail="interpretation not found")
    return ReportDebugProfileResponse(**result)


@router.get(
    "/debug/knowledge/build-summary",
    response_model=KnowledgeBuildSummaryResponse,
)
async def get_knowledge_build_summary(
    build: str = Query(default="current"),
):
    """Return one build summary for the local knowledge debug workbench."""

    _ensure_debug_workbench_enabled()
    try:
        result = await get_knowledge_workbench().ensure_build_summary(build)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return KnowledgeBuildSummaryResponse(**result)


@router.post(
    "/debug/knowledge/fixture-preview",
    response_model=KnowledgeFixturePreviewResponse,
)
async def preview_knowledge_fixture(payload: KnowledgeFixturePreviewRequest):
    """Run one fixed fixture against one build selector for local diff/debug."""

    _ensure_debug_workbench_enabled()
    try:
        result = await get_knowledge_workbench().preview_fixture(
            fixture_id=payload.fixture_id,
            build_selector=payload.build_selector,
            version=payload.version,
            compare_to_current=payload.build_selector != "current",
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return KnowledgeFixturePreviewResponse(**result)


@router.post(
    "/interpretations/{interpretation_id}/chat",
    response_model=ReportChatResponse,
)
async def chat_with_report(interpretation_id: str, payload: ReportChatRequest):
    """Answer follow-up questions grounded in the current interpretation report."""

    serialized_history = [
        item.model_dump() if hasattr(item, "model_dump") else item.dict()
        for item in payload.history
    ]
    try:
        result = get_orchestrator().answer_report_chat(
            interpretation_id,
            message=payload.message,
            history=serialized_history,
        )
    except UnsupportedInterpretationSchemaError as error:
        raise HTTPException(status_code=410, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    if result is None:
        raise HTTPException(status_code=404, detail="interpretation not found")
    return ReportChatResponse(**result)


@router.post(
    "/interpretations/{interpretation_id}/upgrade",
    response_model=UpgradePlaceholderResponse,
)
async def upgrade_interpretation_placeholder(interpretation_id: str):
    """Compatibility-only placeholder for the retired upgrade purchase path."""

    _load_record_or_http_error(interpretation_id)
    return UpgradePlaceholderResponse(
        success=True,
        interpretation_id=interpretation_id,
        version="pro",
        enabled=False,
        status="disabled",
        message="当前产品语义已收束为 Lite / Pro 独立购买，请通过版本选择页或 miniapp 订单链路直接购买 Pro。",
    )


@router.get("/pricing", response_model=PricingInfo)
@pricing_endpoint_limit()
async def get_pricing(request: Request):
    """Return the fixed V2 pricing baseline."""

    pricing = get_orchestrator().get_pricing()
    return PricingInfo(**pricing.to_dict())
