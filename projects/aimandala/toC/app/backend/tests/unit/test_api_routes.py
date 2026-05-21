"""API tests for the native Aimandala report route."""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.api.main import create_app


def _visual_observations() -> dict:
    return {
        "foundation_image_reading": {
            "visual_observation": {
                "overall_observation": {
                    "first_impression": "内圈收束，中圈有拉扯，外圈红色和留白明显。",
                    "main_visual_content": "内圈蓝色圆形，中圈粉色花瓣，外圈红色边界和白色留白。",
                    "visual_atmosphere": "整体有向外展开的热度，也有边界和分隔。",
                    "visual_weight_and_rhythm": "内圈集中，外圈红色和留白形成明显节奏。",
                },
                "three_circle_observation": {
                    "inner": "内圈蓝色圆形，整体收束。",
                    "middle": "中圈粉色花瓣，有拉扯感。",
                    "outer": "外圈红色很多，也有白色留白。",
                    "cross_circle_visual_connection": "内圈向中圈展开，外圈由红色边界和留白收束。",
                },
                "circle_visual_units": {
                    "inner": {
                        "composition_description": "内圈蓝色圆形，整体收束。",
                        "visual_units": [
                            {
                                "id": "inner-001",
                                "unit_name": "蓝色圆形",
                                "position": "内圈",
                                "source_type": "user_painted",
                                "color_description": "蓝色",
                                "shape_description": "圆形",
                                "texture_and_density": "集中、稳定。",
                                "spatial_relations": "位于内圈中心，外侧连接中圈。",
                                "blank_space_role": "none",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "内圈蓝色圆形，整体收束。",
                            }
                        ],
                    },
                    "middle": {
                        "composition_description": "中圈粉色花瓣，有拉扯感。",
                        "visual_units": [
                            {
                                "id": "middle-001",
                                "unit_name": "粉色花瓣",
                                "position": "中圈",
                                "source_type": "user_painted",
                                "color_description": "粉色",
                                "shape_description": "花瓣",
                                "texture_and_density": "重复排列。",
                                "spatial_relations": "围绕内圈展开，与外圈红色边界相邻。",
                                "blank_space_role": "none",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "中圈粉色花瓣，有拉扯感。",
                            }
                        ],
                    },
                    "outer": {
                        "composition_description": "外圈红色很多，也有留白。",
                        "visual_units": [
                            {
                                "id": "outer-001",
                                "unit_name": "红色边界",
                                "position": "外圈",
                                "source_type": "user_painted",
                                "color_description": "红色",
                                "shape_description": "边界",
                                "texture_and_density": "红色较明显。",
                                "spatial_relations": "位于外圈，与白色留白相邻。",
                                "blank_space_role": "none",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "外圈红色边界明显。",
                            },
                            {
                                "id": "outer-002",
                                "unit_name": "外圈留白",
                                "position": "外圈",
                                "source_type": "blank_space",
                                "color_description": "白色留白",
                                "shape_description": "边界间隔",
                                "texture_and_density": "留白明显。",
                                "spatial_relations": "与外圈红色边界相邻，并切分外圈视觉连续性。",
                                "blank_space_role": "切分外圈红色边界。",
                                "energy_ratio_percent": 30,
                                "rich_visual_description": "外圈红色边界和留白同时存在。",
                            },
                        ],
                    },
                },
            },
            "element_sensing": {
                "inner": {
                    "element_candidates": [
                        {
                            "visual_unit_id": "inner-001",
                            "element": "water",
                            "basis": ["蓝色"],
                            "confidence": "high",
                            "notes": "按颜色判为水。",
                        }
                    ],
                    "summary": "内圈有水元素候选。",
                },
                "middle": {
                    "element_candidates": [
                        {
                            "visual_unit_id": "middle-001",
                            "element": "fire",
                            "basis": ["粉色"],
                            "confidence": "medium",
                            "notes": "粉色作为弱火候选。",
                        }
                    ],
                    "summary": "中圈有火元素候选。",
                },
                "outer": {
                    "element_candidates": [
                        {
                            "visual_unit_id": "outer-001",
                            "element": "fire",
                            "basis": ["红色"],
                            "confidence": "high",
                            "notes": "红色判为火。",
                        },
                        {
                            "visual_unit_id": "outer-002",
                            "element": "metal",
                            "basis": ["白色留白"],
                            "confidence": "high",
                            "notes": "留白按金处理。",
                        },
                    ],
                    "summary": "外圈有火和金元素候选。",
                },
            },
            "intra_circle_relations": {
                "inner": {
                    "relations": [
                        {
                            "relation_id": "inner-rel-001",
                            "relation_type": "insufficient_evidence",
                            "involved_visual_unit_ids": ["inner-001"],
                            "visible_basis": "内圈只有一个主要视觉单元。",
                            "confidence": "high",
                            "notes": "",
                        }
                    ],
                    "summary": "内圈关系证据不足。",
                },
                "middle": {
                    "relations": [
                        {
                            "relation_id": "middle-rel-001",
                            "relation_type": "insufficient_evidence",
                            "involved_visual_unit_ids": ["middle-001"],
                            "visible_basis": "中圈只有粉色花瓣作为主要单元。",
                            "confidence": "medium",
                            "notes": "",
                        }
                    ],
                    "summary": "中圈关系证据不足。",
                },
                "outer": {
                    "relations": [
                        {
                            "relation_id": "outer-rel-001",
                            "relation_type": "cut_by_metal",
                            "involved_visual_unit_ids": ["outer-001", "outer-002"],
                            "visible_basis": "白色留白切分外圈红色边界。",
                            "confidence": "high",
                            "notes": "",
                        }
                    ],
                    "summary": "外圈有金切火候选。",
                },
            },
            "cross_circle_flow": {
                "flow_observations": [
                    {
                        "flow_id": "flow-001",
                        "flow_type": "outward_expanding",
                        "involved_circles": ["inner", "middle", "outer"],
                        "visual_basis": "内圈集中，中圈展开，外圈红色和留白形成外部边界。",
                        "confidence": "high",
                    }
                ],
                "summary": "三圈由中心向外展开，外圈边界明显。",
            },
            "evidence_links": [
                {
                    "claim_id": "inner-001",
                    "claim_type": "element_sensing",
                    "claim_text": "内圈蓝色圆形为水元素候选。",
                    "visual_unit_ids": ["inner-001"],
                    "circle_observation_refs": ["visual_observation.circle_visual_units.inner"],
                    "evidence_text": "内圈蓝色圆形，整体收束。",
                },
                {
                    "claim_id": "middle-001",
                    "claim_type": "element_sensing",
                    "claim_text": "中圈粉色花瓣为火元素候选。",
                    "visual_unit_ids": ["middle-001"],
                    "circle_observation_refs": ["visual_observation.circle_visual_units.middle"],
                    "evidence_text": "中圈粉色花瓣，有拉扯感。",
                },
                {
                    "claim_id": "outer-001",
                    "claim_type": "element_sensing",
                    "claim_text": "外圈红色边界为火元素候选。",
                    "visual_unit_ids": ["outer-001"],
                    "circle_observation_refs": ["visual_observation.circle_visual_units.outer"],
                    "evidence_text": "外圈红色边界明显。",
                },
                {
                    "claim_id": "outer-002",
                    "claim_type": "element_sensing",
                    "claim_text": "外圈留白为金元素候选。",
                    "visual_unit_ids": ["outer-002"],
                    "circle_observation_refs": ["visual_observation.circle_visual_units.outer"],
                    "evidence_text": "外圈红色边界和留白同时存在。",
                },
                {
                    "claim_id": "inner-rel-001",
                    "claim_type": "intra_circle_relation",
                    "claim_text": "内圈关系证据不足。",
                    "visual_unit_ids": ["inner-001"],
                    "circle_observation_refs": ["visual_observation.circle_visual_units.inner"],
                    "evidence_text": "内圈只有一个主要视觉单元。",
                },
                {
                    "claim_id": "middle-rel-001",
                    "claim_type": "intra_circle_relation",
                    "claim_text": "中圈关系证据不足。",
                    "visual_unit_ids": ["middle-001"],
                    "circle_observation_refs": ["visual_observation.circle_visual_units.middle"],
                    "evidence_text": "中圈只有粉色花瓣作为主要单元。",
                },
                {
                    "claim_id": "outer-rel-001",
                    "claim_type": "intra_circle_relation",
                    "claim_text": "外圈有金切火候选。",
                    "visual_unit_ids": ["outer-001", "outer-002"],
                    "circle_observation_refs": ["visual_observation.circle_visual_units.outer"],
                    "evidence_text": "白色留白切分外圈红色边界。",
                },
                {
                    "claim_id": "flow-001",
                    "claim_type": "cross_circle_flow",
                    "claim_text": "三圈由中心向外展开。",
                    "visual_unit_ids": ["inner-001", "middle-001", "outer-001", "outer-002"],
                    "circle_observation_refs": ["visual_observation.three_circle_observation"],
                    "evidence_text": "内圈集中，中圈展开，外圈红色和留白形成外部边界。",
                },
            ],
        }
    }


