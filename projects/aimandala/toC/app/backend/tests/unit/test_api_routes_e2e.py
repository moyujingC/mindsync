"""Tests for the end-to-end mandala wealth report API."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.api.main import create_app
from app.api import routes as api_routes


class StubRouteLLMClient:
    last_prompt_cache_hit_tokens = 0
    last_prompt_cache_miss_tokens = 0
    last_attempt_trace = [{"model": "stub", "status": "ok"}]

    def __init__(self, followup_answer: str | None = None) -> None:
        self.followup_answer = followup_answer
        self.text_calls = []

    def generate_structured(self, **kwargs):
        return (
            "## 整体画面\n"
            "画面整体偏向收束后再展开，中心稳定，外圈留白清楚。\n\n"
            "## 三圈观察\n"
            "内圈、 中圈、外圈之间有层次，但中圈与外圈之间的空白让节奏出现了停顿。\n\n"
            "## 主要视觉单元\n"
            "内圈蓝色中心，中圈粉色和紫色重复单元，外圈留白与紫色矩形构成主要视觉结构。\n"
        )

    def generate_text(self, **kwargs):
        self.text_calls.append(kwargs)
        if self.followup_answer is not None and kwargs.get("task") == "chat" and "本次报告全文" in kwargs.get("user_prompt", ""):
            return self.followup_answer
        if kwargs.get("task") == "vision":
            if "上一轮输出仍然偏结构化" in kwargs.get("user_prompt", ""):
                return (
                    "## 整体画面\n"
                    "画面整体偏向收束后再展开，中心稳定，外圈留白清楚。\n\n"
                    "## 三圈观察\n"
                    "内圈、中圈、外圈之间有层次，但中圈与外圈之间的空白让节奏出现了停顿。\n\n"
                    "## 主要视觉单元\n"
                    "内圈蓝色中心，中圈粉色和紫色重复单元，外圈留白与紫色矩形构成主要视觉结构。\n"
                )
            return (
                "## 整体画面\n"
                "画面整体偏向收束后再展开，中心稳定，外圈留白清楚。\n\n"
                "## 三圈观察\n"
                "内圈、中圈、外圈之间有层次，但中圈与外圈之间的空白让节奏出现了停顿。\n\n"
                "## 主要视觉单元\n"
                "内圈蓝色中心，中圈粉色和紫色重复单元，外圈留白与紫色矩形构成主要视觉结构。\n"
            )
        return (
            "# 财富关系曼陀罗解读报告\n\n"
            "## 整体感受\n"
            "这幅画先给人的感觉是先收住，再向外展开。\n\n"
            "## 三圈观察\n"
            "内圈较稳，中圈有重复，外圈留白形成边界。\n\n"
            "## 圈内解读\n"
            "画面里能看到五行识别的基础线索。\n\n"
            "## 跨圈衔接\n"
            "三圈之间是先展开后收束的结构。\n\n"
            "## 财富主线\n"
            "财富关系更像是先稳住承载，再进入交换。\n\n"
            "## 后续建议\n"
            "可以先做一个很小的价值表达动作。\n"
        )


def test_create_wealth_report_returns_new_contract(monkeypatch, tmp_path):
    monkeypatch.setenv("AIMANDALA_REPORT_ARTIFACT_DIR", str(tmp_path / "reports"))
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "agent_variant": "two_pass_e2e",
            "painting_intention": "想看财富卡点",
            "painting_feeling": "有点紧",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["report_mode"] == "lite"
    assert payload["final_report_md"]
    assert payload["visual_draft"]
    assert payload["prompt_pack_manifest"]["pack_id"] == "wealth-relationship-report-v1.0.0"
    assert payload["quality_gate"]["passed"] is True
    assert payload["run_summary"]["status"] == "complete"
    assert payload["final_report"]["persona"]["persona_id"] == "manman"
    assert payload["final_report"]["persona"]["display_name"] == "曼曼"
    assert payload["run_summary"]["persona_id"] == "manman"


def test_create_wealth_report_writes_followup_context(monkeypatch, tmp_path):
    monkeypatch.setenv("AIMANDALA_REPORT_ARTIFACT_DIR", str(tmp_path / "reports"))
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_CONTEXT_DIR", str(tmp_path / "followup-contexts"))
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "agent_variant": "two_pass_e2e",
            "painting_intention": "想看财富卡点",
            "painting_feeling": "有点紧",
        },
    )

    assert response.status_code == 200
    report_id = response.json()["report_id"]
    stored_context = api_routes._followup_context_store().read(report_id)
    assert stored_context is not None
    assert stored_context.report_id == report_id
    assert stored_context.painting_intention == "想看财富卡点"
    assert stored_context.final_report_md
    assert stored_context.report_sections
    assert stored_context.persona.persona_id == "manman"


def test_create_wealth_report_allows_pro_with_payment_bypassed(monkeypatch, tmp_path):
    monkeypatch.setenv("AIMANDALA_REPORT_ARTIFACT_DIR", str(tmp_path / "reports"))
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "pro",
        },
    )

    assert response.status_code == 200
    assert response.json()["report_mode"] == "pro"


def test_get_wealth_report_reads_stored_artifact(monkeypatch, tmp_path):
    monkeypatch.setenv("AIMANDALA_REPORT_ARTIFACT_DIR", str(tmp_path / "reports"))
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    created = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "agent_variant": "two_pass_e2e",
        },
    )

    assert created.status_code == 200
    report_id = created.json()["report_id"]

    fetched = client.get(f"/api/wealth-reports/{report_id}")

    assert fetched.status_code == 200
    payload = fetched.json()
    assert payload["report_id"] == report_id
    assert payload["final_report_md"]
    assert payload["final_report"]["report_id"] == report_id


def test_report_followup_can_be_disabled_explicitly(monkeypatch):
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_ENABLED", "0")
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient("不应调用"))

    client = TestClient(create_app())
    response = client.post(
        "/api/report-followups",
        json={
            "report_id": "report-1",
            "question": "这段是什么意思？",
            "final_report_md": "# 财富关系曼陀罗解读报告",
            "final_report": {"report_id": "report-1"},
        },
    )

    assert response.status_code == 403


def test_report_followup_rejects_mismatched_report_id(monkeypatch):
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_ENABLED", "1")
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient("不应调用"))

    client = TestClient(create_app())
    response = client.post(
        "/api/report-followups",
        json={
            "report_id": "report-1",
            "question": "这段是什么意思？",
            "final_report_md": "# 财富关系曼陀罗解读报告",
            "final_report": {"report_id": "report-2"},
        },
    )

    assert response.status_code == 422


def test_report_followup_returns_answer_when_enabled(monkeypatch):
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_ENABLED", "1")
    monkeypatch.setattr(
        api_routes,
        "create_llm_client_from_env",
        lambda: StubRouteLLMClient("这对应报告里的三圈观察：内圈较稳，中圈有重复。"),
    )

    client = TestClient(create_app())
    response = client.post(
        "/api/report-followups",
        json={
            "report_id": "report-1",
            "question": "三圈观察是什么意思？",
            "report_mode": "lite",
            "theme_label": "财富关系",
            "final_report_md": "# 财富关系曼陀罗解读报告\n\n## 三圈观察\n内圈较稳，中圈有重复。",
            "final_report": {"report_id": "report-1"},
            "visual_draft": {"visual_draft_md": "## 三圈观察\n内圈较稳。"},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["report_id"] == "report-1"
    assert "三圈观察" in payload["answer_md"]
    assert payload["persona"]["persona_id"] == "manman"
    assert payload["safety"]["precheck"]["passed"] is True


def test_report_followup_uses_stored_context_with_minimal_request(monkeypatch, tmp_path):
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_ENABLED", "1")
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_CONTEXT_DIR", str(tmp_path / "followup-contexts"))
    llm_client = StubRouteLLMClient("这对应报告里的三圈观察：内圈较稳，中圈有重复。")
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: llm_client)
    api_routes._followup_context_store().write(
        api_routes.ReportFollowupContext(
            report_id="stored-report-1",
            report_mode="lite",
            theme_label="财富关系",
            painting_intention="想看财富卡点",
            painting_feeling="有点紧",
            final_report_md="# 财富关系曼陀罗解读报告\n\n## 三圈观察\n内圈较稳，中圈有重复。",
            final_report={"report_id": "stored-report-1", "persona": api_routes.ReportPersona().to_dict()},
            visual_draft={"visual_draft_md": "## 三圈观察\n内圈较稳。"},
            report_sections=api_routes.build_report_section_map(
                "# 财富关系曼陀罗解读报告\n\n## 三圈观察\n内圈较稳，中圈有重复。"
            ),
            persona=api_routes.ReportPersona(),
        )
    )

    client = TestClient(create_app())
    response = client.post(
        "/api/report-followups",
        json={
            "report_id": "stored-report-1",
            "question": "三圈观察是什么意思？",
            "history": [{"role": "user", "content": "报告最重要的一句话是什么？"}],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["report_id"] == "stored-report-1"
    assert "三圈观察" in payload["answer_md"]
    assert payload["persona"]["persona_id"] == "manman"
    assert llm_client.text_calls
    assert "想看财富卡点" in llm_client.text_calls[0]["user_prompt"]
    assert "用户：报告最重要的一句话是什么？" in llm_client.text_calls[0]["user_prompt"]


def test_report_followup_context_miss_without_fallback_returns_404(monkeypatch, tmp_path):
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_ENABLED", "1")
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_CONTEXT_DIR", str(tmp_path / "followup-contexts"))
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient("不应调用"))

    client = TestClient(create_app())
    response = client.post(
        "/api/report-followups",
        json={
            "report_id": "missing-report",
            "question": "三圈观察是什么意思？",
        },
    )

    assert response.status_code == 404
    assert "未找到本次报告追问上下文" in response.json()["detail"]


def test_report_followup_precheck_blocks_diagnostic_question(monkeypatch):
    monkeypatch.setenv("AIMANDALA_REPORT_FOLLOWUP_ENABLED", "1")
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient("不应调用"))

    client = TestClient(create_app())
    response = client.post(
        "/api/report-followups",
        json={
            "report_id": "report-1",
            "question": "我是不是抑郁症？",
            "final_report_md": "# 财富关系曼陀罗解读报告",
            "final_report": {"report_id": "report-1"},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["out_of_scope"] is True
    assert "followup_diagnostic_request" in payload["safety"]["failure_ids"]
    assert "不能做心理诊断" in payload["answer_md"]


def test_create_app_loads_redeem_codes_before_route_authorization(
    monkeypatch,
    tmp_path,
):
    env_file = tmp_path / "aimandala.env"
    env_file.write_text(
        "\n".join(
            [
                "AIMANDALA_REDEEM_CODES=ENV-LITE:lite",
                "AIMANDALA_LLM_API_KEY=env-key",
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("AIMANDALA_ENV_FILE", str(env_file))
    monkeypatch.delenv("AIMANDALA_REDEEM_CODES", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_API_KEY", raising=False)
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "redeem_code": "ENV-LITE",
        },
    )

    assert response.status_code == 200
