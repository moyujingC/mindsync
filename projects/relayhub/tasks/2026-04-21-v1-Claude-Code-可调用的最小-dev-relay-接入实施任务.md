# RelayHub v1 Claude Code 可调用的最小 dev-relay 接入实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-21
> source_of_truth：projects/relayhub/tasks/2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

实现一个本地可运行的 `dev-relay`，让 Claude Code 能通过 RelayHub 的任务绑定结果切换上游模型入口。

## 2. 交付范围

### 2.1 文档

- 新增本轮 `spec / task / qa / delivery`
- 更新 `specs/README.md`
- 更新 `tasks/README.md`
- 更新 `qa/README.md`
- 更新 `delivery/README.md`

### 2.2 服务

新增：

- `projects/relayhub/dev-relay/package.json`
- `projects/relayhub/dev-relay/src/server.mjs`
- `projects/relayhub/dev-relay/src/test/*.test.mjs`

### 2.3 服务能力

实现：

- `GET /health`
- `POST /chat/completions`

固定行为：

- 从 `task-claude-code` 读取绑定入口
- 仅允许 `active` 且有 `apiKey` 的入口转发
- relay 侧覆盖请求体中的 `model`
- relay 侧注入上游 `Authorization`
- 请求发往入口的 `/chat/completions`

## 3. 测试驱动范围

优先写失败测试，至少覆盖：

- 能解析 `task-claude-code` 当前绑定入口
- 绑定为空时返回清楚错误
- 绑定入口不是 `active` 时返回清楚错误
- 缺少 `apiKey` 时返回清楚错误
- 转发时正确使用 `baseUrl`
- 转发时正确注入 `Authorization`
- 转发时正确覆盖 `model`
- 修改 `task-claude-code.defaultModelEntryId` 后，后续请求走新入口

## 4. 集成验证

至少补一组 mock 上游集成验证：

- 本地伪上游接收 `chat/completions`
- relay 把请求打到伪上游
- 伪上游返回流式或非流式响应
- relay 将成功结果回传给调用方

## 5. 回归要求

完成实现后必须运行：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`

## 6. 非目标

本轮明确不做：

- `responses`
- 多任务路由
- release 部署
- 自动运行记录
- 模型推荐
- fallback 路由

