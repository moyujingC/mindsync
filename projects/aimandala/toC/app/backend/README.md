# Backend

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

当前这里承接的是 `AI-Mandala / 一镜一梳` To C 主线在 `mindsync` 里的第一批 `V2` 迁移骨架。

已经迁入并可运行的内容：

- `app/core/pipeline/data_models.py`
- `app/core/pipeline/store.py`
- `app/core/pipeline/orchestrator_v2.py`
- `app/core/analysis/circle_detector.py`
- `app/core/safety/protocol.py`
- `app/api/main.py`
- `app/api/routes_v2.py`

当前这批实现的目标不是复刻旧仓库全部能力，而是先打通一条最小可验证的 To C 主路径。

## 当前可用接口

当前最小 `V2` API 包含：

- `POST /api/v2/upload-image`
- `POST /api/v2/detect-circles`
- `POST /api/v2/interpretations`
- `GET /api/v2/interpretations/{interpretation_id}`
- `GET /api/v2/interpretations/{interpretation_id}/status`
- `GET /api/v2/interpretations/{interpretation_id}/report`
- `POST /api/v2/interpretations/{interpretation_id}/upgrade`
- `GET /api/v2/users/{user_id}/interpretations`
- `GET /api/v2/pricing`
- `GET /health`

其中当前已经打通的最小行为：

- 浏览器上传文件可以先落到后端本地临时路径
- 本地上传现在也会返回可直接访问的 `image_url`，用于把迁移期 `local` 上传契约先收口到和远程对象存储一致的消费方式
- 本地临时上传目录会清理超过 24 小时的旧文件
- 上传存储已经抽成独立策略层，当前默认走 `local` 工厂实现
- `s3 / oss` 已有 dry-run 远程元数据语义，可先产出稳定的 `storage_key / image_url`
- `cos` 已接入真实上传实现；即使走腾讯云 COS，后端也仍会保留本地 `image_path`，保证当前 detect/create/report 主链无需改契约
- 远程上传后端现在已补上环境变量配置校验，能区分“缺配置”和“实现未接入”
- 上传响应已开始返回统一的 `storage_backend / storage_key / image_url` 元数据
- 上传响应现已补充 `image_local_expires_at`，前端可以明确感知本地临时路径的预计过期时间
- `create` 请求现已支持透传 `image_url / storage_backend / storage_key / image_local_expires_at` 并入库，保证图片生命周期后续可追踪
- 本地上传文件现在可通过 `GET /api/v2/uploads/{storage_key}` 读取，便于 preview/runtime 继续消费同一份上传对象语义
- 独立三圈检测接口可用
- Lite 初始化可创建记录
- 会生成一份迁移期 `一镜 Lite 版` 报告
- Lite 报告已经开始按 `layer_1 / layer_2` 的结构字段输出更完整的故事、主题洞察、小觉察和实验内容
- Lite 报告内容已经开始受 `theme / painting_intention / painting_feeling / 三圈参数` 影响，不再只是固定模板
- Lite 报告文案与结构已开始明显向旧主线正式报告靠拢，包含更接近正式产品口吻的标题、整体印象、心灵画像故事、主题表现、六个核心洞察与小实验
- 同一用户 / 同一图片 / 同一主题会复用已有记录
- 记录、状态、报告、历史列表都可以查询
- `upgrade` 已能写入并读取迁移期 `一梳 Pro 版` 报告
- Pro 报告已经开始按 `layer_3 / layer_4` 输出第一眼直觉、核心洞察、三圈画像、根源分析与调节建议
- Pro 报告内容也已经开始受 `theme / painting_intention / painting_feeling / 三圈参数` 影响，不再只是固定模板
- Pro 报告文案与结构也已开始向旧主线正式深度报告靠拢，包含第一眼直觉、核心洞察表格、Lite 基础承接、三圈深度诊断、失衡识别、根源探索与针对失衡问题的疗愈建议
- Lite / Pro 最终 markdown 都已接入 safety disclaimer 包装
- Lite / Pro 正式 Prompt 主干已开始迁回，当前后端已内置 `PromptBuilder + lite_v1.6/pro_v1.6` 模板，并能在 `layer_1_lite_draft.prompt_preview` / `layer_3_pro_draft.prompt_preview` 输出当前 prompt 预览
- Lite / Pro `report.structured` 已开始透出 `prompt_schema_validation_issues`，可直接检查当前输出是否满足 prompt schema 必填字段
- Lite / Pro 生成流程已接入可替换 `generation runtime`（默认 deterministic），后续接真实模型调用时可在不改主链 API 的前提下替换实现
- 生成链路已补充 `prompt_runtime` 注入点，可用 `prompt + schema -> structured payload` 覆写 Lite / Pro 关键字段，并保留 deterministic 兜底

## 当前边界

