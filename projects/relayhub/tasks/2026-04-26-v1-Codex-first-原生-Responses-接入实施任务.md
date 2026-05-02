# RelayHub v1 Codex-first 原生 Responses 接入实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-26
> source_of_truth：projects/relayhub/tasks/2026-04-26-v1-Codex-first-原生-Responses-接入实施任务.md
> 项目：RelayHub
> 阶段：task
> depends_on：projects/relayhub/specs/2026-04-26-v1-Codex-first-原生-Responses-接入说明.md

## 1. 实施目标

让 `Codex` 通过 `RelayHub` 的 `task-codex-repo` 绑定结果，稳定走原生 `Responses API`。

## 2. 交付范围

### 2.1 文档

- 新增本轮 `spec / task / qa / delivery`
- 更新 `specs/README.md`
- 更新 `tasks/README.md`
- 更新 `qa/README.md`
- 更新 `delivery/README.md`

### 2.2 dev-relay

新增或增强：

- `GET /v1/models`
- `POST /v1/responses`
- 最小结构化日志

固定行为：

- `GET /v1/models` 固定读取 `task-codex-repo`
- `POST /v1/responses` 固定读取 `task-codex-repo`
- 上游固定走 `<baseUrl>/responses`
- relay 侧覆盖请求体中的 `model`
- relay 侧不转译 SSE

### 2.3 control-plane

实现：

- `POST /models/:id/test` 真实探测流程
- 模型能力摘要字段
- `task-codex-repo` 绑定校验

### 2.4 console

实现：

- 模型库显示 Codex 兼容状态
- 任务库在 `Codex Repo Coding` 上显示绑定前置条件
- 不兼容入口在 Codex 绑定场景下不可选或会明确报错

### 2.5 release

新增：

- `relayhub-dev-relay` service 安装脚本
- `codex /v1` nginx location 安装脚本
- nginx 示例更新

## 3. 测试驱动范围

至少覆盖：

- `POST /v1/responses` 非流式透传
- `POST /v1/responses` 流式透传
- `GET /v1/models` 只返回当前绑定模型
- `task-codex-repo` 切换后，请求跟随新绑定
- `task-codex-repo` 不允许绑定不支持 `Responses` 流式的入口
- `task-claude-code` 仍允许绑定只支持 `chat/completions` 的入口
- 现有 Claude 路由不回归

## 4. 集成验证

本地至少完成：

- `curl http://127.0.0.1:4319/v1/models`
- `curl POST http://127.0.0.1:4319/v1/responses`
- `curl -N POST http://127.0.0.1:4319/v1/responses`
- 临时把 Codex `base_url` 指向本地 RelayHub，完成一次真实请求

release 至少完成：

- `curl https://relayhub.jingshu.cc/codex/v1/models`
- `curl POST https://relayhub.jingshu.cc/codex/v1/responses`
- `curl -N POST https://relayhub.jingshu.cc/codex/v1/responses`

## 5. 回归要求

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`

## 6. 非目标

本轮明确不做：

- 多客户端自动识别
- `responses -> chat/completions` 协议转译
- 数据库存储
- 自动运行记录入库
- fallback 路由
