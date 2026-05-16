# Backend

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-05-16
> source_of_truth：projects/aimandala/toC/app/backend/README.md

这里是 `一镜一梳` To C 主产品的后端入口。当前后端已经切到新报告链路，核心路径为：

```text
/api/wealth-reports
-> MandalaInterpretationAgent
-> WealthReportRuntime
-> projects/aimandala/docs/sources/疗愈体系知识库
```

## 当前职责

- 接收报告生成请求。
- 调用曼陀罗解读智能体。
- 从疗愈体系知识库读取财富议题 runtime 知识。
- 返回用户可见报告和最小审阅 trace。

不在这里放：

- 旧报告管线。
- 旧知识 runtime pack。
- 小程序渠道 stub。
- 无关历史脚本。
- 前端 UI 代码。

## 当前目录约定

- `app/api/main.py`：FastAPI app 入口。
- `app/api/routes.py`：当前报告 API。
- `app/core/mandala_interpretation_agent/`：曼陀罗解读智能体。
- `app/core/wealth_report/`：财富议题报告 runtime。
- `app/core/llm/`：OpenAI-compatible（兼容 OpenAI 协议）模型客户端。
- `app/core/uploads/`：上传存储策略，后续需要重新接入当前报告 API。
- `app/core/analysis/circle_detector.py`：三圈边界默认检测壳，后续需要接入新输入流程。
- `tests/`：后端自动化测试。
- `scripts/run_mandala_interpretation_agent_fixture.py`：新智能体 fixture 审阅脚本。

## 最小运行前提

- Python `3.11+`
- `requirements.release.txt` 中列出的运行依赖
- 本地测试还需要 `pytest`

## 最小启动方式

```bash
export PYTHONPATH=projects/aimandala/toC/app/backend
uvicorn app.api.main:app --reload --host 127.0.0.1 --port 8000
```

## 当前可用接口

- `POST /api/wealth-reports`
- `GET /health`

`POST /api/wealth-reports` 当前要求传入后端可读取的 `image_path`。如果没有配置真实 LLM，也可以传入 `visual_observations` 作为已提取画面证据，用于本地 dry-run（不调用视觉模型的试跑）。

## 当前边界

- 当前只保留财富议题报告主线。
- 上传、历史记录、支付、订单、小程序登录等渠道能力尚未重新接入当前报告 API。
- Web 和小程序后续应共用报告生成核心，但各自的登录、支付、上传和渠道壳需要单独重做。
- 早期报告管线和小程序后端 stub 已移除；后续渠道能力需要围绕当前报告核心重新接入。

## 验证

```bash
pytest projects/aimandala/toC/app/backend/tests/unit -q
```

```bash
git diff --check
```

## LLM 配置

本地未配置模型时，`AIMANDALA_LLM_BACKEND` 可缺省为 `noop`。此时 `/api/wealth-reports` 必须传入 `visual_observations`，否则无法生成视觉证据。

真实模型接入使用：

- `AIMANDALA_LLM_BACKEND=openai_compatible`
- `AIMANDALA_LLM_BASE_URL`
- `AIMANDALA_LLM_API_KEY`
- `AIMANDALA_LLM_MODEL`
- `AIMANDALA_LLM_CHAT_MODEL`（可选）
- `AIMANDALA_LLM_VISION_MODEL`（可选）
- `AIMANDALA_LLM_TIMEOUT_SECONDS`（可选，默认 `30`）
- `AIMANDALA_LLM_MAX_RETRIES`（可选，默认 `2`）
- `AIMANDALA_LLM_RETRY_BACKOFF_MS`（可选，默认 `400`）
