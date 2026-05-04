# GitHub 分支与 CI/CD 使用流程

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-05-03
> source_of_truth：company/GitHub-分支与-CI-CD-使用流程.md

这份文档把 `mindsync` 当前的 GitHub 使用流程收口成一套明确口径。

它回答 3 个问题：

1. 在哪个分支上做什么样的工作
2. 分支之间如何合并和同步
3. 哪些 GitHub Actions 会在什么情况下触发

## 1. 核心原则

- GitHub Actions 不按 `worktree` 触发
- GitHub Actions 只按分支、事件和路径触发
- `worktree` 是工作台，不是另一套 Git 治理体系
- 默认先收口到项目开发分支，再定期回 `main`
- 不把所有项目强行塞进同一种发布节奏

## 2. 当前分支职责

### 2.1 `main`

`main` 当前固定表示：

- 公司主干
- 治理主干
- Automation 收口主干
- 跨项目稳定收口主干

它默认不承接：

- 高频项目试错
- `RelayHub` 的日常部署主线

### 2.2 `release`

`release` 当前固定表示：

- `AI Mandala` 生产发布分支

它当前不表示：

- 所有项目的统一发布口
- `RelayHub` 的默认发布分支

### 2.3 `aimandala/dev`

`aimandala/dev` 当前固定表示：

- `AI Mandala` 的项目开发主线
- 本地开发、联调和验证默认主线

### 2.4 `relayhub/dev`

`relayhub/dev` 当前固定表示：

- `RelayHub` 的长期服务器测试分支
- `RelayHub` 的内部部署主线
- `relayhub.jingshu.cc` 当前默认驱动分支

### 2.5 任务分支

任务分支默认从项目开发分支分出，例如：

- `feature/*`
- `fix/*`
- `codex/*`
- `chore/*`

默认口径：

- 项目实现任务不要直接从 `main` 分出
- 公司治理 / Monorepo 治理任务才默认基于 `main`

## 3. 在哪个分支上做什么

### 3.1 公司治理 / 仓库治理

适合分支：

- `main`

适合工作：

- 公司级治理文档
- Monorepo 协作规则
- Automation 机制说明
- 跨项目共享脚本与共享规范

### 3.2 AI Mandala

适合分支：

- `aimandala/dev`
- 从 `aimandala/dev` 分出的任务分支

适合工作：

- To C 主产品功能开发
- 本地验证与联调
- 发布前集成准备

默认路径：

- 任务分支先回 `aimandala/dev`
- `aimandala/dev` 稳定后再回 `main`
- 生产发布时再进入 `release`

### 3.3 RelayHub

适合分支：

- `relayhub/dev`
- 从 `relayhub/dev` 分出的任务分支

适合工作：

- RelayHub console / control-plane / dev-relay 开发
- 内部试用与服务器测试
- `relayhub.jingshu.cc` 对应链路迭代

默认路径：

- 任务分支先回 `relayhub/dev`
- `relayhub/dev` push 后直接触发内部部署链
- 阶段稳定后再定期回 `main`

## 4. 分支之间的合并同步

### 4.1 默认策略

当前默认采用：

- 项目分支定期回主干

而不是：

- 主干高频反向同步到所有项目分支

### 4.2 日常收口顺序

- `项目任务分支 -> 项目开发分支`
  - 日常默认收口路径
- `项目开发分支 -> main`
  - 阶段性、稳定点收口路径

### 4.3 何时把 `main` 回灌到项目分支

仅在以下情况进行：

- `main` 上有该项目明确依赖的治理变更
- 有共享工具、共享规范、共享脚本更新必须下发
- 项目分支与主干偏差过大，已影响后续收口

### 4.4 何时把 `RelayHub` 回收进 `main`

`relayhub/dev -> main` 默认定期但不高频。

只在以下条件满足时进行：

- 某阶段能力已稳定
- 需要把项目级实现、文档和结论纳入主仓长期真理源
- 不会把未准备好的内部试验态内容一并带入 `main`