当前实现明确还没有接入：

- 正式对象存储 / CDN 上传链路
- 基于 `s3 / oss` dry-run 升级为真实远程上传实现
- 更完整的上传生命周期治理（例如引用计数、后台清理任务、持久化策略）
- 真实的 Lite 分析链路
- 基于迁回 Prompt 的真实 Lite 模型调用
- 旧主线里的正式 Pro 生成内容链路
- 迁回 Prompt 主干后的真实模型调用编排
- knowledge engine
- AI model runtime
- OpenCV / 远程视觉模型驱动的正式三圈检测
- To B / Studio / V3

也就是说，当前 Lite / Pro `report` 都已经能沿正式主路径读取，而且结构比最初的骨架更完整；Lite / Pro 的呈现方式也已经开始向旧主线正式报告靠拢；但 Lite / Pro 内容本身仍然不是旧主线完整 AI 生成结果，不应当被当成最终正式用户解读内容。

## 验证

当前建议的基础验证命令：

```bash
pytest projects/aimandala/toC/app/backend/tests/unit
```

最近一轮迁移验证通过的单测规模是：

- `73 passed`
- `test_api_health.py + test_pipeline_orchestrator.py + test_prompt_builder.py + test_report_blueprints.py + test_upload_storage.py` 当前为 `73 passed`

## COS 配置

如需切到腾讯云 COS，当前可用环境变量如下：

- `AIMANDALA_UPLOAD_BACKEND=cos`
- `AIMANDALA_UPLOAD_COS_SECRET_ID`
- `AIMANDALA_UPLOAD_COS_SECRET_KEY`
- `AIMANDALA_UPLOAD_COS_BUCKET`
- `AIMANDALA_UPLOAD_COS_REGION`
- `AIMANDALA_UPLOAD_COS_KEY_PREFIX`（可选，默认 `aimandala/uploads`）
- `AIMANDALA_UPLOAD_COS_PUBLIC_BASE_URL`（可选，可指向备案后的正式域名或 CDN 域名）
- `AIMANDALA_UPLOAD_LOCAL_RETENTION_HOURS`（可选，默认 `24`，控制本地临时文件过期窗口）

说明：

- `COS` 当前会真实上传远端对象，同时保留本地临时文件，避免现有 `image_path` 主链断掉
- 若未安装 `cos-python-sdk-v5`，接口会返回 `501`

## Prompt Runtime 配置

如需把 Lite / Pro 结构生成接到外部模型网关，当前可用环境变量如下：

- `AIMANDALA_PROMPT_RUNTIME_BACKEND`（可选，默认 `noop`；可设为 `http`）
- `AIMANDALA_PROMPT_RUNTIME_HTTP_URL`（`http` 模式必填）
- `AIMANDALA_PROMPT_RUNTIME_HTTP_TIMEOUT_SECONDS`（可选，默认 `20`）
- `AIMANDALA_PROMPT_RUNTIME_HTTP_API_KEY`（可选）
- `AIMANDALA_PROMPT_RUNTIME_HTTP_API_KEY_HEADER`（可选，默认 `Authorization`）
- `AIMANDALA_PROMPT_RUNTIME_HTTP_MAX_RETRIES`（可选，默认 `2`）
- `AIMANDALA_PROMPT_RUNTIME_HTTP_RETRY_BACKOFF_MS`（可选，默认 `300`）

说明：

- `noop` 下不会触发外部请求，仍走 deterministic 生成兜底
- `http` 下会向 `AIMANDALA_PROMPT_RUNTIME_HTTP_URL` 发送 `POST` JSON，协议版本为 `aimandala.prompt-runtime.v1`
- 请求体主字段：`report_type`、`input.prompt`、`input.schema`（并兼容平铺 `prompt/schema`）
- 响应体支持三种格式：
  - 直接返回 structured 对象
  - `{ "structured": { ... } }`
  - `{ "ok": true, "data": { "structured": { ... } } }`
- 运行时内置 Lite / Pro 字段别名映射（中英/驼峰/产品文案键名 -> canonical structured 字段），网关可只返回最小字段集
- 运行时会对 `408/409/425/429/5xx`、`URLError`、`TimeoutError` 做受控重试（线性退避）
- 若 `http` 配置不完整，V2 接口会返回 `501`，避免静默误用错误配置

最小返回样例（可直接给网关实现）：

Lite（最小必需）：

