# Agent 约束更适合按知识、prompt、runbook、控制四层理解

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-11
> source_of_truth：projects/research-center/kb/atoms/ai/2026-05-11-Agent-约束可分为-prompt-runbook-和-script-gate-三层.md

## 一句话判断

在 Agent（智能体）系统里，约束结构更适合按四层理解：knowledge layer（知识层）负责承载长期规则与上下文，prompt（提示词）负责表达当前意图，runbook（运行手册）负责定义流程，control layer（控制层）负责用 script/gate（脚本/质量门）、权限、审批、日志、回滚等机制把流程变成真正受控的执行环境。

## 类型

- 方法

## 来源

- source：
  - [SOTA Sync《Agent 需要 Runbook，不是更长的 Prompt》](../../sources/ai/2026-05-11-SOTA-Sync-Agent-需要-Runbook-不是更长的-Prompt.md)
- 原文定位：
  - 文章核心判断：生产级 Agent 可靠性不能主要依赖更长的 prompt，而应依赖 runbook、权限、检查、审批、日志、回滚等控制层机制
  - 本条 atom 还结合了当前对 `aimandala` 项目 runbook 结构的本地讨论判断
- 是否来自 AI 讨论：是

## 适用场景

这条判断适合用于：

- 设计 Agent 协作链路时，区分“知识、提示、流程、控制”分别该放在哪里
- 评估一个项目是不是过度依赖 prompt，而缺少可执行流程和控制层
- 讨论 `AGENTS.md`、skills（技能）、runbook、脚本、gate 的边界
- 复盘为什么有些 Agent 系统“看起来规则很多”，但仍然不稳定

## 不适用场景

这条判断不适合用于：

- 把四层理解成严格互斥、只能四选一的替代关系
- 把 runbook 直接等同于脚本或 gate
- 把 knowledge layer 直接等同于 prompt
- 把 control layer 简化成“只要有一个脚本就算控制层”
- 推导所有小任务都必须补完整 runbook 和 gate
- 脱离项目上下文，机械判断“只要用了 runbook 就一定成熟”

## 可信状态

- 已人工确认

## 说明

这四层更适合理解成逐层加硬，而不是并列替代：

- `knowledge layer`
  - 承载长期规则、角色说明、项目约束、skills、文档入口、上下文记忆
  - 解决的是“系统长期知道什么、默认参考什么”
- `prompt`
  - 偏提示层
  - 适合写原则、风格、注意事项
  - 解决的是“模型应该怎么想、怎么表述”
- `runbook`
  - 偏流程层
  - 适合写进入条件、判断树、操作步骤、禁止动作、升级路径
  - 解决的是“遇到某类情况应该怎么走流程”
- `control layer`
  - 包含 script/gate，也包含权限、审批、日志、回滚、工作区隔离、状态机、审计证据等运行机制
  - 解决的是“系统最终如何形成可控、可追踪、可恢复的执行环境”

因此更稳的结构通常不是“只补更长 prompt”，而是：

- knowledge layer 负责长期规则与上下文
- prompt 负责意图
- runbook 负责流程
- control layer 负责把 script/gate、权限和审计机制接成真实运行系统

严格说，script/gate 不必单独列成一层，因为它更适合被视为 control layer 里的典型实现手段。单独把它拆出去，容易和更上位的控制层重复。

因此这里最终采用四层，而不是五层：

- 五层会把 `script/gate` 和 `control layer` 同时列成平级，抽象层次不齐
- 四层更利于判断“哪些东西只是告诉 Agent 怎么做，哪些东西已经真的把执行管住了”
