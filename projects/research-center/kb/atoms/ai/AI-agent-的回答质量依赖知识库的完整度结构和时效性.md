# AI agent 的回答质量依赖知识库的完整度、结构和时效性

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-12
> source_of_truth：projects/research-center/kb/atoms/ai/AI-agent-的回答质量依赖知识库的完整度结构和时效性.md

## 一句话判断

当 AI agent（智能代理）从知识库中回答问题时，回答质量会直接受知识库的内容覆盖、结构清晰度和更新状态影响。

## 类型

- 事实
- 方法

## 来源

- source：
  - [Intercom《Get ready for AI bots by optimizing your knowledge base》](../../sources/ai/2026-05-12-Intercom-Get-Ready-for-AI-Bots-by-Optimizing-Your-Knowledge-Base.md)
  - [GitBook《How to optimize your documentation for AI (without breaking it for humans)》](../../sources/ai/2026-05-12-GitBook-How-to-Optimize-Your-Documentation-for-AI.md)
- 原文定位：
  - Intercom 指出 AI agent 会直接消费知识库和公共 URL 内容来回答用户问题
  - Intercom 建议上线 AI 前先做内容审计，补足缺失信息并更新陈旧内容
  - GitBook 认为 AI 正在成为文档的重要读者，文档需要能被模型准确发现、解释和引用
- 是否来自 AI 讨论：否

## 适用场景

这条判断适合用于：

- 设计 AI 客服、AI 助手或内部问答系统
- 评估 RAG（检索增强生成）效果不好时的上游原因
- 规划知识库内容审计和补全工作

## 不适用场景

这条判断不适合用于：

- 完全不依赖外部知识源的生成任务
- 只做创意发散、不要求事实准确的 AI 使用场景
- 已经明确由数据库或实时 API 提供事实的场景

## 可信状态

- 已人工确认

## 说明

AI agent 看起来是在“智能回答”，但如果它依赖知识库作为事实来源，知识库的质量就会变成回答质量的上游约束。

这意味着 AI 项目不能只调模型和 prompt（提示词）。如果知识库缺内容、结构混乱或信息过期，模型会更容易答错、答偏或答不全。
