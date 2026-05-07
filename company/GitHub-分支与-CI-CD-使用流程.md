# GitHub 分支与 CI/CD 使用流程

> 状态：current
> 版本：0.2.0
> owner：Engineer / Architect
> last_updated：2026-05-05
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
- 单人开发默认先在 `main` 根工作区推进，再按任务复杂度决定是否拆出项目开发分支
- IDE 代理默认禁止主动切分支、创建分支或开新 worktree；只有用户明确要求时才允许执行
- 不把所有项目强行塞进同一种发布节奏
- 当前判断 `Aimandala` CI/CD 是否可用时，优先看 `mvp-release`
- 原 `aimandala-ci / deploy / nightly-smoke / auto-repair` 先按增强设计链路理解，不作为当前 MVP 日常开发的默认复杂度

## 2. 当前分支职责

### 2.1 `main`

`main` 当前固定表示：

- 单人开发默认主线
- 公司主干
- 治理主干
- Automation 收口主干
- 跨项目稳定收口主干

它可以承接：

- 当前单线程推进中的普通项目开发
- 本地人工完成的 CI 修复
- MVP 阶段的最小 CI/CD 验证

它不适合承接：

- 多条项目线并行施工
- 需要长期隔离的实验分支
- 服务器自动化写文件任务

### 2.2 `release`

`release` 当前固定表示：

- `AI Mandala` 生产发布分支

它当前不表示：

- 所有项目的统一发布口
- `RelayHub` 的默认发布分支

### 2.3 `aimandala/dev`

`aimandala/dev` 当前固定表示：

- `AI Mandala` 可选的项目开发主线
- 当 `main` 根工作区不够用时，用于本地开发、联调和验证的独立主线

### 2.4 `relayhub/dev`

`relayhub/dev` 当前固定表示：

- `RelayHub` 可选的长期服务器测试分支
- 当需要和 `main` 隔离时，作为内部部署主线
- 若当前直接基于 `main` 推进，则部署来源应以项目 runbook 或 workflow 配置为准

### 2.5 任务分支

任务分支不是 IDE 代理的默认动作。

只有在用户明确要求创建或切换任务分支时，任务分支才从当前约定的开发分支分出，例如：

- `feature/*`
- `fix/*`
- `codex/*`
- `chore/*`

默认口径：

- 单人单线程任务可以直接基于 `main` 完成
- 用户明确要求创建任务分支且项目开发分支已经启用时，任务分支才从项目开发分支分出
- 公司治理 / Monorepo 治理任务仍默认基于 `main`
- `Codex` 不得因为任务看起来复杂就自行创建 `codex/*` 分支
- 如需分支隔离，先向用户说明理由，等用户明确同意后再操作

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

- `main`
- `aimandala/dev`
- 从 `aimandala/dev` 分出的任务分支

适合工作：

- To C 主产品功能开发
- 本地验证与联调
- 发布前集成准备

默认路径：

- 单人当前主线开发可以直接在 `main` 完成
- 若启用了 `aimandala/dev`，任务分支先回 `aimandala/dev`
- `aimandala/dev` 稳定后再回 `main`
- 生产发布时再进入 `release`

### 3.3 RelayHub

适合分支：

- `main`
- `relayhub/dev`
- 从 `relayhub/dev` 分出的任务分支

适合工作：

- RelayHub console / control-plane / dev-relay 开发
- 内部试用与服务器测试
- `relayhub.jingshu.cc` 对应链路迭代

默认路径：

- 单人当前主线开发可以直接在 `main` 完成
- 若启用了 `relayhub/dev`，任务分支先回 `relayhub/dev`
- `relayhub/dev` push 后按该分支的内部部署链验证
- 项目分支形成阶段稳定点后，再定期回 `main`

## 4. 分支之间的合并同步

### 4.1 默认策略

当前默认采用：

- `main` 优先，项目分支按需回主干

而不是：

- 主干高频反向同步到所有项目分支

### 4.2 日常收口顺序

- `main`
  - 单人开发默认收口路径
- `项目任务分支 -> 项目开发分支`
  - 已经启用项目开发分支时的日常收口路径
- `项目开发分支 -> main`
  - 项目分支形成独立演进后的阶段性、稳定点收口路径

这里再收紧一层默认纪律：

- 不因为“文档里曾经写了项目分支”就强制离开 `main`
- 不因为“想触发 CI / deploy”就额外制造分支和 worktree
- 如果工作本来就在 `main` 上完成，关键是保持提交小、验证清楚、失败可追踪

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

### 4.5 哪些项目分支不应长期高频回灌 `main`

以下分支默认都属于“项目开发主线”而不是“公司主干”：

- `aimandala/dev`
- `relayhub/dev`
- `research-center/dev`
- `content-matrix/dev`
- `xinran-jobhunt/dev`

它们的共同纪律是：

- 可以长期存在
- 可以高频迭代
- 但不是默认必经入口
- 如果确实形成独立演进，不应为了保持“看起来同步”而高频 merge 回 `main`

通俗说：

- 单人单线程时，`main` 就是当前工作账本
- 项目 `dev` 分支只在需要独立账本时启用

因此当前不再默认把所有项目日常工作都先导向 `dev` 分支。

