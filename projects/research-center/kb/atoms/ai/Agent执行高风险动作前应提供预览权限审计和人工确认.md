# Agent 执行高风险动作前应提供预览、权限、审计和人工确认

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-07-10
> source_of_truth：projects/research-center/kb/atoms/ai/Agent执行高风险动作前应提供预览权限审计和人工确认.md

## 一句话判断

Agent 在执行写入、删除、发布、发送等高风险动作前，应提供 dry-run（预览执行）、权限边界、审计记录和必要的人工确认。

## 类型

- 方法
- 风险边界

## 来源

- source：
  - [AI 应用人类界面与 Agent 界面外部线索](../../sources/ai/2026-07-10-AI应用人类界面与Agent界面-外部线索.md)
- 原文定位：
  - 宝玉《飞书 CLI 开源了...》：dry-run 是为 AI 设计的安全网；企业级 Agent 还需要权限体系、审计追踪和人机协作边界。
  - Microsoft Design《UX design for agents》：Agent 的透明度、控制权和一致性是基础设计要素。
- 是否来自 AI 讨论：是

## 适用场景

- Agent 可能修改外部系统、发送消息、删除数据、发布内容、触发财务或审批动作时。
- 企业级 Agent、内容发布 Agent、运营自动化 Agent。

## 不适用场景

- 只读查询、草稿生成、临时本地分析等低风险动作。

## 可信状态

- 已人工确认

## 说明

这条 atom 可以直接用于内容视觉工坊：生成图片和导出可以低风险自动化，但发布、覆盖、删除、同步到外部平台应有预览和确认。

