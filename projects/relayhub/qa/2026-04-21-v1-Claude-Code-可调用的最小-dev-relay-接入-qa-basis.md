# RelayHub v1 Claude Code 可调用的最小 dev-relay 接入 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-21
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/qa/2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认 RelayHub 已具备“Claude Code 通过本地 dev-relay 跟随任务绑定切模型”的最小可用能力。

## 2. 自动化验证

必须通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`

`dev-relay` 自动化测试至少覆盖：

- `task-claude-code` 已绑定且入口激活时，可成功解析上游配置
- `task-claude-code` 未绑定时，返回清楚错误
- 绑定入口不是 `active` 时，返回清楚错误
- 缺少 `apiKey` 时，返回清楚错误
- relay 会覆盖请求中的 `model`
- relay 会注入入口的 `Authorization`
- 切换 `task-claude-code.defaultModelEntryId` 后，后续请求走新入口
- `GET /health` 正常返回

## 3. 手工 Smoke

至少执行以下链路：

1. 在任务库把 `Claude Code Web Coding` 绑定到一个已激活入口
2. 启动 `dev-relay`
3. 用本地 OpenAI-compatible 请求打 `POST /chat/completions`
4. 在任务库切到另一个已激活入口
5. 再次请求
6. 确认后续调用已切到新入口

## 4. 通过标准

- Claude Code 只需要指向一个本地 RelayHub 入口
- 任务库中的默认模型切换会影响后续 relay 调用
- 错误状态不会伪装成可用成功
- 不需要新增 control-plane 路由也能完成链路

