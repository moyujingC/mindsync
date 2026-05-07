import json

import pytest


class _FakeHTTPResponse:
    def __init__(self, payload: str):
        self._payload = payload.encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return self._payload


def _build_fake_chat_payload(request_body: dict) -> dict:
    model = str(request_body.get("model") or "")
    messages = request_body.get("messages") or []
    user_message = messages[-1] if messages else {}
    content = user_message.get("content")
    user_text = ""
    has_image_input = False
    if isinstance(content, str):
        user_text = content
    elif isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text_parts.append(str(item.get("text") or ""))
            if isinstance(item, dict) and item.get("type") == "image_url":
                has_image_input = True
        user_text = "\n".join(part for part in text_parts if part)

    is_json_expected = isinstance(request_body.get("response_format"), dict)
    is_vision = has_image_input or (
        is_json_expected
        and "vision_data" not in user_text
        and (
            model == "deepseek-v4-pro"
            or "vision" in model
            or "首层视觉观察" in user_text
        )
    )

    if is_vision:
        return {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "global_visual_summary": "内圈以蓝色为主，夹着白色留白；中圈以粉色为主，也能看到白色镂空；外圈以紫色和粉色为主，配合白色空隙形成更外放的对比。",
                                "per_circle_summary": {
                                    "inner": "内圈以蓝色为主，伴随白色留白。",
                                    "middle": "中圈以粉色为主，夹着白色镂空。",
                                    "outer": "外圈以紫色和粉色为主，也有白色空隙。",
                                },
                                "confidence": 0.92,
                            },
                            ensure_ascii=False,
                        )
                    }
                }
            ]
        }

    if is_json_expected:
        return {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {"ok": True},
                            ensure_ascii=False,
                        )
                    }
                }
            ]
        }

    is_pro = "一梳 Pro 版解读报告模板 v1.6" in user_text
    if is_pro:
        payload = {
            "first_impression": "你现在并不是完全没有方向，而是已经看到方向，却还在确认自己能不能稳稳接住它。",
            "core_insight_table": {
                "能量本质": "当前主轴是想向外推进，但内部承接感还在补课。",
                "核心失衡": "真正拉扯点在于想行动与怕失控同时存在。",
                "关键卡点": "一到需要落实的时候，就会先被自我要求和结果顾虑拽住。",
                "转化方向": "先把行动拆成今天就能承接的小单位。",
                "疗愈核心": "先恢复承接感，再恢复持续推进感。",
            },
            "three_circles_detailed": {
                "inner": {
                    "label": "内圈",
                    "reading": "内圈更像在说明你内在仍有想靠近核心目标的动力，但需要更稳定的自我承接。"
                },
                "middle": {
                    "label": "中圈",
                    "reading": "中圈显示你在现实互动里并非完全停住，而是容易在靠近和收回之间来回切换。"
                },
                "outer": {
                    "label": "外圈",
                    "reading": "外圈让人看到你对外其实有表达冲动，只是边界和节奏还不完全一致。"
                },
            },
            "micro_analysis_detailed": {
                "节奏关系": "推进节奏比恢复节奏更快时，你会先出现收缩。",
                "关系模式": "你会先观察外界反馈，再决定要不要真正往前一步。",
                "行动模式": "真正难的不是开始，而是开始后持续相信自己可以继续。",
            },
            "imbalance_confirmed": {
                "type": "过渡阶段里的承接不足",
                "summary": "当前更像是外部推进意愿先出现，但内部承接速度还没完全跟上。",
                "primary": "最值得看见的是推进感和稳定感不同步。",
                "evidence": "画面里能看到往外扩的冲动，也能看到需要留白缓冲的痕迹。",
                "energy_level": "能量并非没有，而是分配得偏紧。",
                "psychological_level": "你既想往前，也想先确认自己不会被结果反噬。",
                "life_manifestation": "它常出现在要推进工作、表达立场或承担新任务的时候。",
            },
            "root_cause": {
                "surface": "表面上像是行动一到关键处就变慢。",
                "deeper": "更深层是你会先用高标准保护自己，避免仓促暴露不确定感。",
                "core": "核心位置像是在重新学习：即使不完美，也依然可以稳稳往前。",
            },
            "healing_suggestions": [
                {
                    "phase": "当前阶段",
                    "focus": "先把最想推进的那件事缩小到今天能完成的一步。",
                    "practice": "只定义一个最小动作，并在完成后记录事实，不立刻评价自己。"
                },
                {
                    "phase": "接下来一段时间",
                    "focus": "练习把稳定感放在速度前面。",
                    "practice": "每次准备推进前，先确认自己现在最能承接的节奏。"
                },
                {
                    "phase": "继续深化时",
                    "focus": "把价值感从单次结果里慢慢收回来。",
                    "practice": "每周回看一次这周已经做到的推进，而不是只盯没做到的部分。"
                },
            ],
        }
    else:
        payload = {
            "title": "慢慢亮起来的中心",
            "overall_impression": "你不是没有力量，而是在恢复一种更稳的往前感。画面让人感觉到你已经想靠近真正重要的部分，只是还需要一点安全的节奏。",
            "visual_elements": "画面里能看到中心区域比较集中，向外扩展时又留出了一些缓冲的空白，这会让人感觉你并不是完全停住，而是在一边试着往前，一边给自己留承接空间。",
            "emotion_portrait": "这张画像是在说明，你心里已经有一个想走近的方向，但真正要推进时，内在还是会先确认自己能不能稳稳接住变化。这不是退缩，而是你正在寻找一种不必硬冲、也不必完全收回的方式。",
            "story": {
                "base": "你的底色里有想往前的认真，也有想稳住自己的需要。",
                "contradiction": "你一边想迈出去，一边又会担心推进太快会失掉掌控。",
                "pattern": "于是很多时候不是完全不动，而是推进一点、观察一点、再决定下一步。",
                "defense": "这种放慢其实是在保护你，让你不要在还没准备好时把自己推出去。",
                "block": "真正卡住你的，不是没有方向，而是怕自己承接不起推进之后的变化。",
                "light": "你的光在于你已经开始看见这种节奏了，这会让你更有机会用自己的方式往前。",
            },
            "theme_scene": "在现实里，这常出现在你想推进一件重要的工作或做一个更清晰的表达时。",
            "theme_impact": "它会让你明明知道自己想往前，却总要多花一点时间确认自己能不能接住结果。",
            "theme_awareness": "今天可以先不要求自己一步到位，只确认下一步里最小、最稳的那一个动作。",
            "three_awareness": [
                {"day": 1, "title": "先缩小一步", "content": "把现在最想推进的事情缩成今天就能完成的一个动作。"},
                {"day": 2, "title": "只看事实", "content": "做完后只记录你完成了什么，不立刻评价够不够好。"},
                {"day": 3, "title": "感觉一下承接", "content": "准备继续之前，先问问自己现在最能承接的节奏是什么。"},
            ],
            "pro_teaser": "如果进入更深报告，还可以继续看清你为什么会在推进和收回之间来回切换，以及怎样把这种拉扯拆开来看。",
        }

    return {
        "choices": [
            {
                "message": {
                    "content": json.dumps(payload, ensure_ascii=False)
                }
            }
        ]
    }


