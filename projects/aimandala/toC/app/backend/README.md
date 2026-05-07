# Backend

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/toC/app/backend/README.md


这里放 `一镜一梳` To C 主产品的后端实现入口和流程编排代码。

职责：

- 接收输入
- 调用领域流程
- 组织主链路输出

不在这里放：

- 复杂领域规则
- 测试代码
- 无关的历史脚本
- 前端 UI 代码

## 当前状态

当前这里承接的是 `一镜一梳` To C 主线在 `mindsync` 里的正式后端入口。

已经迁入并可运行的内容：

- `app/core/pipeline/data_models.py`
- `app/core/pipeline/store.py`
- `app/core/pipeline/orchestrator_v2.py`
- `app/core/analysis/circle_detector.py`
- `app/core/safety/protocol.py`
- `app/api/main.py`
- `app/api/routes_v2.py`

当前这批实现的目标不是复刻历史仓库全部能力，而是维护当前正式 To C 主路径，并持续迭代质量。

## 当前目录约定

- `app/`
  - 当前后端实现主入口
- `tests/`
  - 后端自动化测试
- `data/interpretations/`
  - 本地联调时生成的运行时解读记录
- `data/uploads/`
  - 本地联调时保存的临时上传文件

其中：

- `data/interpretations/` 和 `data/uploads/` 都属于运行时目录
- 它们不是正式 fixture，也不是应进入 Git 的项目资产
- 需要长期保留的样本应转移到项目级 `fixtures/` 或 `toC/data/`

## 最小运行前提

当前后端还没有单独收口为完整 Python 工程文件，因此最小运行前提先以文档明确：

- Python `3.11+`
- 当前至少需要可用的 Python 包：
  - `fastapi`
  - `pydantic`
  - `PyYAML`
  - `pytest`
  - `anyio`
- 如需启用腾讯云 COS，还需要：
  - `cos-python-sdk-v5`

说明：

- 当前这些依赖仍主要由本地开发环境承接
- 这份 README 先把“最小可运行前提”显式写出，避免继续依赖隐含本机环境
- 如果后续正式收口后端工作区，应补独立依赖文件

## 最小启动方式

当前最小本地启动方式：

```bash
cd .
export PYTHONPATH=projects/aimandala/toC/app/backend
uvicorn app.api.main:app --reload --host 127.0.0.1 --port 8000
```

如果本机没有 `uvicorn`，应先在当前 Python 环境中安装对应依赖。

## 最小测试方式

当前建议至少保留下面两条验证命令：

```bash
cd .
pytest projects/aimandala/toC/app/backend/tests/unit
```

```bash
cd .
pytest projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py
```

## 当前可用接口

当前最小 `V2` API 包含：

- `POST /api/v2/upload-image`
- `POST /api/v2/detect-circles`
- `POST /api/v2/interpretations`
- `GET /api/v2/interpretations/{interpretation_id}`
- `GET /api/v2/interpretations/{interpretation_id}/status`
- `GET /api/v2/interpretations/{interpretation_id}/report`
- `POST /api/v2/interpretations/{interpretation_id}/chat`
- `POST /api/v2/interpretations/{interpretation_id}/upgrade`
- `GET /api/v2/users/{user_id}/interpretations`
- `GET /api/v2/pricing`
- `GET /health`

其中当前已经打通的最小行为：