def test_upload_image_saves_browser_file_and_returns_backend_readable_path(
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_UPLOAD_BACKEND", "local")
    monkeypatch.setenv("AIMANDALA_UPLOAD_LOCAL_RETENTION_HOURS", "24")

    client = TestClient(create_app())
    response = client.post(
        "/api/uploads",
        files={"file": ("mandala.png", b"fake-image", "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["storage_backend"] == "local"
    assert payload["storage_key"].endswith(".png")
    assert Path(payload["image_path"]).exists()
    assert Path(payload["image_path"]).read_bytes() == b"fake-image"
    Path(payload["image_path"]).unlink(missing_ok=True)


def test_create_lite_wealth_report_uses_native_agent_route(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    monkeypatch.setenv("AIMANDALA_LLM_BACKEND", "noop")
    monkeypatch.delenv("AIMANDALA_ENV_FILE", raising=False)
    client = TestClient(create_app())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "redeem_code": "MVP-LITE",
            "painting_intention": "想看财富为什么卡住",
            "painting_feeling": "有点紧",
            "visual_observations": _visual_observations(),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["topic"] == "wealth"
    assert payload["report_mode"] == "lite"
    assert payload["selected_clause_ids"]
    assert "财富议题" in payload["final_report_md"]
    assert payload["report_context_package"]["permissions"]["allow_seeded_short_report"] is True


def test_create_pro_wealth_report_returns_displayable_report(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    monkeypatch.setenv("AIMANDALA_LLM_BACKEND", "noop")
    monkeypatch.delenv("AIMANDALA_ENV_FILE", raising=False)
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "pro",
            "redeem_code": "MVP-PRO",
            "painting_intention": "想看财富为什么卡住",
            "painting_feeling": "有点紧",
            "visual_observations": _visual_observations(),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["report_mode"] == "pro"
    assert payload["final_report_md"]
    assert payload["final_report"]["report_mode"] == "pro"


def test_create_wealth_report_requires_llm_or_seeded_visual_observations(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    monkeypatch.setenv("AIMANDALA_LLM_BACKEND", "noop")
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite")
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "redeem_code": "MVP-LITE",
            "painting_intention": "想看财富为什么卡住",
            "painting_feeling": "有点紧",
        },
    )

    assert response.status_code == 501
    assert "LLM runtime is not configured" in response.json()["detail"]


def test_create_wealth_report_rejects_missing_redeem_code(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "visual_observations": _visual_observations(),
        },
    )

    assert response.status_code == 402
    assert "兑换码" in response.json()["detail"]


def test_create_wealth_report_rejects_lite_code_for_pro(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "pro",
            "redeem_code": "MVP-LITE",
            "visual_observations": _visual_observations(),
        },
    )

    assert response.status_code == 402
    assert "不适用于 PRO 报告" in response.json()["detail"]
