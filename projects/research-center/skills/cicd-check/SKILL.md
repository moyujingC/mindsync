---
name: cicd-check
description: 协作当前 MVP 阶段的 GitHub CI/CD 主链路，查看最新运行状态；若最新 run 失败，则先分流失败类型，再收束为最小修 bug 计划。
owner: Engineer / CEO / Orchestrator
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - ceo
  - engineer
  - test_qa
when_to_use: >
  当用户要求查看某个仓库、分支或 workflow 的最新 GitHub CI/CD 状态，
  或要求判断“最近 CI/CD 是否挂了、是否需要开始修 bug”时使用。
inputs:
  - 仓库名、项目名或当前工作区上下文
  - 目标分支（若未指定，默认当前主分支）
  - 可选的 workflow 名称
  - GitHub Actions 最近运行结果、日志入口或失败摘要
outputs:
  - 最新状态判断
  - 失败类型判断
  - 最小修 bug 计划
  - 下一步 handoff 或执行建议
handoff_to:
  - engineer
  - test_qa
  - automation-platform owner
---

# CICD Check

## 目标

让代理先看“当前 MVP 阶段主链路里最新一次或最近几次真正相关的 GitHub CI/CD 状态”，而不是凭旧红点做判断。

如果最新 run 已经失败，则进一步回答：

- 这是代码问题，还是基础设施问题
- 需要直接修 bug，还是先转为基础设施排障
- 当前最小修复计划应该怎么写

## 适用场景

- 用户说“看看 GitHub 上最新 CI/CD 状态”
- 用户说“最近 workflow 有没有挂”
- 用户说“如果有 bug 就开始修”
- 用户要确认某条主分支是否仍被 CI 阻塞
- 用户要查看某个 workflow 最新一次 run 是否成功

## 不适用场景

- 只是解释 CI/CD 概念，不需要看最新运行状态
- 只讨论历史架构设计，不判断当前 run 健康
- 用户已经给出完整失败日志，并明确要求直接修代码

## 必读上下文

1. `company/knowledge-base/system/当前CI-CD系统机制总览.md`
2. `company/任务类型与标签规范.md`
3. `company/任务创建模板.md`
4. `company/CI-CD-根因任务标记口径.md`
5. `company/projects/Automation/PROJECT.md`
6. 对应项目 `PROJECT.md`

如果当前任务已经进入正式修复推进，还应补充使用：

- `harness-sdd-tdd-guard`
- 必要时 `artifact-readiness-check`

## 执行步骤

1. 先识别当前看的是哪一条 CI/CD 链路。
   - 对 `Aimandala`，日常先看 `MVP 可用链路`
   - 不要默认把增强设计链路当成唯一现行主路径
   - 只有当用户明确点名增强链路，或 MVP 主链路无法解释当前问题时，才继续看增强设计链路
2. 明确查询范围。
   - 仓库
   - 分支
   - workflow
   - 最近 1 次或最近 3 次 run
3. 只看最新窗口，不被更老的历史失败干扰。
   - 默认先看最新 1 次
   - 有必要时扩展到最近 3 次，判断是否为连续失败
4. 输出最新状态判断。
   - `success`
   - `failure`
   - `cancelled`
   - `in_progress`
   - `no_recent_run`
5. 如果失败，先做失败类型分流。
   - 代码 / 构建 / 测试失败
   - deploy / smoke 失败
   - runner / 权限 / 宿主机 / 凭证等基础设施异常
6. 如果是普通代码问题，进入“最小修 bug 计划”。
   - 写清失败 workflow / job / step
   - 写清可复现命令
   - 写清怀疑根因
   - 写清本轮修复范围
   - 写清验证方式
7. 如果是基础设施异常，不要误写成普通代码 bug。
   - 转成 `automation-execution`
   - 默认走 `server_automation`
   - 判断是否需要一个 `root_cause_task: true` 的根因主单
8. 如果最新 run 已经恢复绿色，不启动修 bug 计划。
   - 仅报告当前健康状态
   - 如有历史红点，明确说明它们只是历史材料，不是当前待修主问题

## 与 MVP 阶段的协作口径

当前默认协作对象是 `MVP 可用链路`。

通俗说，这个 skill 在 MVP 阶段主要做三件事：

- 看 `GitHub Actions（GitHub 持续集成页面）` 上最新 run 是绿还是红
- 判断当前 `mvp-release` 主链路是否被阻塞
- 一旦失败，就把它收束成可执行的最小修 bug 计划

当前默认不做：

- 把增强设计链路当成唯一事实来源
- 假设 Paperclip 已自动建单
- 假设 self-hosted runner 一定参与了执行

如果以后增强链路重新稳定，这个 skill 可以继续扩展，但 MVP 阶段的默认主判断仍应先看：

- `.github/workflows/mvp-release.yml`

## 最新状态判断口径

默认优先回答下面四个问题：

1. 最新一次 run 是哪次
2. 它的结论是什么
3. 当前主链是否被阻塞
4. 是否需要立即进入修复

不要只回答：

- “我看见有红色”
- “之前失败过”
- “这个 workflow 好像不稳定”

因为这些说法没有把“最新”与“当前是否阻塞”区分开。

## 失败后的最小修 bug 计划

如果最新 run 失败，最小计划至少写清：

- 问题范围：
  - 哪个 workflow / job / step 失败
- 当前判断：
  - 更像代码 bug 还是基础设施问题
- 修复假设：
  - 最可能的根因是什么
- 执行动作：
  - 先复现什么
  - 再修改什么
- 验证方式：
  - 本地命令
  - 重新触发哪条检查
- 风险与边界：
  - 本轮不处理什么

推荐直接复用：

- `templates/CI-故障修复计划-模板.md`

## 输出格式

最小输出建议包括：

- 当前 CI/CD 链路：
- 查询范围：
- 最新 run：
- 当前状态：
- 是否阻塞主链：
- 失败类型判断：
- 是否需要修 bug：
- 若需要，最小修复计划：
- 下一步交给谁：

## 质量检查项

- 是否真的看了“最新” run，而不是历史红点
- 是否区分了 MVP 链路和增强设计链路
- 是否优先围绕当前 MVP 主链路给出判断
- 是否把代码失败和基础设施失败混为一谈
- 是否在没有失败时误启动修 bug 计划
- 是否在连续失败时判断了是否需要根因主单
- 是否给出了可执行的最小修复计划，而不是空泛说“排查一下”

## Handoff 规则

- 若是代码 / 构建 / 测试问题：
  - 交给 `engineer`
- 若是 deploy / smoke 验证问题：
  - 交给 `engineer` 与 `test_qa`
- 若是 runner / 权限 / 宿主机 / 凭证问题：
  - 交给 `automation-platform owner`
- 若当前已经进入重要修复链路：
  - 继续转用 `harness-sdd-tdd-guard`，补齐最小 `task / qa basis / delivery`