- 浏览器上传文件可以先落到后端本地临时路径
- 本地上传会返回可直接访问的本地读取地址，供开发与 smoke test 使用
- 本地临时上传目录会清理超过 24 小时的旧文件
- 上传存储已经抽成独立策略层；本地开发默认走 `local`，正式 `release` 明确走 `cos`
- `s3 / oss` 已有 dry-run 远程元数据语义，可先产出稳定的 `storage_key / image_url`
- `cos` 已接入真实上传实现；即使走腾讯云 COS，后端也仍会保留本地 `image_path`，保证当前 detect/create/report 主链无需改契约
- 远程上传后端现在已补上环境变量配置校验，能区分“缺配置”和“实现未接入”
- 上传响应已开始返回统一的 `storage_backend / storage_key / image_url` 元数据
- 上传响应现已补充 `image_local_expires_at`，前端可以明确感知本地临时路径的预计过期时间
- `create` 请求现已支持透传 `image_url / storage_backend / storage_key / image_local_expires_at` 并入库，保证图片生命周期后续可追踪
- 本地上传文件现在可通过 `GET /api/v2/uploads/{storage_key}` 读取，便于 preview/runtime 继续消费同一份上传对象语义
- 三圈边界现在由用户在上传页人工确认；独立三圈检测接口仅保留兼容与调试用途，不参与正式 create 主链
- Lite 初始化可创建记录
- 会生成一份迁移期 `一镜 Lite 版` 报告
- Lite 报告已经开始按 `layer_1 / layer_2` 的结构字段输出更完整的故事、主题洞察、小觉察和实验内容
- Lite 报告内容已经开始受 `theme / painting_intention / painting_feeling / 三圈参数` 影响，不再只是固定模板
- Lite 报告文案与结构已开始明显向旧主线正式报告靠拢，包含更接近正式产品口吻的标题、整体印象、心灵画像故事、主题表现、六个核心洞察与小实验
- 同一用户 / 同一图片 / 同一主题会复用已有记录
- 记录、状态、报告、历史列表都可以查询
- `upgrade` 已能写入并读取 `一梳 Pro 版` 报告
- Pro 报告已经开始按 `layer_3 / layer_4` 输出第一眼直觉、核心洞察、三圈画像、根源分析与调节建议
- Pro 报告内容也已经开始受 `theme / painting_intention / painting_feeling / 三圈参数` 影响，不再只是固定模板
- Pro 报告文案与结构也已开始向旧主线正式深度报告靠拢，包含第一眼直觉、核心洞察表格、Lite 基础承接、三圈深度诊断、失衡识别、根源探索与针对失衡问题的疗愈建议
- Lite / Pro 最终 markdown 都已接入 safety disclaimer 包装
- Lite / Pro 正式报告主链已收口为知识优先本地组装：`Layer0 / 四步法 / projection / narrative projection -> Lite/Pro 知识骨架 -> 最终报告`
- 当前后端仍保留 `prompt_preview` / `prompt_schema_validation_issues` 作为前端兼容字段，但它们不再表示模型主生成入口
- Lite / Pro 的最终 `report.structured` 字段契约现已集中在 `app/core/pipeline/structured_report_schema.py`
- 后端现已补上统一 LLM client，仅用于 Layer0 画面事实提取、Lite / Pro 报告结构生成和 Pro 报告内 AI 追问；三圈边界暂时不依赖 LLM，由用户人工确认
- Pro 报告页对应的 AI 问答现已补上真实接口，基于当前报告 markdown、QA 上下文和历史对话生成延展回答

## 当前边界

当前实现明确还没有接入：

- 基于 `s3 / oss` dry-run 升级为真实远程上传实现
- 更完整的上传生命周期治理（例如引用计数、后台清理任务、持久化策略）
- knowledge engine
- 更精细的 CV/OpenCV 几何检测与多模型路由策略
- To B / Studio / V3

也就是说，当前三圈边界以人工确认为准；统一 LLM client 不再承担三圈边界识别。报告正文质量的后续优化应继续沿知识库、projection、骨架组装链路和 DeepSeek V4 Pro 文本生成链路推进，而不是恢复旧 prompt runtime 覆盖。

## 验证

当前建议的基础验证命令：

```bash
pytest projects/aimandala/toC/app/backend/tests/unit
```

最近一轮迁移验证通过的单测规模是：

- 当前覆盖 `test_api_health.py`、`test_circle_detector.py`、`test_pipeline_data_models.py`、`test_pipeline_orchestrator.py`、`test_prompt_builder.py`、`test_report_blueprints.py`、`test_safety_protocol.py`、`test_upload_storage.py`

## COS 配置

如需切到腾讯云 COS，当前可用环境变量如下：

