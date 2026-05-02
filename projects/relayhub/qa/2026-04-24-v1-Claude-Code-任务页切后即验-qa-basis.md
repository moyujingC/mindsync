# RelayHub v1 Claude Code 任务页切后即验 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-24
> source_of_truth：projects/relayhub/qa/2026-04-24-v1-Claude-Code-任务页切后即验-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认任务页切完 `Claude Code` 当前模型后，可以立即做一次本地真链路验证。

## 2. 自动化验证

至少覆盖：

- 点击 `验证 Claude Code 当前模型` 会请求本地 `dev-relay`
- 成功时显示验证成功消息
- 失败时显示可读错误

## 3. 手工 smoke

至少覆盖：

- 打开 `/tasks`
- 切换 `Claude Code 当前模型`
- 点击验证按钮
- 页面显示本地 relay 返回结果
