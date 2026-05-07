# RelayHub v1 Claude Code CLI 真链路收口交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-22-v1-Claude-Code-CLI-真链路收口-交付说明.md

## Summary

本轮交付把 `RelayHub` 从“relay 接口和本地 smoke 可用”推进到“本机 `claude` 命令可通过统一入口稳定调用”的阶段。

## Delivery Notes

- `run-claude-code-with-relay.sh` 默认启用本地设置隔离
- 本轮正式确认：
  - 用户级 `~/.claude/settings.json` 会覆盖 RelayHub 联调环境
  - 需要通过隔离设置源确保 CLI 命中本地 `4319`
- 新增 CLI 真链路 smoke 脚本：
  - `projects/relayhub/dev-relay/local-claude-code-cli-smoke.sh`
- 本轮实测确认：
  - `bash projects/relayhub/dev-relay/local-claude-code-cli-smoke.sh` 已自然完成
  - `claude` 返回了真实结果，不再停留在挂起或直接打错上游
- 本轮不改 release
- 本轮不改任务页主路径

## Closeout

- 当前主成功路径：
  - `run-claude-code-with-relay.sh -> dev-relay -> task-claude-code -> AITechFlux`
- 当前仍不纳入主结论的部分：
  - `PPChat` 第二入口成功可用
  - 页面内一键切任务
  - release 机器联调
- 当前正式结论：
  - RelayHub 已具备可复用的本地 Claude Code CLI 中转入口