- `AIMANDALA_UPLOAD_BACKEND=cos`
- `AIMANDALA_UPLOAD_COS_SECRET_ID`
- `AIMANDALA_UPLOAD_COS_SECRET_KEY`
- `AIMANDALA_UPLOAD_COS_BUCKET`
- `AIMANDALA_UPLOAD_COS_REGION`
- `AIMANDALA_UPLOAD_COS_KEY_PREFIX`（可选，默认 `aimandala/uploads`）
- `AIMANDALA_UPLOAD_COS_PUBLIC_BASE_URL`（可选，可指向备案后的正式域名或 CDN 域名）
- `AIMANDALA_COS_SIGNED_URL_TTL_SECONDS`（可选，默认 `900`，控制前端读取图片时的签名 URL 有效期）
- `AIMANDALA_UPLOAD_LOCAL_RETENTION_HOURS`（可选，默认 `24`，控制本地临时文件过期窗口）

说明：

- `COS` 当前会真实上传远端对象，同时保留本地临时文件，避免现有 `image_path` 主链断掉
- `image_url` 在 `COS` 下是临时签名 URL；长期定位以 `storage_backend + storage_key` 为准
- 若未安装 `cos-python-sdk-v5`，接口会返回 `501`

## Unified LLM 配置

如需把报告生成、Layer0 画面事实提取和报告内 AI 问答接到真实模型，优先使用下面这组环境变量：

- `AIMANDALA_LLM_BACKEND`（本地可缺省为 `noop`；正式 `release` 应显式设为 `openai_compatible`）
- `AIMANDALA_LLM_BASE_URL`（`openai_compatible` 模式必填，例如 `https://<host>/v1`）
- `AIMANDALA_LLM_API_KEY`（可选，取决于网关要求）
- `AIMANDALA_LLM_API_KEY_HEADER`（可选，默认 `Authorization`）
- `AIMANDALA_LLM_MODEL`（可选，默认 `deepseek-v4-pro`）
- `AIMANDALA_LLM_CHAT_MODEL`（可选，报告生成与追问专用模型，未设置时使用 `AIMANDALA_LLM_MODEL`）
- `AIMANDALA_LLM_VISION_MODEL`（可选，Layer0 画面事实提取专用模型，未设置时使用 `AIMANDALA_LLM_MODEL`；三圈边界不走模型）
- `AIMANDALA_LLM_VISION_BASE_URL`（可选，三圈识别专用视觉 endpoint）
- `AIMANDALA_LLM_VISION_API_KEY`（可选，三圈识别专用 API key）
- `AIMANDALA_LLM_VISION_FALLBACK_MODEL`（可选，三圈识别 fallback 模型）
- `AIMANDALA_LLM_VISION_FALLBACK_BASE_URL`（可选，三圈识别 fallback endpoint）
- `AIMANDALA_LLM_VISION_FALLBACK_API_KEY`（可选，三圈识别 fallback API key）
- `AIMANDALA_LLM_TIMEOUT_SECONDS`（可选，默认 `30`）
- `AIMANDALA_LLM_MAX_RETRIES`（可选，默认 `2`）
- `AIMANDALA_LLM_RETRY_BACKOFF_MS`（可选，默认 `400`）

说明：

- `AIMANDALA_LLM_BACKEND=noop` 时，Lite / Pro 报告会回落到本地确定性链路，report chat 不会得到真实模型回复
- `release` 环境若需要 DeepSeek V4 Pro 报告生成或报告追问，不应使用 `noop`
- `openai_compatible` 当前基于 `/chat/completions` 协议，支持文本生成、JSON 结构生成和图片输入
- `AIMANDALA_LLM_CHAT_MODEL / AIMANDALA_LLM_VISION_MODEL` 未设置时，会回退到 `AIMANDALA_LLM_MODEL`
- `AIMANDALA_LLM_VISION_FALLBACK_*` 已配置时，视觉任务会在主模型失败后尝试 fallback
- 报告正文不再支持通过 LLM report/prompt runtime 配置覆盖

最小示例：

