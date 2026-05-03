# GitHub 与 PaperclipAI 的 CI/CD 联调测试说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-03
> source_of_truth：company/projects/Automation/2026-05-03-GitHub-Paperclip-CI-CD-联调测试说明.md

这份说明用于补齐一个之前没有单独写清的口径：

- GitHub Actions 负责触发和执行
- `PaperclipAI` 负责把执行结果收束成可协作、可追踪、可审计的自动化任务

也就是说，`CI/CD` 和 `Deploy` 最终不只是“GitHub 上跑绿了”，还要验证：

1. 失败能不能正确进入 `PaperclipAI`
2. 路由是不是正确落到 `server_automation`
3. 父任务和子任务有没有混层
4. comment 回写里有没有带出执行来源

## 1. 当前联调对象

### 1.1 RelayHub

当前正式链路：

- 分支：`relayhub/dev`
- workflow：`relayhub-ci-deploy`
- 触发：`push`
- 成功链路：
  - light CI
  - deploy
  - smoke

`PaperclipAI` 侧应重点验证：

- 失败是否被记成 `automation-execution`
- 是否带 `execution_route: server_automation`
- 是否能区分：
  - 代码 / 测试失败
  - deploy / smoke 失败
  - runner / infra（基础设施）失败

### 1.2 AI Mandala

当前正式链路：

- `PR -> main`
  - 完整 CI
- `push -> main`
  - 完整 CI + `deploy-dev`
- `push -> release`
  - 完整 CI + `deploy-prod`

`PaperclipAI` 侧应重点验证：

- `PR -> main` 失败不要误记成 deploy 失败
- `push -> main` 的部署失败要进入 deploy / smoke 路由
- `push -> release` 的部署失败要保持生产发布语义

## 2. 统一测试目标

每次联调至少回答下面 5 个问题：

1. GitHub 上触发的是不是预期 workflow
2. 失败进入 `PaperclipAI` 后，任务类型是不是对的
3. 父任务是否仍是汇总协调任务，而不是服务器自动执行任务
4. comment 中是否带出了执行来源
5. runner heartbeat 与执行健康巡检是否仍能观察到这条链路

## 3. 正向样本

### 3.1 RelayHub push 成功

样本动作：

- 在 `relayhub/dev` push 一次只影响 `projects/relayhub/**` 的提交

预期：

- GitHub 触发 `relayhub-ci-deploy`
- `relayhub-light-ci` 通过
- `relayhub-deploy` 通过
- smoke 通过
- `PaperclipAI` 不应额外留下仍处于阻塞状态的 deploy 故障单

### 3.2 AI Mandala PR 到 main

样本动作：

- 从 `aimandala/dev` 或任务分支向 `main` 发 PR

预期：

- GitHub 只跑完整 CI
- 不触发 `deploy-dev`
- 若失败，`PaperclipAI` 应落为 CI 失败，而不是 deploy 失败

### 3.3 AI Mandala push 到 release

样本动作：

- 向 `release` push 一个已准备好的发布提交

预期：

- GitHub 触发生产发布链
- 若失败，`PaperclipAI` 应落为 deploy / smoke 失败
- comment 中应能追溯执行来源

## 4. 反向样本

### 4.1 父任务误进服务器链

反样本：

- 同一提交汇总父任务被写成：
  - `task_class: automation-execution`
  - `execution_route: server_automation`

这是错误的。

父任务固定应为：

- `task_class: manual-review-required`
- `execution_route: local_manual_review`
- `source: automation-summary`

### 4.2 RelayHub 成功部署却仍残留当前阻塞单

反样本：

- GitHub 已绿色
- smoke 已通过
- `PaperclipAI` 里仍把同一最新 run 当作当前阻塞

这是错误的。

默认应按“最新窗口”收束，而不是让已恢复 run 长期占住首屏。

## 5. 可执行 smoke

本仓库当前至少保留两层 smoke：

### 5.1 通用同步语义 smoke

```bash
node shared/tools/ci/paperclip-sync-lib.smoke.mjs
```

用途：

- 验证 GitHub workflow 失败同步到 `PaperclipAI` 时的基础任务语义
- 验证父任务是否仍保持 `automation-summary`
- 验证 `server_automation` 路由是否只给真正的执行型失败

### 5.2 当前分支策略专项 smoke

```bash
node shared/tools/ci/paperclip-github-cicd-routing.smoke.mjs
```

用途：

- 验证 `relayhub/dev` 的 deploy 失败能按 `server_automation` 进入 `PaperclipAI`
- 验证 `AI Mandala` 的 `main / release` 场景仍保持分层语义
- 验证 comment 回写里的 `adapter / host` 口径

## 6. 运行态联调检查

除 smoke 外，真实联调时还应手动核对：

1. GitHub run 链接能否回溯到具体 `workflow / branch / sha`
2. `PaperclipAI` issue 描述中是否包含：
   - `automation_key`
   - `workflow`
   - `branch`
   - `source`
   - `task_class`
   - `execution_route`
3. comment 中是否包含：
   - `adapter`
   - `host`
4. heartbeat 是否健康：
   - `paperclip-multi-project-heartbeat.mjs`
   - 其内部对每个 target 顺序调用：
     - `check-runner-heartbeat.mjs`
     - `check-paperclip-execution-health.mjs`

## 6.1 Heartbeat 接入后的专项检查

完成 heartbeat 升级后，至少再核对：

1. `paperclip-heartbeat.service` 已切到：
   - `shared/tools/ci/paperclip-multi-project-heartbeat.mjs`
2. `PAPERCLIP_HEARTBEAT_TARGETS_JSON` 至少包含：
   - `一镜一梳 / aimandala-ci.yml / main`
   - `RelayHub / relayhub-ci-deploy.yml / relayhub/dev`
3. 手动执行多项目 heartbeat 时：
   - 输出中能同时看见 `一镜一梳`
   - 输出中能同时看见 `RelayHub`
4. 当故意把某个 target 的 `workflowFile` 改错时：
   - 整个 heartbeat 非零退出
   - 摘要中仍能同时看见两个 target 的结果
5. `RelayHub` 的 heartbeat / execution health 异常进入 `PaperclipAI` 后：
   - 应落到 `RelayHub`
   - 不应继续错误落到 `一镜一梳`

补充治理口径：

6. 巡检 checkout 即使检查 `relayhub/dev` 的 workflow
   - 也应继续保持本地对齐 `origin/main`
7. 若 `/opt/automation/app/mindsync-heartbeat` 变脏
   - 应按 observe-only checkout 治理处理
   - 不应直接把它切到 `relayhub/dev` 当作修复手段

## 7. 本轮最小结论口径

当以下条件都满足时，才能说：

“这套 `CI/CD + Deploy` 已经在 `PaperclipAI` 上完成了自动化联调。”

- GitHub workflow 触发正确
- 失败同步正确
- 父子任务分层正确
- `server_automation` 路由正确
- comment 执行来源正确
- heartbeat 与执行健康巡检未被这套新分支策略破坏
