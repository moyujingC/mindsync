# GitBook《How to optimize your documentation for AI (without breaking it for humans)》

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-12
> source_of_truth：projects/research-center/kb/sources/ai/2026-05-12-GitBook-How-to-Optimize-Your-Documentation-for-AI.md

## 元数据

- 主题：AI
- 来源类型：文章
- 作者：Steve Ashby
- 发布时间：2026-03-06
- 获取时间：2026-05-12
- 原始链接或文件路径：
  - 官方博客：[https://www.gitbook.com/blog/ai-docs-optimization-tips](https://www.gitbook.com/blog/ai-docs-optimization-tips)
- 可信度：高
- 处理状态：已消化

## 摘要

这篇 GitBook 官方博客文章讨论的是 AI 时代文档和知识库应该如何写，才能既让人类读起来顺畅，也让 LLM（大语言模型）更稳定地理解和引用。它把这件事叫做 GEO（Generative Engine Optimization，生成式引擎优化）。

文章很有价值，因为它不是抽象地说“让文档对 AI 友好”，而是列出了一组具体可执行的写法：定义术语、保持标题层级严格、让页面自包含、用内部链接连接概念、维护更新记录、补齐元数据。

## 关键摘录

- GitBook 认为 AI 正在成为文档的重要读者，2025 年 GitBook 托管文档里的 AI 驱动访问量增长了 500%，占全部读者的 41%。
- 文中把 GEO 定义为让 AI 系统能准确发现、解释和引用产品知识的文档实践。
- 文章强调建立 canonical glossary（规范术语表），因为术语模糊或不一致会明显降低模型理解稳定性。
- 所有页面应使用清晰的 H1 -> H2 -> H3 层级、简洁段落和可解析的列表结构。
- 每一页都应尽量 self contained（自包含），因为模型常常只拿到局部片段，而不是整个站点。
- 内部链接、changelog（更新记录）和 metadata（元数据）不仅对搜索引擎有价值，对模型理解同样重要。
- GitBook 还提到 `llms.txt`、`llms-full.txt` 和 MCP（模型上下文协议）是帮助模型读取文档语料的基础设施能力。

## 初步判断

这篇来源非常适合支撑“知识库的目标读者已经不只有人，还包括 AI agent”这个方向。

对未来要做 RAG（检索增强生成）知识库、公开文档站、面向 AI 的产品文档，或者希望被外部模型准确引用的团队，这篇文章几乎可以直接转成知识库写作规则。

它也带来一个很重要的工程判断：很多所谓“AI 优化”并不是新魔法，本质上是把原本就该做好的文档 discipline（写作纪律）做得更严格。

## 可提取 atoms

- AI 时代的知识库需要同时服务人类读者和模型读者。
- 术语表、严格标题层级和自包含页面，会显著提升知识库对 LLM 的可读性。
- 内部链接、更新记录和元数据，是知识库被 AI 稳定引用的重要辅助信号。
- 面向 AI 的知识库优化，本质上大多仍是高质量文档写作纪律的强化版。
