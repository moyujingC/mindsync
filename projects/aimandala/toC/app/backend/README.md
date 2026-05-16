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

`POST /api/wealth-reports` 当前要求传入后端可读取的 `image_path` 和可用的 `redeem_code`。如果没有配置真实 LLM，也可以传入 `visual_observations` 作为已提取画面证据，用于本地 dry-run（不调用视觉模型的试跑）。

## 当前边界

- 当前只保留财富议题报告主线。
- 上传入口和 Web 报告生成已接入当前报告 API；真实支付网关、订单、历史记录、小程序登录等渠道能力尚未重新接入。
- Lite / Pro 生成当前先通过兑换码授权，不伪造支付完成。
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

默认优先使用 DeepSeek v4 兼容配置：

- `AIMANDALA_LLM_BASE_URL`，默认 `https://api.deepseek.com`
- `AIMANDALA_LLM_API_KEY`
- `AIMANDALA_LLM_MODEL`，默认 `deepseek-v4-pro`
- `AIMANDALA_LLM_CHAT_MODEL`（可选）
- `AIMANDALA_LLM_VISION_MODEL`（可选）
- `AIMANDALA_LLM_TIMEOUT_SECONDS`（可选，默认 `30`）
- `AIMANDALA_LLM_MAX_RETRIES`（可选，默认 `2`）
- `AIMANDALA_LLM_RETRY_BACKOFF_MS`（可选，默认 `400`）

如果只设置了 `AIMANDALA_LLM_API_KEY`，后端会自动启用兼容客户端并使用 DeepSeek v4 默认值。
如果显式设置 `AIMANDALA_LLM_BACKEND=openai_compatible`，也会走同一套 OpenAI-compatible 客户端。
本地未配置任何模型信息时，后端回退到 `noop`。

本地可以用私有环境文件集中放密钥，文件不要提交：

```bash
export AIMANDALA_ENV_FILE=/absolute/path/to/aimandala.local.env
python3 projects/aimandala/toC/app/backend/scripts/run_wealth_report_regression.py --mode both
```

私有环境文件使用普通 `KEY=VALUE` 格式。已经在 shell 里设置的变量优先级更高，不会被文件覆盖。

## 兑换码配置

报告生成需要配置 `AIMANDALA_REDEEM_CODES`。格式为：

```bash
AIMANDALA_REDEEM_CODES="CODE-LITE:lite;CODE-PRO:pro;CODE-ALL:lite,pro"
```

未配置、未传码、或兑换码不适用于所选 Lite / Pro 版本时，`/api/wealth-reports` 会返回 `402`。
