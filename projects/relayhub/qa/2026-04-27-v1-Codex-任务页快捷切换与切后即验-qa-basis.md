# RelayHub v1 Codex 任务页快捷切换与切后即验 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-27
> source_of_truth：projects/relayhub/qa/2026-04-27-v1-Codex-任务页快捷切换与切后即验-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认任务页已经支持：

- 直接切换 `Codex Repo Coding` 当前绑定模型
- 只允许绑定通过 `Responses` 流式探测的入口
- 切换后可以立即做一次本地真链路验证

## 2. 自动化验证

至少覆盖：

- `Codex 当前模型` 区块展示当前绑定
- 切换到 `Responses` 就绪入口后保存成功
- 切换到不兼容入口时显示阻断提示，按钮不可用
- 点击 `验证 Codex 当前模型` 会请求 `http://127.0.0.1:4319/v1/responses`
- 成功时显示验证成功消息

## 3. 手工 smoke

至少覆盖：

- 打开 `/tasks`
- 在 `Codex 当前模型` 中切换到一个已通过探测的入口
- 点击 `验证 Codex 当前模型`
- 页面显示 relay 返回结果

## 4. 边界要求

- 若当前绑定为空，验证按钮不可用
- 若所选入口缺少 `Responses` 流式能力，不允许误保存为 `task-codex-repo`

