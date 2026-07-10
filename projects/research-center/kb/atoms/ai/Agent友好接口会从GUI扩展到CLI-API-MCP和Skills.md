# Agent 友好接口会从 GUI 扩展到 CLI、API、MCP 和 Skills

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-07-10
> source_of_truth：projects/research-center/kb/atoms/ai/Agent友好接口会从GUI扩展到CLI-API-MCP和Skills.md

## 一句话判断

Agent 时代的软件入口不会只停留在 GUI（图形界面），还会扩展到 CLI（命令行界面）、API、MCP 和 Skills 等机器可调用接口。

## 类型

- 观点
- 方法

## 来源

- source：
  - [AI 应用人类界面与 Agent 界面外部线索](../../sources/ai/2026-07-10-AI应用人类界面与Agent界面-外部线索.md)
- 原文定位：
  - 宝玉《PC 软件为手机重做了一遍，现在轮到 Agent 了》：CLI、MCP、Skills 是给 Agent 开门的三种方式。
  - 宝玉《飞书 CLI 开源了，为什么 AI Agent 时代，大家都在做命令行工具？》：CLI 自描述、文本化，适合 Agent 使用；MCP 和 Skills 各有适用场景。
- 是否来自 AI 讨论：是

## 适用场景

- 判断 AI 应用应该优先开放哪种 Agent 入口。
- 设计内部工具、内容工具、企业协作工具的 Agent 适配方案。

## 不适用场景

- 面向 C 端轻量娱乐产品时，不一定需要一开始就开放完整 Agent 接口。
- 产品还没有稳定主功能时，不应过早铺满所有接口形态。

## 可信状态

- 已人工确认

## 说明

CLI、API、MCP 和 Skills 不是互斥关系。较稳的策略是先根据产品形态选择最小可用入口，再随着使用场景扩展。

