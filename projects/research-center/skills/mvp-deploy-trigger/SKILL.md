---
name: mvp-deploy-trigger
description: 触发 Aimandala 当前 MVP 阶段的手动部署；若最新一次对应分支的 MVP CI 已全绿，则直接触发不重复跑 CI 的 direct deploy。
owner: Engineer / CEO / Orchestrator
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - ceo
  - engineer
  - test_qa
when_to_use: >
  当用户要求触发 Aimandala 的 MVP deploy，且希望在最新一次 MVP CI 已经成功时直接部署、
  避免重复再跑整套 CI 时使用。
inputs:
  - 目标环境：dev 或 prod
  - 当前目标分支
  - 最新 mvp-ci 状态
outputs:
  - deploy 触发判断
  - 采用的 workflow
  - 触发后的 run 入口
handoff_to:
  - engineer
  - test_qa
---

# MVP Deploy Trigger

## 目标

让代理在触发 `Aimandala` 的 MVP 部署前，先判断最新的 `MVP CI（最小持续集成）` 是否已经是绿色。

如果已经绿色：

- 不重复再跑一整轮 `mvp-ci`
- 直接触发 `mvp-deploy-direct`

如果还没有绿色：

- 不直接 deploy
- 回到 `cicd-check`
- 先修当前 CI 阻塞

## 适用场景

- 用户说“触发 dev 部署”
- 用户说“如果最新 MVP CI 已绿，就直接 deploy”
- 用户说“不要再重复跑一次 CI，直接用最新绿灯部署”

## 不适用场景

- 用户要检查 CI 健康，而不是部署
- 用户要走增强设计链路的 self-hosted deploy
- 用户要自动决定业务放行，而不是单纯执行 MVP deploy

## 必读上下文

1. `.github/workflows/mvp-ci.yml`
2. `.github/workflows/mvp-deploy-direct.yml`
3. `company/GitHub-分支与-CI-CD-使用流程.md`
4. `company/knowledge-base/system/当前CI-CD系统机制总览.md`
5. `projects/research-center/skills/cicd-check/SKILL.md`

## 执行步骤

1. 先判断目标环境。
   - `dev` 对应 `main`
   - `prod` 对应 `release`
2. 先查该分支最新一次 `push` 触发的 `mvp-ci` 是否成功。
3. 如果最新 `mvp-ci` 已成功：
   - 触发 `mvp-deploy-direct`
   - 说明本次复用了最新绿色 CI 结果
4. 如果没有成功的最新 CI：
   - 不直接 deploy
   - 说明当前阻塞点
   - 回到 `cicd-check`
5. 部署触发后继续观察：
   - `verify-latest-mvp-ci`
   - `mvp-deploy`
   - smoke 检查结果

## 当前协作口径

当前 MVP 阶段默认存在两种手动部署方式：

- `mvp-ci`
  - 会在手动触发时重新跑 `mvp-ci`
- `mvp-deploy-direct`
  - 先校验最新绿色 `mvp-ci`
  - 校验通过后直接 deploy，不重复跑 CI

如果用户明确想“快一点，且复用最新绿灯”，优先用：

- `mvp-deploy-direct`

## 输出格式

最小输出建议包括：

- 目标环境：
- 目标分支：
- 最新 MVP CI 状态：
- 是否可 direct deploy：
- 触发的 workflow：
- run 入口：
- 下一步观察点：

## 质量检查项

- 是否先检查了最新绿色 `mvp-ci`
- 是否把 `dev` / `prod` 分支限制说清楚
- 是否把“直接 deploy”误解成“完全不验证”
- 是否在没有绿色 CI 时误触发 direct deploy

## Handoff 规则

- 若 direct deploy 成功：
  - 交给 `test_qa` 做结果确认
- 若 CI 未绿：
  - 交还 `cicd-check`
- 若 deploy 或 smoke 失败：
  - 交给 `engineer`
