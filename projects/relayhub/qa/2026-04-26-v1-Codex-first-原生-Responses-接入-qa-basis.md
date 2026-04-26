# RelayHub v1 Codex-first 原生 Responses 接入 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-26
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/qa/2026-04-26-v1-Codex-first-原生-Responses-接入-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/specs/2026-04-26-v1-Codex-first-原生-Responses-接入说明.md

## 1. 目标行为

本轮应满足：

1. `Codex` 可通过 `task-codex-repo` 绑定入口访问 RelayHub
2. RelayHub 对 `Responses API` 提供原生透传能力
3. 只有通过 `Responses` 流式探测的入口才允许绑定给 `task-codex-repo`
4. Claude 路由保持可用，不被 Codex 接入回归破坏
5. release 上存在独立 `codex /v1` 路由

## 2. 验收标准

### 2.1 dev-relay

必须满足：

- `GET /v1/models` 返回 OpenAI-compatible models 列表
- 返回列表只包含 `task-codex-repo` 当前绑定的 `modelId`
- `POST /v1/responses` 非流式响应透传成功
- `POST /v1/responses` 流式响应透传成功
- 未绑定、未激活、缺 Key、未通过探测时返回明确错误

### 2.2 control-plane

必须满足：

- `POST /models/:id/test` 执行真实探测
- 模型条目公共返回包含 `capabilities`
- 探测结果能区分：
  - 可绑定 Codex
  - 仅支持 Chat，不可绑定 Codex
  - `Responses` 仅非流式可用
- `task-codex-repo` 绑定不兼容入口时返回 `409`

### 2.3 console

必须满足：

- 模型库能看见 Codex 兼容状态
- 任务库能看见 `Codex Repo Coding` 的绑定前置条件
- 不兼容入口在 Codex 绑定流程中不会被误导为可用

### 2.4 release

必须满足：

- `relayhub-dev-relay` 监听 `127.0.0.1:4319`
- `https://relayhub.jingshu.cc/codex/v1/models` 可访问
- `https://relayhub.jingshu.cc/codex/v1/responses` 支持流式
- `/api/control-plane/*`、`/api/*`、`/codex/v1/*` 路由不串线

## 3. 关键边界测试

至少覆盖：

- 上游支持 `chat/completions` 但不支持 `responses`
- 上游支持 `responses` 非流式但流式断开
- `task-codex-repo` 已绑定后再切换入口，后续请求跟随变化
- `task-claude-code` 继续使用仅 chat 能力入口

## 4. 质量门结论

只有同时满足下面条件，才可视为本轮完成：

- Codex 本地 `Responses` 真链路跑通
- `task-codex-repo` 绑定校验已生效
- console 已明确显示 Codex 兼容状态
- release `codex /v1` 路由已具备 SSE 友好配置

## 5. 当前验证结果

截至 `2026-04-26`，当前工作区内已完成的自动化验证如下：

- `projects/relayhub/dev-relay`
  - `npm test` 通过
  - 已覆盖 `GET /v1/models`、`POST /v1/responses` 非流式与流式透传、Codex 绑定错误语义、Claude 路由回归
- `projects/relayhub/control-plane`
  - `npm test` 通过
  - 已覆盖真实探测结果写入 `capabilities`
  - 已覆盖 chat-only、responses 非流式可用但流式失败、Codex 绑定拒绝、Claude 绑定放行
- `projects/relayhub/console`
  - `npm test` 通过
  - `npm run build` 通过
  - 已覆盖模型库 Codex 兼容状态展示、任务库阻断提示、Codex 可绑定入口切换

尚未在当前工作区直接完成的验证：

- 本地真实 `curl http://127.0.0.1:4319/v1/*` smoke
- 把外部 Codex `base_url` 临时切到本地 RelayHub 的真实请求
- release 机上的 `https://relayhub.jingshu.cc/codex/v1/*` smoke

因此，本轮自动化质量门已通过；真实链路 smoke 仍需在本地运行服务和 release 节点上按 runbook 执行。
