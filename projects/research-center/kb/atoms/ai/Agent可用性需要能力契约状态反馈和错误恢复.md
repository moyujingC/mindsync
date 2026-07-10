# Agent 可用性需要能力契约、状态反馈和错误恢复

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-07-10
> source_of_truth：projects/research-center/kb/atoms/ai/Agent可用性需要能力契约状态反馈和错误恢复.md

## 一句话判断

一个能力能被 Agent 稳定使用，取决于它是否有清晰契约、状态反馈、错误提示、重试路径和结果结构，而不只是能被调用。

## 类型

- 方法

## 来源

- source：
  - [AI 应用人类界面与 Agent 界面外部线索](../../sources/ai/2026-07-10-AI应用人类界面与Agent界面-外部线索.md)
  - [Teddy Riker《为 Agent 设计产品》](../../sources/ai/2026-05-11-Teddy-Riker-为-Agent-设计产品-宝玉译.md)
- 原文定位：
  - Teddy Riker：产品不应只暴露 API 或 MCP，还要教会 Agent 如何成功完成任务，并建立反馈循环。
  - 宝玉《飞书 CLI 开源了...》：AI 友好 CLI 需要清楚 help 文本、结构化输出、可指导下一步的错误信息。
  - Phodal《Agentic 时代的前端革命》：传统 UI 与 AI 之间缺乏正式契约会导致高不确定性和执行失败率。
- 是否来自 AI 讨论：是

## 适用场景

- 设计 Skill contract、CLI、API、MCP server 或工具调用返回结构。
- 评估某个功能是否真正适合给 Agent 调用。

## 不适用场景

- 一次性人工脚本，不需要被 Agent 长期复用时。
- 早期探索阶段，只验证需求是否存在时。

## 可信状态

- 已人工确认

## 说明

Agent 可用性不是“给一个接口”就完成了。接口还要让 Agent 知道何时使用、怎么传参、错了怎么修、结果能不能交给下游继续用。

