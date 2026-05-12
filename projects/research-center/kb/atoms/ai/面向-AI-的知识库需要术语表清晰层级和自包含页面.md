# 面向 AI 的知识库需要术语表、清晰层级和自包含页面

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-12
> source_of_truth：projects/research-center/kb/atoms/ai/面向-AI-的知识库需要术语表清晰层级和自包含页面.md

## 一句话判断

面向 AI（人工智能）读取的知识库，应维护统一术语表、严格标题层级、内部链接、元数据和自包含页面。

## 类型

- 方法

## 来源

- source：
  - [GitBook《How to optimize your documentation for AI (without breaking it for humans)》](../../sources/ai/2026-05-12-GitBook-How-to-Optimize-Your-Documentation-for-AI.md)
- 原文定位：
  - GitBook 建议建立 canonical glossary（规范术语表），减少术语模糊和不一致
  - GitBook 强调使用清晰的 H1 -> H2 -> H3 标题层级、简洁段落和可解析列表
  - GitBook 建议页面尽量 self contained（自包含），因为模型常常只拿到局部片段
  - GitBook 认为内部链接、更新记录和 metadata（元数据）对模型理解文档同样重要
- 是否来自 AI 讨论：否

## 适用场景

这条判断适合用于：

- 设计 RAG（检索增强生成）知识库
- 编写希望被 LLM（大语言模型）准确引用的公开文档
- 给已有 wiki 做 AI 可读性改造

## 不适用场景

这条判断不适合用于：

- 完全私人、只靠自己阅读语境理解的笔记
- 只存原始材料、不做知识加工的 sources 层
- 不要求被机器检索或引用的短期草稿

## 可信状态

- 已人工确认

## 说明

很多 AI 友好的写法，本质上也是高质量文档写法：术语一致、层级清楚、页面能独立理解、概念之间有链接。

区别在于，模型经常只能看到切片后的局部上下文，所以“页面自包含”和“术语明确”会比纯人工阅读场景更重要。
