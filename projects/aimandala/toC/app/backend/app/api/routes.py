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
    ) -> dict[str, Any]:
        return self.visual_observations

    def generate_text(
        self,
        *,
        task: str,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        if self.delegate is not None:
            generated = self.delegate.generate_text(
                task=task,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
            if generated:
                return generated
        if "请从已有证据中选择报告主轴" in user_prompt:
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
            return (
                "# 财富议题曼陀罗解读报告\n\n"
                "## 画面证据总览\n"
                "从已提供的画面观察看，内圈蓝色圆形呈现出明显的收束感，中圈粉色花瓣带出情绪和关系层面的拉扯，外圈白色边界与留白则显示现实互动中的谨慎。"
                "这三组证据共同说明，财富议题并不是单纯发生在钱的数字上，而是同时牵动内在稳定、情绪承接和现实交换边界。\n\n"
                "## 财富核心主轴\n"
                "这幅画的核心财富主轴是：先稳住承载，再让价值进入外部交换。你并不是没有资源，也不是没有表达欲，而是在资源真正流向外界之前，会先确认自己是否安全、是否能接住回应。\n\n"
                "## 三圈分层解读\n"
                "内圈的收束感提示你需要一个稳定的价值核心；中圈的粉色花瓣说明情绪、人际反馈和被看见的感受会影响行动节奏；外圈的留白和边界则对应现实中的报价、合作、机会选择和资源接收。"
                "当这三层没有形成顺畅通道时，财富流动就容易停在想法、计划或自我保护里。\n\n"
                "## 浮现议题回译\n"
                "如果这里浮现出关系、情绪或自我怀疑，它们需要被翻译回财富主线：关系议题关乎你是否敢被看见，情绪议题关乎你是否能承接交换压力，自我怀疑则关乎你是否允许自己的价值被定价和回应。\n\n"
                "## 低风险行动建议\n"
                "接下来可以选择一个很小的价值表达动作，例如向可信任的人说明你正在做的服务，或记录一次想表达却收回去的瞬间。"
                "重点不是立刻改变收入，而是让价值从内在判断走向一次可承接的外部回应。"
                "如果过程中出现紧张，可以先把行动拆到更小：只写一句介绍、只询问一个反馈、只观察一次报价前的身体反应。"
                "这些动作会帮助你确认，财富流动并不等于失控，它也可以在清楚边界中慢慢发生。\n\n"
                "## 报告边界\n"
                "这份报告用于个人觉察和行动整理，不替代现实财务规划，也不对未来收益做判断。"
                "你可以把它当作一份关于价值表达、资源承接和交换节奏的观察记录。"
            )
        return (
            "# 财富议题曼陀罗解读\n\n"
            "## 画面证据速写\n"
            "从画面看，内圈蓝色圆形有明显收束感，中圈粉色花瓣带出情绪拉扯，外圈白色边界和留白显示你在现实互动中仍保留谨慎。"
            "这几组证据共同指向一个财富主题：价值并非不存在，而是在向外流动前需要先确认安全感。\n\n"
            "## 财富核心解读\n"
            "你的财富议题更像是在呈现一种“想向外流动，但需要先稳住内在承载”的状态。"
            "这不是在判断现实收入，而是在看你和金钱、价值、资源之间的关系：内圈需要稳定支点，中圈需要看见情绪，外圈需要练习更柔软的交换边界。\n\n"
            "## 温和行动建议\n"
            "当前更适合的小步方向，是先选一个低压力的价值表达动作，例如写下一个你想提供的具体价值，或向可信任的人表达一次你的想法。"
            "重点不是马上追求结果，而是让财富流动从可承受的位置开始。"
            "如果你愿意，也可以在行动前后记录一句身体感受，看看紧张是来自现实风险，还是来自旧有的自我保护。"
        )


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
            forbidden_terms=["stage", "placeholder", "legacy"],
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
        result.report_context_package.get("visual_observation", {}),
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
