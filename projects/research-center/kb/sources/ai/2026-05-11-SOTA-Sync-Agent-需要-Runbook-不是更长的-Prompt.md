# SOTA Sync《Agent 需要 Runbook，不是更长的 Prompt》

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-11
> source_of_truth：projects/research-center/kb/sources/ai/2026-05-11-SOTA-Sync-Agent-需要-Runbook-不是更长的-Prompt.md

## 元数据

- 主题：AI
- 来源类型：文章
- 作者：SOTA Sync（整理），Rohit Ghumare（核心观点来源）
- 发布时间：2026-05-09
- 获取时间：2026-05-11
- 原始链接或文件路径：
  - 中文文章：[https://sotasync.com/reader/2026-05-09-agents-need-runbooks/](https://sotasync.com/reader/2026-05-09-agents-need-runbooks/)
  - 原始帖子：[https://x.com/ghumare64/status/2052825541057626258](https://x.com/ghumare64/status/2052825541057626258)
- 可信度：中
- 处理状态：未处理

## 摘要

这篇文章讨论的是：生产级 Agent（智能体）的可靠性不能主要依赖更长、更强硬的 prompt（提示词），而应该依赖 runbook（运行手册）、权限、检查、审批、日志、回滚等控制层机制。

文章把真实工程工作描述为一个 operating loop（运营循环）：读任务、检查代码、理解约定、修改、测试、debug、更新计划、检查 diff、请求审批、创建 PR、监控 CI、回应 review，必要时回滚。这样的流程不是单轮聊天，也不是一句“请务必小心”能保证的行为，而应该被编码进系统。

核心判断是：prompt 可以描述“应该发生什么”，但 runbook 和平台基础设施决定“能发生什么”。如果验证只靠同一个模型自述完成，而没有真实命令、测试、截图、响应检查、文件检查、diff 检查和来源检查，系统并没有真正完成工作，只是生成了完成的描述。

文章最后把 Agent 从“员工”这个比喻拉回到“生产 worker（工作单元）”：它应该有 job（任务）、queue（队列）、permissions（权限）、inputs（输入）、outputs（输出）、logs（日志）、retries（重试）、failure states（失败状态）和 escalation paths（升级路径）。可靠性来自受控运行时，而不是无限加长 system prompt。

## 关键摘录

- 文章认为，依赖 `IMPORTANT`、`DO NOT SKIP`、`MAKE SURE YOU VERIFY` 这类短语来约束 Agent，说明系统还停留在和模型“谈判”，而不是在构建可靠运行系统。
- 真正的软件工程任务是一套运营循环，不是单个 prompt。
- DevOps（开发运维）已经证明：重要流程应该被编码进系统，而不是留在人的记忆和临场操作里。
- Prompt 更像建议；runbook、权限、检查和审批才是基础设施。
- 验证应该外部化、程序化，不能只让同一个模型既做事又判断自己做完了没有。
- 未来的 Agent 栈更像 DevOps：task queues、worker boundaries、tool registries、memory scopes、approval gates、logs、traces、policy files、evals、CI checks、rollback hooks。
- `CLAUDE.md`、skills（技能）和 memory（记忆）属于知识层，它们有用但不能替代控制层。
- 真正的 Agent 系统至少需要两层：知识层和控制层。
- Agent 不是平台的替代品，而是平台的客户，需要 identity（身份）、access control（访问控制）、audit logs（审计日志）、environment boundaries（环境边界）、policy（策略）、reproducibility（可复现性）和 recovery（恢复机制）。

## 初步判断

这份来源对 `research-center` 和 `mindsync` 都有直接价值，因为它把 Agent 可靠性从“写更好的说明文档”推进到“建立可执行控制层”。

它适合接到几个方向：

- Agent 工程化与生产化可靠性
- `AGENTS.md`、`CLAUDE.md`、skills、memory 与控制层的边界
- runbook、审批门、测试、CI、回滚、日志在 Agent 系统中的位置
- Paperclip / MindSync 这类 Agent 运行时应如何区分知识层和控制层
- 为什么“让 Agent 小心一点”不是可靠性设计

按当前 `kb` 的治理约定，这篇来源暂时应先停留在 `sources/ai`。后续可以拆出 atoms，再更新到：

- [[Agent]] [Agent（智能体）](../../wiki/ai/Agent.md)
- [[observability]] [observability（可观测性）](../../wiki/ai/observability.md)

它也可能支持新增一个 wiki 页，例如 `runbook（运行手册）` 或 `Agent control layer（Agent 控制层）`。

## 可提取 atoms

- 生产级 Agent 可靠性不能主要依赖更长的 prompt，而应依赖 runbook 和控制层。
- Prompt 描述“应该发生什么”，runbook 和基础设施约束“能发生什么”。
- Agent 的验证应该外部化和程序化，不能只依赖模型自我确认。
- 真实工程 Agent 工作是一套 operating loop，而不是单轮聊天。
- `AGENTS.md`、`CLAUDE.md`、skills、memory 属于知识层，不能替代 state machine、tool policy、checks、approvals、rollback 等控制层。
- 更合理的 Agent 抽象不是“员工”，而是受控运行时里的 production worker。
- Agent 平台工程需要 identity、access control、audit logs、environment boundaries、policy、reproducibility 和 recovery 等平台原语。