@pytest.fixture(autouse=True)
def _patch_backend_llm_for_tests(monkeypatch, request):
    module_name = request.module.__name__
    if (
        module_name.endswith("test_llm_runtime")
        or module_name.endswith("test_knowledge_runtime_v21")
        or module_name.endswith("test_v2_knowledge")
    ):
        return

    monkeypatch.setenv("AIMANDALA_LLM_BACKEND", "openai_compatible")
    monkeypatch.setenv("AIMANDALA_LLM_BASE_URL", "https://api.deepseek.com/v1")
    monkeypatch.setenv("AIMANDALA_LLM_MODEL", "deepseek-v4-pro")
    monkeypatch.setenv("AIMANDALA_LLM_CHAT_BASE_URL", "https://api.deepseek.com/v1")
    monkeypatch.setenv("AIMANDALA_LLM_CHAT_MODEL", "deepseek-v4-pro")
    monkeypatch.setenv("AIMANDALA_LLM_CHAT_API_KEY", "test-chat-key")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_BASE_URL", "https://api.deepseek.com/v1")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_MODEL", "deepseek-v4-pro")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_API_KEY", "test-vision-key")

    def _fake_urlopen(request_obj, timeout=0):
        del timeout
        body = json.loads(request_obj.data.decode("utf-8"))
        return _FakeHTTPResponse(json.dumps(_build_fake_chat_payload(body), ensure_ascii=False))

    monkeypatch.setattr("app.core.llm.runtime.urlopen", _fake_urlopen)
