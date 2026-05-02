# RelayHub v1 VS Code Claude Code 本地配置检查闭环交付说明

## Summary

本轮交付把 `VS Code / Claude Code` 的本地接入，从“有模板可复制”继续推进到“有只读检查入口可诊断”。

## Delivery Notes

- 新增一轮 `spec / task / qa / delivery` artifact，主题为“本地配置检查闭环”
- 新增一个只读本地检查脚本，默认检查：
  - worktree 根 `.vscode/settings.json`
  - 当前 shell 环境
  - 用户级 `~/.claude/settings.json`
- 更新 runbook，把检查脚本接入现有推荐顺序
- 本轮继续不自动修改本地 `.vscode/settings.json` 或 `~/.claude/settings.json`

## Closeout

- 当前推荐顺序：
  - 先跑 `local-claude-code-cli-smoke.sh`
  - 再跑本地配置检查脚本
  - 按检查结果修正本地工作区、shell 或用户级 Claude 配置
  - 再回到 `VS Code / Claude Code` 验证
- 当前仍不纳入主结论：
  - release
  - `Paperclip claude_local`
  - `Codex relay` 恢复开发
