# Aimandala CI/CD、测试与自动修复方案

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/CI-CD与自动修复架构.md
> 项目：aimandala
> 阶段：architecture
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 背景

当前 `aimandala` 已具备 `main -> dev`、`release -> prod` 的发布主链，但此前仓库内只有一条单独的 deploy workflow。

这会带来 4 个问题：

1. PR 缺少统一的自动化质量门
2. 部署失败和 smoke 失败没有统一缺陷路由
3. 自托管 runner 角色未收口为正式 runbook
4. 自动修复没有受控边界，容易要么完全没有，要么越权碰生产

## 2. 本轮目标

本轮只解决第一阶段最小闭环：

1. 保留 GitHub 作为代码托管与 workflow 编排入口
2. 全部 workflow 迁到 self-hosted runner 标签：
   - `self-hosted`
   - `linux`
   - `mindsync-ci`
   - `aimandala`
3. 把 CI、deploy、nightly smoke、auto-repair 拆成 4 条职责清晰的流水线
4. 用 Paperclip 承接失败任务，而不是另起 Jira / Linear / 禅道
5. 自动修复只处理测试、类型检查、构建和确定性脚本失败

当前执行角色分工遵循公司级说明：

- [CI/CD 角色分工说明](/Users/xinran/Downloads/dev/mindsync/company/CI-CD-角色分工说明.md)

## 3. 当前范围

### 3.1 要做

- `.github/workflows/aimandala-ci.yml`
- `.github/workflows/aimandala-deploy.yml`
- `.github/workflows/aimandala-nightly-smoke.yml`
- `.github/workflows/aimandala-auto-repair.yml`
- `shared/tools/ci/` 下的共享脚本
- `projects/aimandala/deploy/github-runner/` 下的 runner runbook

### 3.2 不做

- 不迁出 GitHub 到 Woodpecker / Drone
- 不引入独立 bug tracker 平台
- 不自动修线上业务 bug
- 不自动修 production deploy 失败
- 不自动合并 auto-repair 产出的修复分支

## 4. 设计口径

### 4.1 Workflow 拆分

- `ci`
  - 负责前端、后端、知识脚本质量门
- `deploy`
  - 只负责 `main -> dev`、`release -> prod` 与最小 smoke
- `nightly-smoke`
  - 负责定时健康检查和可选深度回归
- `auto-repair`
  - 只在 `ci` 失败时尝试隔离分支修复

### 4.2 Paperclip 故障路由

失败来源固定为：

- `ci-test-failure`
- `build-failure`
- `deploy-or-smoke-failure`
- `infra-runner-failure`

默认标签映射：

- CI / build 失败：
  - `type:execution`
- deploy / smoke 失败：
  - `type:artifact`
  - `review:deliverable`

聚合键固定为：

```text
子任务：<repository>::<workflow>::<branch>::<job>::<sha>::<kind>
父任务：<repository>::<workflow>::<branch>::<sha>::commit-summary
```

当前面板口径补充如下：

1. 同一提交的 `ci` 先创建一个父任务
2. `frontend-ci / backend-ci / knowledge-ci` 等失败项作为子任务挂到该父任务下
3. 标题默认改为 emoji 三态：
   - 父任务：`<emoji> 短 sha · Aimandala-CI / Aimandala-Deploy · 时间`
   - 子任务：`<emoji> 短 sha · Job · 时间`
   - 示例：
     - `❌ a9f90119 · Aimandala-CI · 2026-04-14 10:56`
     - `⚠️ a9f90119 · Aimandala-Deploy · 2026-04-14 12:21`
     - `⚠️ a9f90119 · Deploy-Dev · 2026-04-14 12:21`
4. emoji 与严重度映射固定为：
   - `✅`：`resolved / success`
   - `⚠️`：`deploy-or-smoke-failure / warning`
   - `❌`：`build-failure / ci-test-failure / infra-runner-failure / error`
5. 同一个 job 在不同提交下必须形成不同子任务，不能跨 commit 复用旧单

补充治理约束：

6. `queued` 超过阈值的 workflow 不再当作代码失败处理，而是固定归类为 `infra-runner-failure`
7. issue 评论应固定带出当前判断、已做动作、下一步动作、谁来解除阻塞
8. 运行侧默认补充执行基线：
   - `cwd`
   - `branch`
   - `head sha`
   - `dirty`
   - 是否出现 workspace drift
9. `activeRun=running` 但长期没有评论或状态回写的 issue，必须被执行健康巡检标记为疑似卡住

### 4.3 自动修复边界

自动修复只允许在下面条件同时满足时触发：

1. 来源于 `ci`
2. 命中白名单 job + step
3. 有可重放的 repro command
4. 有明确 allowlist 文件范围
5. 修复发生在 `codex/auto-fix/<run-id>` 之类的隔离分支

默认白名单：

- `frontend-ci / Run Vitest`
- `frontend-ci / Run Typecheck`
- `frontend-ci / Run Mobile Web Build`
- `backend-ci / Run Pytest`
- `knowledge-ci / Run Knowledge Validation`
- `knowledge-ci / Run Knowledge Evals`

默认不允许：

- 直接改 `main`
- 直接改 `release`
- 自动合并
- 自动发布
- 自动 SSH 进服务器改现场

### 4.4 Nightly Smoke

nightly smoke 分两层：

1. `basic`
   - 健康检查
   - 首页可访问
2. `deep`
   - 上传
   - create
   - lite report
   - history
   - 可选 upgrade / pro

定时任务默认走 `basic`，手动触发才进入 `deep`。

## 5. 验收口径

### 5.1 目标行为

1. PR 到 `main` 时可看到 `ci` 红绿状态
2. 推送到 `main` 时自动部署 dev
3. 推送到 `release` 时自动部署 prod
4. nightly smoke 可单独运行，不依赖 deploy
5. CI / deploy / smoke 失败可回写到 Paperclip
6. auto-repair 只在白名单内尝试修复

### 5.2 当前已知残留

1. GitHub 上的真实 runner token、Secrets、vars 仍需在线环境配置
2. Paperclip 的实际 issue 创建需要 runner 能访问对应 API
3. runner 宕机告警要依赖外部 watchdog 调度 `check-runner-heartbeat.mjs`
4. 执行中任务的卡住检测依赖 `check-paperclip-execution-health.mjs`
