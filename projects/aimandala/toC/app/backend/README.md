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
- 本地临时上传目录会清理超过 24 小时的旧文件
- 上传存储已经抽成独立策略层，当前默认走 `local` 工厂实现
- `s3 / oss` 已有 dry-run 远程元数据语义，可先产出稳定的 `storage_key / image_url`
- 远程上传后端现在已补上环境变量配置校验，能区分“缺配置”和“实现未接入”
- 上传响应已开始返回统一的 `storage_backend / storage_key / image_url` 元数据
- 独立三圈检测接口可用
- Lite 初始化可创建记录
- 会生成一份迁移期 `一镜 Lite 版` 占位报告
- 同一用户 / 同一图片 / 同一主题会复用已有记录
- 记录、状态、报告、历史列表都可以查询
- `upgrade` 目前是兼容占位接口，不代表正式 Pro 链路已接入

## 当前边界

当前实现明确还没有接入：

- 正式对象存储 / CDN 上传链路
- 基于 `s3 / oss` dry-run 升级为真实远程上传实现
- 更完整的上传生命周期治理（例如引用计数、后台清理任务、持久化策略）
- 真实的 Lite 分析链路
- 真实的 Pro 生成链路
- prompt builder
- knowledge engine
- AI model runtime
- OpenCV / 远程视觉模型驱动的正式三圈检测
- To B / Studio / V3

也就是说，当前 `report` 仍然是迁移占位报告，不应当被当成正式用户解读内容。

## 验证

当前建议的基础验证命令：

```bash
pytest projects/aimandala/toC/app/backend/tests/unit
```

最近一轮迁移验证通过的单测规模是：

- `67 passed`

## 下一步建议

后续优先级建议：

1. 把本地临时上传升级成正式图片存储方案
2. 把 Lite 占位报告替换成真实 Lite 结构化生成链路
3. 逐步接入 prompt / safety / knowledge 的正式编排
4. 再决定 Pro 占位链路是否升级为真实生成链路