## 5. GitHub Actions 触发口径

### 5.1 AI Mandala

- 任务/项目分支 push
  - 跑轻量 CI
- `PR -> main`
  - 跑完整 CI
- `push -> main`
  - 跑完整 CI
  - 成功后执行 `deploy-dev`
- `push -> release`
  - 跑完整 CI
  - 成功后执行 `deploy-prod`

### 5.2 RelayHub

- `push -> relayhub/dev`
  - 跑轻量 CI
  - 成功后执行自动部署
  - 部署后执行最小 smoke

路径过滤只监听：

- `projects/relayhub/**`
- `shared/tools/ci/**`
- `.github/workflows/relayhub-*.yml`

当前需要在 GitHub Secrets 中补齐：

- `RELAYHUB_RELEASE_HOST`
  - 当前建议填写 `42.192.65.145`
- `RELAYHUB_RELEASE_USER`
  - 当前建议填写 `ubuntu`
- `RELAYHUB_RELEASE_SSH_KEY`
  - 当前建议填写 release 机对应的 SSH 私钥内容

这些 secret 只服务 `RelayHub` 自己的自动部署链，不和 `AI Mandala` 的 deploy secret 混用。

### 5.3 一个常见误解

GitHub 页面上看起来像“每个 worktree 一套 CI/CD”，实际上通常只是：

- 每个分支各有自己的运行记录
- 同一批改动在 PR 阶段和 merge 后会分别触发不同事件

真正要看的是：

- `workflow`
- `event`
- `branch`
- `sha`
- `paths`

## 6. PaperclipAI 联调口径

当前这套 `CI/CD + Deploy` 不只要在 GitHub Actions 面板里是绿色，还要在 `PaperclipAI` 这层控制面完成联调。

这里的 `PaperclipAI` 主要承接的是：

- 失败建单
- 父子任务收束
- 执行来源回写
- `server_automation` 与 `local_manual_review` 路由区分
- runner heartbeat 与执行健康巡检

默认验收要点：

- `RelayHub`
  - `push -> relayhub/dev` 后，GitHub 侧应触发 `relayhub-ci-deploy`
  - 若失败，`PaperclipAI` 中对应任务应落为：
    - `task_class: automation-execution`
    - `execution_route: server_automation`
    - `source: deploy-or-smoke-failure` 或对应失败源
  - 若成功，至少应能从回写 comment 看见：
    - `adapter: github-actions/self-hosted-runner:deploy`
    - `host: automation@150.158.9.95`
- `AI Mandala`
  - `PR -> main` 的完整 CI 失败，应进入 `PaperclipAI` 的 CI 失败链，而不是误记成 deploy 失败
  - `push -> main` 的 `deploy-dev` 失败，应进入 deploy / smoke 失败链
  - `push -> release` 的 `deploy-prod` 失败，应进入生产发布失败链
- 父任务收束
  - 同一提交下的汇总父任务仍应保持：
    - `task_class: manual-review-required`
    - `execution_route: local_manual_review`
    - `source: automation-summary`
  - 不能把父任务误送进服务器自动执行链

可执行 smoke 与运行时入口统一看：

- [shared/tools/ci/paperclip-sync-lib.smoke.mjs](shared/tools/ci/paperclip-sync-lib.smoke.mjs)
- [shared/tools/ci/paperclip-github-cicd-routing.smoke.mjs](shared/tools/ci/paperclip-github-cicd-routing.smoke.mjs)
- [company/projects/Automation/2026-05-03-GitHub-Paperclip-CI-CD-联调测试说明.md](company/projects/Automation/2026-05-03-GitHub-Paperclip-CI-CD-联调测试说明.md)

## 6. 一句话判断法

- 公司治理工作：上 `main`
- `AI Mandala` 日常开发：上 `aimandala/dev`
- `RelayHub` 日常开发和内部部署：上 `relayhub/dev`
- 任务开发：先回项目开发分支
- 阶段稳定：再回 `main`
- `AI Mandala` 正式发布：再进入 `release`
