# RelayHub v1 VS Code Claude Code 本机直接可用收口交付说明

## Summary

本轮交付的目标不是继续补治理口径，而是让当前这台机器上的 `VS Code / Claude Code` 尽快进入可直接使用状态。

## Delivery Notes

- 新增一轮 `spec / task / qa / delivery` artifact，主题为“本机直接可用收口”
- 修正了本地配置检查脚本对用户级 `~/.claude/settings.json.env` 的识别
- worktree 根已落地本地 `.vscode/settings.json`
- 用户级 `~/.claude/settings.json` 的冲突 `env.ANTHROPIC_*` 已处理
- 本地 `control-plane` 与 `dev-relay` 已纳入本轮直接启动与 smoke 验证范围

## Closeout

- 当前推荐顺序：
  - 启动本地 `control-plane`
  - 启动本地 `dev-relay`
  - 跑本地配置检查
  - 跑 `local-claude-code-cli-smoke.sh`
  - 再回到 `VS Code / Claude Code` 实际使用
- 当前仍不纳入主结论：
  - release
  - `Paperclip claude_local`
  - `Codex relay` 恢复开发
