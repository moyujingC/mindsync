# RelayHub v1 VS Code Claude Code 环境注入模板化交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化-交付说明.md

## Summary

本轮交付把 `VS Code / Claude Code` 的本地宿主环境注入，从“已有主路径口径”继续推进到“有模板可复制”的状态。

## Delivery Notes

- 新增一轮 `spec / task / qa / delivery` artifact，主题改为“环境注入模板化”
- 新增：
  - relay 环境 `env` 模板
  - `VS Code settings` 模板片段
  - setup 示例脚本
- 更新 `VS Code Claude Code` runbook，把：
  - 前台 CLI smoke
  - 后台 VS Code 宿主接入
  分开写清
- 本轮继续保持：
  - `Codex relay` 默认关闭
  - `Paperclip claude_local` 不纳入当前主路径

## Closeout

- 当前推荐做法：
  - 先用 CLI smoke 验证 relay 真链路
  - 再按模板把环境复制到本地工作区
  - 再用 `VS Code / Claude Code` 走同一套环境
- 当前仍不纳入主结论：
  - release 部署
  - `Paperclip claude_local`
  - `Codex relay` 恢复开发