```json
{
  "ok": true,
  "data": {
    "report_type": "lite",
    "structured": {
      "title": "慢慢亮起来的中心",
      "overall_impression": "我看见你在稳住自己，也在准备向外展开。",
      "visual_elements": "画面里有一种先收后放的节奏。",
      "emotion_portrait": "你正在把分散的情绪慢慢收回中心。",
      "story": {
        "base": "你底层是很有韧性的。",
        "contradiction": "你一边想推进，一边又怕失控。"
      },
      "theme_scene": "在事业场景里，你常先观察再出手。",
      "theme_impact": "这让你决策更稳，但也会拉长启动时间。",
      "theme_awareness": "先允许自己小步推进，不要求一步到位。",
      "pro_teaser": "Pro 会进一步指出失衡类型并给出对应建议。"
    }
  }
}
```

Pro（最小必需）：

```json
{
  "ok": true,
  "data": {
    "report_type": "pro",
    "structured": {
      "first_impression": "你的能量核心是敏感而有判断力的。",
      "core_insight_table": {
        "能量本质": "外柔内稳",
        "核心失衡": "推进时容易反复拉扯"
      },
      "three_circles_detailed": {
        "inner": { "label": "内圈", "reading": "内在在寻求确定感" }
      },
      "micro_analysis_detailed": {
        "节奏": "启动慢，但一旦进入会持续推进"
      },
      "imbalance_confirmed": {
        "primary": "boundary-constriction",
        "summary": "主要是边界收紧型失衡"
      },
      "root_cause": {
        "surface": "担心投入后失去掌控"
      },
      "healing_suggestions": [
        { "phase": "第1阶段", "focus": "先稳住节奏", "practice": "每天只推进一件关键事" }
      ]
    }
  }
}
```

联调 checklist（`prompt_runtime=http`）：

1. 配置环境变量并重启后端进程
2. 确认网关地址可从后端机器访问（安全组/防火墙/出口策略）
3. 先用 `detect-circles` 验证接口仍可用（确保不是后端整体启动失败）
4. 触发 `create -> report(lite)`，确认报告字段出现网关返回的特征文本
5. 触发 `upgrade -> report(pro)`，确认 Pro 字段被网关返回覆盖
6. 人工制造网关超时或 5xx，确认主链会回退 deterministic（不阻断）

本地/服务器 curl 示例：

```bash
# 1) 启用 http prompt runtime
export AIMANDALA_PROMPT_RUNTIME_BACKEND=http
export AIMANDALA_PROMPT_RUNTIME_HTTP_URL="https://<your-gateway>/aimandala/prompt-runtime"
export AIMANDALA_PROMPT_RUNTIME_HTTP_TIMEOUT_SECONDS=20
export AIMANDALA_PROMPT_RUNTIME_HTTP_API_KEY="<your-api-key>"
export AIMANDALA_PROMPT_RUNTIME_HTTP_API_KEY_HEADER="Authorization"
export AIMANDALA_PROMPT_RUNTIME_HTTP_MAX_RETRIES=2
export AIMANDALA_PROMPT_RUNTIME_HTTP_RETRY_BACKOFF_MS=300

# 2) 健康检查
curl -s http://127.0.0.1:8000/health

# 3) 先做三圈检测（图片路径按实际机器替换）
curl -s http://127.0.0.1:8000/api/v2/detect-circles \
  -H "Content-Type: application/json" \
  -d '{
    "image_path": "/absolute/path/to/mandala.png"
  }'

# 4) 创建 Lite 记录
curl -s http://127.0.0.1:8000/api/v2/interpretations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "debug-user-1",
    "image_path": "/absolute/path/to/mandala.png",
    "theme": "career"
  }'

# 5) 拉取 Lite 报告（把 <interpretation_id> 替换成上一步返回值）
curl -s "http://127.0.0.1:8000/api/v2/interpretations/<interpretation_id>/report?version=lite"

# 6) 升级 Pro 并拉取 Pro 报告
curl -s -X POST "http://127.0.0.1:8000/api/v2/interpretations/<interpretation_id>/upgrade"
curl -s "http://127.0.0.1:8000/api/v2/interpretations/<interpretation_id>/report?version=pro"
```

快速判定是否真的走到了网关：

- 如果 Lite/Pro 报告中出现你在网关 mock 返回里设置的特征短语，说明覆盖成功
- 如果网关不可用但主链仍返回报告，通常是 deterministic fallback 生效（属于预期）
- 如果接口直接返回 `501`，优先检查 `AIMANDALA_PROMPT_RUNTIME_HTTP_URL` 和超时/重试配置是否合法

部署模板参考：

- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-05-腾讯云部署环境模板.md`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/.env.production.example`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/tencent-cloud/aimandala-backend.service.example`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/tencent-cloud/aimandala-api.nginx.conf.example`

## 下一步建议

后续优先级建议：

1. 把本地临时上传升级成正式图片存储方案
2. 把当前 Lite 结构化占位内容替换成旧主线里的正式 Lite 生成链路
3. 把当前 Pro 结构化占位内容替换成旧主线里的正式 Pro 生成内容
4. 逐步接入 prompt / safety / knowledge 的正式编排