```bash
export AIMANDALA_LLM_BACKEND=openai_compatible
export AIMANDALA_LLM_BASE_URL="https://api.deepseek.com/v1"
export AIMANDALA_LLM_API_KEY="<your-api-key>"
export AIMANDALA_LLM_MODEL="deepseek-v4-pro"
export AIMANDALA_LLM_CHAT_MODEL="deepseek-v4-pro"
export AIMANDALA_LLM_VISION_MODEL="deepseek-v4-pro"
export AIMANDALA_LLM_TIMEOUT_SECONDS=30
export AIMANDALA_LLM_MAX_RETRIES=2
export AIMANDALA_LLM_RETRY_BACKOFF_MS=400
```

MVP 本地 / staging 视觉模型口径：

```bash
export AIMANDALA_LLM_BACKEND=openai_compatible
export AIMANDALA_LLM_BASE_URL="<text-or-default-openai-compatible-url>"
export AIMANDALA_LLM_API_KEY="<text-or-default-api-key>"
export AIMANDALA_LLM_MODEL="deepseek-v4-pro"
export AIMANDALA_LLM_CHAT_MODEL="deepseek-v4-pro"
export AIMANDALA_LLM_VISION_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export AIMANDALA_LLM_VISION_MODEL="qwen-vl-max-latest"
export AIMANDALA_LLM_VISION_API_KEY="<dashscope-api-key>"
export AIMANDALA_LLM_VISION_FALLBACK_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
export AIMANDALA_LLM_VISION_FALLBACK_MODEL="ep-20260316095322-94wf5"
export AIMANDALA_LLM_VISION_FALLBACK_API_KEY="<doubao-api-key>"
```

失败降级策略：

- Qwen 视觉成功：`detect.method=llm_vision` 或 `llm_vision_estimated`。
- Qwen 请求失败、空响应或 JSON 解析失败：自动尝试豆包 fallback。
- Qwen 与豆包都失败：返回低置信度 `method=llm_fallback`，默认三圈 `inner=0.33 / middle=0.66`。
- detector backend 未配置或图片不存在：返回 `method=default`。
- 前端 / 产品侧遇到 `llm_fallback` 或 `default` 时，不应当作高可信自动识别，应提示用户手动三圈或重试。

部署模板参考：

- `projects/aimandala/docs/tasks/2026-04-05-腾讯云部署环境模板.md`
- `projects/aimandala/toC/app/backend/.env.staging.example`
- `projects/aimandala/toC/app/backend/.env.production.example`
- `projects/aimandala/deploy/tencent-cloud/aimandala-backend.service.example`
- `projects/aimandala/deploy/tencent-cloud/aimandala-api.nginx.conf.example`

## 下一步建议

后续优先级建议：

1. 把本地临时上传升级成正式图片存储方案
2. 继续增强 Lite / Pro 知识库 projection 与报告骨架质量
3. 针对报告生成、Layer0 画面事实提取和报告追问收口 provider 选择与线上配置
4. 继续完善 safety / knowledge 的正式编排与回归评估

## 视觉模型评测

MVP 阶段，文字模型默认选用 DeepSeek V4；视觉模型已经完成国产模型评测、稳定性评测、人工细看、后端 e2e smoke、前端 runtime smoke 和默认接入 QA Gate。

本地 / staging 默认：

- `AIMANDALA_LLM_VISION_MODEL=qwen-vl-max-latest`
- `AIMANDALA_LLM_VISION_FALLBACK_MODEL=ep-20260316095322-94wf5`

生产配置仍需单独 change record，不在本地 / staging 验证中直接切换。

计划模式：

```bash
PYTHONPATH=projects/aimandala/toC/app/backend \
python3 projects/aimandala/toC/app/backend/scripts/run_vision_model_evals.py \
  --fixture-id toc-mvp-fixture-001
```

候选配置模板：

```bash
PYTHONPATH=projects/aimandala/toC/app/backend \
python3 projects/aimandala/toC/app/backend/scripts/run_vision_model_evals.py \
  --print-config-template
```

当前模板内置 `doubao-vision`、`qwen-vl`、`glm-vision`、`kimi-vision` 四个候选入口。

真实调用必须显式加 `--execute`，并通过 `--candidate-config` 提供候选模型配置；脚本默认不会请求真实模型 API。
