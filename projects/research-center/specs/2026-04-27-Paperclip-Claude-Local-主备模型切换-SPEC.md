# Paperclip claude_local 主备模型切换 SPEC

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：projects/research-center/specs/2026-04-27-Paperclip-Claude-Local-主备模型切换-SPEC.md

## 1. 目标

把 `Paperclip` 中 `claude_local` 这组 agent 的当前主模型口径，切到：

- 主链路：`PPChat`
- 主模型：`gpt-5.4`

同时补充一条明确可复用的备用口径：

- 备用链路：`AITechFlux`
- 备用模型：`Claude混合版`

## 2. 范围

本轮只处理：

- `Paperclip` 运行时中的 `claude_local` agent
- `mindsync` 仓库中的正式配置口径与说明

本轮不处理：

- `codex_local`
- `pi_local`
- `hermes_local`
- `RelayHub` 路由协议本身

## 3. 默认决策

- 当前 `claude_local` 主链路改为 `PPChat + gpt-5.4`
- 当前 `AITechFlux + Claude混合版` 只先定义为备用配置口径
- 若 `Paperclip` 运行时尚无“自动跨 base URL 失败回退”机制，本轮不虚构自动回退能力
- 本轮至少保证：
  - 主链路配置立即生效
  - 备用链路字段被正式记录，可后续手动或脚本切换

## 4. 验收口径

- 仓库文档已更新 `claude_local` 当前主链路
- `Paperclip` 运行时所有 `claude_local` agent 已切到 `PPChat + gpt-5.4`
- 备用链路 `AITechFlux + Claude混合版` 已在正式 artifact 中写清
- 运行态读取结果与仓库口径一致