只有满足下面任一条件，才建议从项目分支回 `main`：

- 形成了阶段稳定点
- 需要把公司级可复用结论、共享脚本或正式入口一并收口
- 需要让其他项目明确依赖这批稳定内容
- 已完成一轮项目内验证，不再只是试验态

如果只是这些情况，默认不要回 `main`：

- 项目内部试错
- 临时联调
- 仅服务单一项目的服务器试验
- 还在频繁重写的 UI / 文案 / 研究草稿
- 只是为了让 `main`“看起来最新”

如果这些内容本来就在 `main` 上推进，则不需要额外“回 main”；此时应通过小提交、清晰说明和 CI 结果控制风险。

## 5. GitHub Actions 触发口径

### 5.1 AI Mandala

截至 `2026-05-05`，`AI Mandala` 同时存在两套 GitHub Actions 口径：

- `mvp-release`
  - 当前优先看的 MVP 可用链路
  - 使用 GitHub 托管 runner：`ubuntu-latest`
  - 负责最小 CI、手动部署、部署后 smoke
- `aimandala-ci / aimandala-deploy / aimandala-nightly-smoke / aimandala-auto-repair`
  - 增强设计链路
  - 使用 self-hosted runner：`self-hosted + linux + mindsync-ci + aimandala`
  - 负责完整质量门、Paperclip 回写、nightly smoke 和 auto-repair

#### 5.1.1 MVP 可用链路：`mvp-release`

`mvp-ci` 会在以下事件触发：

- `PR -> main`
- `PR -> release`
- `push -> aimandala/dev`
- `push -> main`
- `push -> release`

路径过滤：

- `projects/aimandala/toC/**`
- `projects/aimandala/fixtures/**`
- `shared/tools/ci/**`
- `.github/workflows/mvp-release.yml`

`mvp-ci` 当前检查内容：

- 前端 install / lint / typecheck / test / `build:mobile-web`
- 后端 release 依赖安装 / ruff / pytest unit tests

`mvp-deploy` 只通过 `workflow_dispatch` 手动触发：

- `target=dev`
  - 必须从 `main` 分支触发
  - 远端目录：`/opt/aimandala-main/app/mindsync`
  - 远端命令：`/opt/aimandala-main/scripts/deploy-main.sh`
- `target=prod`
  - 必须从 `release` 分支触发
  - 远端目录：`/opt/aimandala-release/app/mindsync`
  - 远端命令：`docker compose -f docker-compose.release.yml --env-file .env.release build && docker compose -f docker-compose.release.yml --env-file .env.release up -d`

`mvp-deploy` 成功部署后会运行：

- `shared/tools/ci/aimandala-smoke.mjs`

支持的 smoke 深度：

- `basic`
- `deep`

#### 5.1.2 增强设计链路

增强设计链路的目标口径是：

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

补充判断：

- 增强链路中的 `push -> main` 不是无条件触发 `AI Mandala` 部署
- 只有命中 `projects/aimandala/toC/**`、`projects/aimandala/deploy/**`、`shared/tools/ci/**` 或对应 workflow 文件时，才会触发增强链路的 `deploy-dev`
- 增强链路中的 `push -> release` 也同样受这组路径过滤约束

因此如果一次 `main` merge 主要改的是 `RelayHub`、研究文档或公司治理文档，就算已经 push 到 `main`，也通常**不需要**额外手动补触发 `AI Mandala deploy`

但如果当前目标是“确认 `Aimandala` 最小 CI/CD 是否可用”，优先检查 `mvp-release` 的 run，而不是先看增强链路的 self-hosted runner / Paperclip 回写链路。

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

### 5.4 何时需要手动补触发 `main / release` 对应部署

默认先按下面顺序判断：

1. 该次 `push` 是否已经自动生成对应 workflow run
2. 该次改动是否命中 workflow 的 `paths` 过滤
3. 自动 run 是 `queued / in_progress / completed`，还是根本没有生成

只有满足下面任一情况，才建议手动 `workflow_dispatch`：

- 这次改动本应部署，但因为 `paths` 配置遗漏而没生成 run
- 自动 run 因 runner / secret / GitHub 暂时异常被取消，需要补跑同一 `sha`
- 你明确要把某个既有 `main` 或 `release` 的已存在提交重新部署一次

以下情况默认不需要手动补触发：

- 自动 run 已经排队或正在执行
- 自动 run 已成功完成
- 本次改动根本没命中该项目部署路径
- 只是把别的项目分支合进了 `main`，但没有带来该项目 deploy 相关改动

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
- [company/projects/Automation/2026-05-03-GitHub-Paperclip-CI-CD-联调测试说明.md](./projects/Automation/2026-05-03-GitHub-Paperclip-CI-CD-联调测试说明.md)

## 7. 一句话判断法

- 公司治理工作：上 `main`
- 单人当前主线开发：优先上 `main`
- `AI Mandala` 需要隔离时：上 `aimandala/dev`
- `RelayHub` 需要内部部署隔离时：上 `relayhub/dev`
- 任务开发：当前主线在 `main` 就回 `main`；已启用项目开发分支才先回项目开发分支
- 项目分支阶段稳定：再回 `main`
- `AI Mandala` 正式发布：再进入 `release`
