# Aimandala CI/CD、测试与自动修复方案

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-05-17
> source_of_truth：projects/aimandala/docs/architecture/CI-CD与自动修复架构.md
> 项目：aimandala
> 阶段：architecture
> depends_on：projects/aimandala/PROJECT.md
> depends_on：projects/aimandala/docs/runbooks/README.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 背景

Aimandala 当前的 CI/CD 不是单一流水线，而是两层结构：

1. `mvp-ci`
   - 日常最小可信质量门
2. 增强链路
   - `aimandala-ci`
   - `deploy`
   - `nightly-smoke`
   - `auto-repair`

这份文档的重点，是把这两层关系说清楚，避免把“增强链路”误写成“日常唯一主链”。

## 2. 当前仓库里的真实入口

当前已存在的 workflow 文件：

1. `.github/workflows/mvp-ci.yml`
2. `.github/workflows/mvp-deploy.yml`
3. `.github/workflows/aimandala-ci.yml`
4. `.github/workflows/aimandala-deploy.yml`
5. `.github/workflows/aimandala-nightly-smoke.yml`
6. `.github/workflows/aimandala-auto-repair.yml`

当前更准确的理解是：

- `mvp-ci` / `mvp-deploy` 负责 MVP 日常主链
- `aimandala-*` 负责增强自动化、故障建单、nightly smoke（夜间冒烟检查）和自动修复实验

## 3. 当前架构目标

当前 CI/CD 架构要解决四类问题：

1. 日常开发至少有一条稳定、可解释的最小质量门
2. 增强检查和部署链不要和最小质量门混成一团
3. runner（自托管执行机）、Paperclip issue 路由和 heartbeat 要有正式边界
4. 自动修复必须有明确的允许范围，不能越权碰生产

## 4. 分层口径

### 4.1 第一层：MVP 最小主链

入口：

- `.github/workflows/mvp-ci.yml`
- `.github/workflows/mvp-deploy.yml`

职责：

- 提供当前日常最小可信红绿灯
- 支撑 MVP 主线的基本构建、测试和部署判断

使用原则：

- 判断“今天这条主链能不能继续开发/合并”，优先看 `mvp-ci`
- 不应要求日常每次都先看增强链路才算可用

### 4.2 第二层：增强链路

入口：

- `.github/workflows/aimandala-ci.yml`
- `.github/workflows/aimandala-deploy.yml`
- `.github/workflows/aimandala-nightly-smoke.yml`
- `.github/workflows/aimandala-auto-repair.yml`

职责：

- 更细的前后端 / 知识质量门
- deploy 与 smoke 的故障路由
- Paperclip issue 建单
- 白名单范围内的自动修复

使用原则：

- 它们是增强治理，不是所有日常开发的唯一阻断门

## 5. 当前增强链路的模块边界

### 5.1 `aimandala-ci`

负责：

- 更细粒度的前端、后端、知识质量检查
- 为自动修复和 Paperclip 路由提供失败上下文

### 5.2 `aimandala-deploy`

负责：

- 增强部署链
- 最小 smoke 衔接

### 5.3 `aimandala-nightly-smoke`

负责：

- 定时健康检查
- 手动或定时深度回归入口

推荐分成两层理解：

1. `basic`
   - 健康检查
   - 首页可访问
2. `deep`
   - 上传
   - create
   - lite report
   - history
   - 可选 upgrade / pro

### 5.4 `aimandala-auto-repair`

负责：

- 只在白名单失败里尝试自动修复
- 不直接写生产，不直接自动合并

## 6. Paperclip 故障路由边界

当前增强链路失败后，可通过 Paperclip 进行故障收口。

失败来源可按下面几类理解：

1. `ci-test-failure`
2. `build-failure`
3. `deploy-or-smoke-failure`
4. `infra-runner-failure`

默认标签口径：

- CI / build 失败：
  - `type:execution`
- deploy / smoke 失败：
  - `type:artifact`
  - `review:deliverable`

当前关键治理规则：

1. 同一 workflow run 下，允许父任务 + job 子任务层级
2. 同一 job 在不同提交下不能复用旧任务
3. runner 长时间 `queued` 不应误判成代码问题
4. 长时间运行但无状态回写的任务，应交给 execution health（执行健康巡检）处理

## 7. 自动修复边界

自动修复只应在下面条件同时满足时触发：

1. 来自增强 `ci`
2. 命中白名单 job + step
3. 有可复放的 repro command（复现场景命令）
4. 有明确 allowlist 文件范围
5. 修复发生在隔离分支

典型白名单包括：

- `frontend-ci / Run Vitest`
- `frontend-ci / Run Typecheck`
- `frontend-ci / Run Mobile Web Build`
- `backend-ci / Run Pytest`
- `knowledge-ci / Run Knowledge Validation`
- `knowledge-ci / Run Knowledge Evals`

默认禁止：

- 直接改 `main`
- 直接改 `release`
- 自动合并
- 自动发布
- 自动 SSH 到线上改现场

## 8. 与 runbook / control layer 的关系

这份文档讲的是“系统边界”。

实际操作和当前控制层入口，要同时看：

- [../runbooks/README.md](../runbooks/README.md)
- [../runbooks/aimandala-pr-质量门-runbook.md](../runbooks/aimandala-pr-质量门-runbook.md)

当前已知控制层入口包括：

1. `shared/tools/ci/paperclip-ci-issue.mjs`
2. `shared/tools/ci/check-paperclip-execution-health.mjs`
3. `shared/tools/ci/check-runner-heartbeat.mjs`
4. `shared/tools/ci/server-automation-guard.mjs`
5. `shared/tools/ci/server-automation-finalizer.mjs`
6. `shared/tools/ci/server-automation-run.sh`

## 9. 当前已知残留

截至 `2026-05-17`，这套架构仍有这些残留：

1. GitHub secrets、runner token 和部分在线环境变量依赖实际部署侧配置
2. Paperclip 建单是否完全闭环，仍取决于 runner 到 Paperclip API 的联通性
3. runner 宕机与卡住任务治理，仍依赖 heartbeat 和 execution health 脚本
4. 文档口径已明确，但“当前默认看 `mvp-ci`，增强链路另算”仍需要持续执行纪律

## 10. 当前最重要的判断规则

如果你只想快速判断一件事：

1. 日常开发是否过最小门
   - 看 `mvp-ci`
2. 增强回归、nightly、Paperclip 建单或 auto-repair 是否成立
   - 看 `aimandala-*` 这一组增强链路
3. runner / heartbeat / 故障收口怎么操作
   - 回 `runbooks/README.md`
