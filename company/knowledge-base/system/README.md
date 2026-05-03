# 系统机制知识库

> 状态：current
> 版本：0.1.1
> owner：Engineer
> last_updated：2026-05-03
> source_of_truth：company/knowledge-base/system/README.md

这份索引用于收口 `墨予镜` 当前对核心系统的设计机制分析与使用说明。

它服务的问题主要是：

- `Paperclip` 在 `墨予镜` 里到底扮演什么角色
- `MindSync` 这套 Monorepo 是怎么分层、怎么协作的
- 当前已经落地的 `CI/CD` 链路到底包含哪些组件、如何流转、应该先看哪里

## 1. 当前文档

- [Paperclip-设计机制与使用说明.md](company/knowledge-base/system/Paperclip-设计机制与使用说明.md)
- [Paperclip-workspace-充分使用度检查表.md](company/knowledge-base/system/Paperclip-workspace-充分使用度检查表.md)
- [Paperclip-周检机制与版本跟踪说明.md](company/knowledge-base/system/Paperclip-周检机制与版本跟踪说明.md)
- [paperclip-weekly-reviews/README.md](company/knowledge-base/system/paperclip-weekly-reviews/README.md)
- [MindSync-设计机制分析.md](company/knowledge-base/system/MindSync-设计机制分析.md)
- [当前CI-CD系统机制总览.md](company/knowledge-base/system/当前CI-CD系统机制总览.md)
- [AI-Skill-系统性讨论.md](company/knowledge-base/system/AI-Skill-系统性讨论.md)

## 2. 适用边界

这里写的是：

- 机制层解释
- 结构层判断
- 默认使用路径
- 总入口与导航关系

这里不替代：

- 项目级 runbook
- 单次事故复盘
- 单个任务的实施计划

如果你要理解当前 checkout / worktree 是否真正形成长期治理闭环，除了项目级 runbook 外，还应配合看：

- [projects/aimandala/docs/specs/2026-05-03-observe-only-checkout-治理规格.md](projects/aimandala/docs/specs/2026-05-03-observe-only-checkout-治理规格.md)
- [projects/aimandala/docs/runbooks/2026-05-03-observe-only-checkout-治理-runbook.md](projects/aimandala/docs/runbooks/2026-05-03-observe-only-checkout-治理-runbook.md)

## 3. 推荐阅读顺序

1. 先看 [MindSync-设计机制分析.md](company/knowledge-base/system/MindSync-设计机制分析.md)
2. 再看 [Paperclip-设计机制与使用说明.md](company/knowledge-base/system/Paperclip-设计机制与使用说明.md)
3. 如果要判断自己有没有把 `workspace / git worktree` 真正用透，再看 [Paperclip-workspace-充分使用度检查表.md](company/knowledge-base/system/Paperclip-workspace-充分使用度检查表.md)
4. 如果要理解 `Paperclip` 上游快速迭代对本地系统的影响判断机制，再看 [Paperclip-周检机制与版本跟踪说明.md](company/knowledge-base/system/Paperclip-周检机制与版本跟踪说明.md)
5. 如果要理解现状中的自动化与故障路由，再看 [当前CI-CD系统机制总览.md](company/knowledge-base/system/当前CI-CD系统机制总览.md)
6. 如果要理解如何为 AI 团队设计 `skill` 能力包，再看 [AI-Skill-系统性讨论.md](company/knowledge-base/system/AI-Skill-系统性讨论.md)
