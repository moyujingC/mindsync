---
schema: agentcompanies/v1
kind: knowledge-base
type: external-kb-registry
status: current
version: 0.1.0
owner: Research & Knowledge Lead
last_updated: 2026-08-30
source_of_truth: company/knowledge-base/external-kb/README.md
---

# 外挂知识库注册表

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-08-30
> source_of_truth：company/knowledge-base/external-kb/README.md

这份注册表用于记录 `知行工坊` 当前使用或计划接入的**外挂知识库**。

所谓外挂知识库，是指：

- 主数据不在 `mindsync` 仓库内部
- 通过 API、Skill、脚本或手动流程与 `MindSync` 产生读写关系
- 需要被 Agent 或工作流反复使用，值得作为长期机制沉淀

这里不替代具体项目的 runbook，也不重复 Skill 的完整实现细节；它只回答：

- 这个外挂知识库是什么
- 当前以什么形式接入 `MindSync`
- 入口在哪里、怎么用
- 已知限制和下一步

## 当前已注册的外挂知识库

| 名称 | 别名 | 接入形态 | 当前状态 | 入口 |
|------|------|----------|----------|------|
| Get笔记 | 得到大脑 | Claude Code Skill + 本地脚本 | 已接入，可读写 | [getnote.md](getnote.md) |

## 新增外挂知识库的流程

当发现一个新的外部知识源需要被 `MindSync` 反复使用时：

1. 在本目录下新建 `<slug>.md`
2. 按 [getnote.md](getnote.md) 的字段填写基础信息
3. 更新上表
4. 若涉及 Skill、MCP 或共享脚本，在 `shared/skills/`、`shared/tools/` 或对应项目目录落地实现
5. 在 [company/knowledge-base/README.md](../README.md) 中同步入口

## 与公司知识库的分工

- **公司知识库（`company/knowledge-base/`）**
  - 沉淀长期可复用的方法论、机制分析与判断
- **外挂知识库注册表（本目录）**
  - 记录外部知识源的接入状态、入口与约束
- **项目知识库（`projects/<slug>/kb/`）**
  - 承接从外挂知识库同步进来的具体内容

同步方向默认由具体外挂知识库的接入方案决定，不在本注册表层统一规定。

## 相关文档

- [公司知识库总览](../README.md)
- [Get笔记（得到大脑）接入方案](getnote.md)
- [AI-Skill 系统性讨论](../system/AI-Skill-系统性讨论.md)
- [AI-MCP 系统性讨论](../system/AI-MCP-系统性讨论.md)
