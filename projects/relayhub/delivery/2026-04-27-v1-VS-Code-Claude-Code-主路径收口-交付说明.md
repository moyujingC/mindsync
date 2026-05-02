# RelayHub v1 VS Code Claude Code 主路径收口交付说明

## Summary

本轮交付把 `RelayHub` 当前阶段默认主路径正式收口为：

- `VS Code / Claude Code`
- 本地 `dev-relay`
- `task-claude-code` 当前绑定

同时保留：

- `Codex relay` 实现继续存在，但默认停用
- `Paperclip claude_local` 继续维持独立链路，不并入本轮主路径

## Delivery Notes

- 新增一轮 `spec / task / qa / delivery` artifact，明确阶段目标改向
- 新增面向 `VS Code / Claude Code` 的本地 runbook
- 本轮正式写清：
  - `run-claude-code-with-relay.sh` 是当前唯一推荐的本机 Claude Code 启动入口
  - `CLI` smoke 只作为底层验证依据
  - 不再把“CLI 单次已通”直接等同于“VS Code 主路径已稳定”
- 同步 `specs/README.md`、`tasks/README.md`、`qa/README.md`、`delivery/README.md` 入口

## Closeout

- 当前优先使用面：
  - `VS Code / Claude Code -> run-claude-code-with-relay.sh -> dev-relay -> task-claude-code`
- 当前明确不纳入主结论：
  - `Paperclip claude_local`
  - release 机器联调
  - 恢复 `Codex relay` 作为默认开发入口
- 当前正式结论：
  - `RelayHub` 已经把 `Codex` 干扰降到默认关闭
  - 后续开发应优先围绕 `VS Code / Claude Code` 主路径推进
