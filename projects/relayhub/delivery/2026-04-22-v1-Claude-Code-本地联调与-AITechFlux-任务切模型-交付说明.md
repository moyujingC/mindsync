# RelayHub v1 Claude Code 本地联调与 AITechFlux 任务切模型交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-交付说明.md

## Summary

本轮交付把已经实现的 `control-plane`、`dev-relay` 和中转入口激活链路真正收成一条本地可操作闭环：

- 先激活 `AITechFlux`
- 再把 `task-claude-code` 绑定到该入口
- 最后通过本地 `Claude Code` 或 relay 请求确认后续调用跟随任务绑定切换

本轮正式结论是：`RelayHub` 已经具备“本地 Claude Code 可调用的最小中转站”能力，且 `AITechFlux` 已跑通第一条真实入口链路。

## Delivery Notes

- 新增本地 smoke 脚本：
  - `projects/relayhub/dev-relay/local-claude-code-aitechflux-smoke.sh`
- 新增本地验证记录：
  - `2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-验证记录.md`
- 本轮实测确认：
  - `AITechFlux` 可返回真实 catalog
  - 选中 `高性能低价模型` 后可测试成功并进入 `active`
  - `task-claude-code` 绑定切到 `AITechFlux` 后，relay 请求会按该入口转发
  - 切回 `PPChat` 后，relay 目标会同步变化，但上游返回 `401`
  - `dev-relay` 已补 `Anthropic` 流式事件兼容，`POST /v1/messages` 的 `stream=true` 可返回本地 SSE
- 本轮不改 release 部署
- 本轮不补本地 console 同源联调壳
- 任务切换继续通过 `PATCH /tasks/task-claude-code` 完成

## Closeout

- 当前主成功路径：
  - `AITechFlux -> 激活 -> task-claude-code 绑定 -> dev-relay 跟随切换`
- 当前不纳入主成功结论的部分：
  - `PPChat` 上游凭据有效性
  - release 机器联调
  - 页面内一键本地切任务
  - `claude --bare -p` 的自然退出兼容性
- 当前建议的本地使用方式：
  - 保持 `Claude Code` 指向本地 `dev-relay`
  - 把模型切换动作统一收口到 `PATCH /tasks/task-claude-code` 或后续任务库页面操作
