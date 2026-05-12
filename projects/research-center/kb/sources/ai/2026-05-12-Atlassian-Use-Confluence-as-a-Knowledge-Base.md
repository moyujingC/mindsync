# Atlassian《Use Confluence as a Knowledge Base》

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-12
> source_of_truth：projects/research-center/kb/sources/ai/2026-05-12-Atlassian-Use-Confluence-as-a-Knowledge-Base.md

## 元数据

- 主题：AI
- 来源类型：文章
- 作者：Atlassian
- 发布时间：未注明
- 获取时间：2026-05-12
- 原始链接或文件路径：
  - 官方文档：[https://confluence.atlassian.com/conf715/use-confluence-as-a-knowledge-base-1096098176.html](https://confluence.atlassian.com/conf715/use-confluence-as-a-knowledge-base-1096098176.html)
- 可信度：高
- 处理状态：已消化

## 摘要

这篇 Atlassian 官方文档讲的是如何把 Confluence（团队文档系统）配置成知识库。它不是抽象讨论，而是很典型的“产品级搭建说明”：先创建知识库空间，再设置权限、模板、主页入口、标签、通知方式，以及和 Jira（项目与工单系统）的联动。

对“如何搭知识库”这个主题来说，这篇来源最有价值的地方是它明确表达了一个偏工程化的做法：知识库不只是文档堆放区，而是一个由模板、标签、权限、搜索入口和系统联动共同组成的可维护系统。

## 关键摘录

- 文档建议直接创建专门的 knowledge base space（知识库空间），而不是把知识库混进普通页面树里。
- 知识库空间默认带有 article templates（文章模板）和预配置首页，首页包含 Livesearch（实时搜索）与按标签聚合的导航模块。
- 官方明确强调 labels（标签）是知识库空间里的关键组织机制，用户更常靠搜索和主题导航找内容，而不是沿页面树逐层点击。
- 文档建议团队定制 how-to（操作指南）和 troubleshooting（排障）模板，给作者更多结构约束，让文章写得更快也更一致。
- 在联动层，官方建议把 Confluence 和 Jira Service Management（服务管理）连接起来，让用户直接在客户门户搜索知识库。

## 初步判断

这篇文章适合用来支撑“知识库是一套信息架构和工作流，不只是文章列表”这个方向的判断。

如果后面要给 `research-center` 或 `company/knowledge-base` 设计知识库机制，这篇来源尤其适合支持以下几个设计点：

1. 先定义空间和入口，再写内容。
2. 让模板和标签成为结构骨架。
3. 让搜索和联动成为默认访问路径，而不是假设用户会按树状目录浏览。

它的局限也比较清楚：这篇是 Confluence 产品视角，很多建议天然贴近 Atlassian 的页面模型和插件生态。抽象方法可以复用，具体实现细节不能直接照搬到所有系统里。

## 可提取 atoms

- 搭建知识库时，应先定义专门的知识空间、权限和首页入口，而不是直接开始堆文章。
- 在知识库里，标签和搜索往往比树状目录更接近真实用户的查找路径。
- 知识库模板不是写作辅助小工具，而是内容结构一致性的底层约束。
- 知识库如果要进入服务流程，应该和工单或支持系统直接联动，而不是长期孤立存在。
