# Boris Cherny《Claude Code 之后，写代码正在变成“管理 Agent”》（宝玉整理）

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-12
> source_of_truth：projects/research-center/kb/sources/ai/2026-05-12-Boris-Cherny-Claude-Code-之后-写代码正在变成管理-Agent-宝玉.md

## 元数据

- 主题：AI
- 来源类型：文章
- 作者：宝玉（整理），原始访谈对象为 Boris Cherny
- 发布时间：2026-05-05
- 获取时间：2026-05-12
- 原始链接或文件路径：
  - 中文整理：[https://baoyu.io/blog/anthropics-boris-cherny-why-coding-is-solved-and-what-comes-next](https://baoyu.io/blog/anthropics-boris-cherny-why-coding-is-solved-and-what-comes-next)
  - 原始视频：[https://www.youtube.com/watch?v=SlGRN8jh2RI](https://www.youtube.com/watch?v=SlGRN8jh2RI)
- 可信度：中
- 处理状态：已提取 atoms

## 摘要

这篇文章整理了 Anthropic 内部 Claude Code 创建者 Boris Cherny 的一次访谈。文章讨论的核心不是“模型还能把代码写得多好”，而是当写代码这件事越来越被模型接管后，工程师、产品团队和公司组织到底还剩下什么核心工作。

文中的几个重点判断是：

1. 对 Boris 这类高频使用者来说，“写代码本身”正在被解决，人的工作开始转向调度 [[Agent]] [Agent](../../wiki/ai/Agent.md)（智能体）、做决策、定方向、控质量。
2. Anthropic 的领先不只是模型领先，更来自组织已经把模型接入到大部分工程流程，甚至让员工的 Claude 之间通过 Slack 沟通。
3. 长期看，用户不该自己学习什么时候并行、什么时候开 Loop、什么时候用本地模型或云模型；这些调度细节应该逐步被产品和模型层自动吸收。
4. 对知识工作场景，[[MCP]] [MCP](../../wiki/ai/MCP.md)（模型上下文协议）和 [[Computer Use]] [Computer Use](../../wiki/ai/Computer Use.md) 代表的是两类关键接入路径：前者适合标准化系统集成，后者适合作为兜底执行层。

## 关键摘录

- 标题本身已经给出总判断：Claude Code 之后，写代码正在变成“管理 Agent”。
- 文章中段提到，Anthropic 内部“没有任何手写代码了。所有 SQL 都是模型写的”，并补充说明其真正护城河在于组织流程改造，而不是单纯模型能力。
- 在“并行 Agent 与本地模型”一节，Boris 的判断是：如果用户还需要自己学习如何调度 batch（批处理）、Loop（循环任务）、多个 Agent，那说明产品设计还没做好。
- 在“云端 AI vs 本地 AI”一节，Boris 进一步认为，未来模型会自己决定是否调用本地模型，用户不该再关心部署位置这种底层细节。
- 在“MCP 与 Computer Use”一节，文章总结 Boris 的立场是：对知识工作软件，优先用 MCP 接入；没有 MCP 的地方，再用 Computer Use 兜底。
- 文末的作者分析认为，真正值得跟踪的不是一句“coding is solved”（编程已被解决）本身，而是这种判断能否跨出 TypeScript（类型化 JavaScript）+ React（前端框架）等模型偏好栈，进入更重、更旧、更高合规的工程环境。

## 术语表

- [[Agent]] [Agent](../../wiki/ai/Agent.md)（智能体）：
  文中指能够读上下文、调用工具、并行执行和跨系统协作的软件代理。
- Claude Code：
  Anthropic 的代码 Agent 产品，可以在本地代码库、终端、Git（版本控制）等环境里执行多步开发任务。
- Loop：
  文中提到的一类持续运行或周期性执行的 Agent 机制，可以理解为“让 Agent 在后台持续观察、重复执行、定时汇报”的运行形态。
- batch（批处理）：
  把多项任务打包交给系统一次性或并行处理的运行方式。
- [[MCP]] [MCP](../../wiki/ai/MCP.md)（模型上下文协议，Model Context Protocol）：
  让模型或 Agent 以统一接口连接外部工具和数据源的协议层。
- [[Computer Use]] [Computer Use](../../wiki/ai/Computer Use.md)：
  让模型像人一样操作电脑界面的软件能力，适合作为“没有正式接口时”的兜底操作方式。
- Slack：
  企业协作工具。文中用它表示“Agent 到 Agent 的跨人、跨团队问答和沟通载体”。

## 初步判断

这份来源对 `research-center` 的价值主要在三个方向。

第一，它把“AI 写代码变强”往前推进了一步，开始讨论“写代码之后，人的工作重心会往哪里迁移”。这比单纯比较模型分数更适合沉淀成方法论。

第二，它提供了一个很重要的组织判断：模型能力扩散可能很快，但真正慢的是公司流程、权限设计、协作方式和内部默认习惯的改造。这对我们理解“为什么很多团队接了模型却没得到同等收益”很有价值。

第三，它把几个常见争论重新降级成了产品细节，例如“该不该手动并行”“本地还是云端”“MCP 还是 Computer Use”。文中的口径是：如果这些复杂度长期还压在用户头上，说明产品抽象层还不够高。

## 可提取 atoms

- 编程被“解决”后，工程师的核心工作会从手写代码转向管理 Agent、做决策和控质量。
- AI 时代工程组织的领先差距，会越来越多来自流程改造，而不是单纯模型能力。
- 并行调度、本地或云端模型选择，长期都应被产品层和模型层自动吸收，而不是持续要求用户手动学习。
- MCP 更适合标准化连接已有系统，Computer Use 更像没有接口时的兜底执行层。
- “coding is solved” 目前更像在模型偏好栈中成立，是否能扩展到高合规、老系统和底层场景，仍需继续观察。
