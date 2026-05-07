# 当前 CI/CD 系统机制总览

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-05-05
> source_of_truth：company/knowledge-base/system/当前CI-CD系统机制总览.md

这份文档用于解释 `墨予镜` 当前已经落地的 CI/CD 系统到底包含哪些组件、怎样流转、解决什么问题。

当前正式样例以 `一镜一梳 / aimandala` 为准。

## 0. 当前状态口径

截至 `2026-05-05`，`mindsync` 里需要区分两套 CI/CD 口径：

1. `MVP 可用链路`
   - 当前日常判断 `Aimandala` CI/CD 是否能跑通时，优先看这条链路
   - 入口文件是 [.github/workflows/mvp-release.yml](../../../.github/workflows/mvp-release.yml)
   - 它使用 GitHub 托管 runner：`ubuntu-latest`
   - 它覆盖最小 CI、手动部署与部署后 smoke 检查
2. `增强设计链路`
   - 这是较完整的目标链路，包含 self-hosted runner、Paperclip 回写、nightly smoke、auto-repair 和 heartbeat 等能力
   - 入口文件包括 `.github/workflows/aimandala-ci.yml`、`.github/workflows/aimandala-deploy.yml`、`.github/workflows/aimandala-nightly-smoke.yml`、`.github/workflows/aimandala-auto-repair.yml`
   - 由于整条链路曾长期未稳定跑通，当前不应把它描述为唯一现行主路径

通俗说：

- `MVP 可用链路` 负责先回答“能不能稳定构建、测试和部署”
- `增强设计链路` 负责回答“未来是否要恢复完整自动化、建单、巡检和受控自动修复”

## 1. 这套系统不只是 GitHub Actions

完整设计上的 CI/CD 是一个多组件协作链路，而不是单个 workflow 文件。

它至少包含：

- GitHub Actions workflows
- self-hosted runner
- automation 宿主机
- Paperclip 问题单路由
- smoke 检查
- 自动修复脚本
- 运行健康巡检脚本

但当前实际可用主路径应先看 `mvp-release`。它有意把链路缩短为：

- GitHub 托管 runner 执行 CI
- 手动触发部署
- SSH 到目标服务器拉取分支并执行部署命令
- 部署后运行 smoke 检查

## 2. 当前链路分层

### 2.0 MVP 可用链路

`mvp-release` 当前包含两个 job：

- `mvp-ci`
  - 前端：install、lint、typecheck、test、`build:mobile-web`
  - 后端：安装 release 依赖、ruff、pytest unit tests
- `mvp-deploy`
  - 仅在 `workflow_dispatch` 手动触发时运行
  - 先依赖 `mvp-ci` 通过
  - `dev` 必须从 `main` 分支触发
  - `prod` 必须从 `release` 分支触发
  - 远端执行后会运行 `shared/tools/ci/aimandala-smoke.mjs`

同时现在补充一条独立手动部署链：

- `mvp-deploy-direct`
  - 单独 workflow
  - 用途是复用“最新一次已成功的 `mvp-ci`”结果
  - 先检查对应分支最近一次成功的 `push` 型 `mvp-release`
  - 检查通过后直接 deploy + smoke
  - 不再重复跑一整轮 `mvp-ci`

这条链路当前不做：

- Paperclip 失败建单
- Paperclip 评论回写
- self-hosted runner 调度
- nightly smoke 定时巡检
- auto-repair 自动修复

因此它更适合作为 `Aimandala` 当前的最小可信 CI/CD 主路径。

### 2.1 workflow 层

增强设计链路已拆成四条主链：

- `ci`
- `deploy`
- `nightly-smoke`
- `auto-repair`

它们共同覆盖：

- 代码检查
- 构建与测试
- 部署
- 部署后健康检查
- 白名单范围内的自动修复尝试

### 2.2 runner 层

增强设计链路使用：

- self-hosted
- linux
- `mindsync-ci`
- `aimandala`

这意味着增强链路里的 GitHub Actions 不是跑在 GitHub 托管 runner 上，而是落到我们自己的 automation 节点上执行。

MVP 链路当前使用：

- `ubuntu-latest`

这意味着它绕开了 automation 节点 runner 在线性、宿主机预装工具和 Paperclip 回写链路带来的不稳定因素。

### 2.3 automation 节点

在增强设计链路中，`一镜一梳 / automation` 节点同时承接：

- Paperclip UI/API
- self-hosted runner
- nightly smoke
- auto-fix
- heartbeat / maintenance timer

公司级服务器入口见：

- [company/服务器与基础设施入口.md](../../../company/服务器与基础设施入口.md)

项目级 runbook 见：

- [projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md](../../../projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
- [projects/aimandala/deploy/paperclip-automation/README.md](../../../projects/aimandala/deploy/paperclip-automation/README.md)

MVP 链路仍会通过 SSH 访问 dev / prod 目标机，但不依赖 automation 节点上的 self-hosted runner 执行 CI。

## 3. Paperclip 在这条链路里做什么

`Paperclip` 在增强设计链路中不直接代替 GitHub Actions 跑构建。

它承担的是：

- 失败建单
- 父子任务路由
- 运行中评论回写
- 人工 / agent 协作面
- 修复与验证的状态流转

当前语义是：

- 父任务
  - 汇总同一提交下的失败项
- 子任务
  - 承接具体 job 的修复

也就是说，`Paperclip` 是控制面与协作面，不是执行引擎本身。

MVP 链路当前不接入 Paperclip。MVP run 的成功与失败先以 GitHub Actions 页面为准。

## 4. 当前能力边界

### 4.1 MVP 链路已经具备的能力

- 在 GitHub 托管 runner 上完成前后端最小质量检查
- 支持 `dev` / `prod` 手动部署
- 支持部署后 basic / deep smoke 检查
- 部署前强制要求 `mvp-ci` 通过
- 通过分支约束避免从错误分支部署到目标环境

### 4.2 增强链路设计具备的能力

#### 4.2.1 失败自动进入 Paperclip

失败不会只停留在 GitHub Actions 红点里，而会被同步为可追踪任务。

#### 4.2.2 同一提交会做父子任务收束

- 父任务收口某次提交的失败汇总
- 子任务承接具体失败项

#### 4.2.3 评论会持续回写上下文

评论默认会带出：

- 当前判断
- 已做动作
- 下一步动作
- 谁来解除阻塞
- `adapter / host`
- `cwd / branch / sha / dirty`

其中：

- `adapter`
  - 表示哪条服务器端执行链回写了 comment
  - 对 GitHub Actions 链路，当前固定命名为：
    - `github-actions/self-hosted-runner:ci`
    - `github-actions/self-hosted-runner:deploy`
    - `github-actions/self-hosted-runner:nightly-smoke`
    - `github-actions/self-hosted-runner:auto-repair`
    - `github-actions/self-hosted-runner:runner-heartbeat`
- `host`
  - 表示真实执行宿主
  - 当前推荐固定写法：`automation@150.158.9.95`

#### 4.2.4 基础设施问题和代码问题会被区分

当前会区分至少这些失败类型：

- 代码 / 构建 / 测试失败
- runner / 基础设施异常
- 凭证问题
- 工作区漂移

#### 4.2.5 有受控自动修复边界

自动修复只在白名单范围内尝试，不默认对所有失败做激进改动。

## 5. 当前还不该误解为“已经全自动”的部分

当前不应把增强设计链路误解为已经稳定运行的无人值守系统。

仍然需要人参与的地方包括：

- secrets / vars 配置
- runner 在线性与宿主机健康
- 非白名单问题的真实修复
- QA 验收与放行

MVP 链路更不承担自动修复和自动建单职责。它的价值是先保持最小 CI/CD 闭环可用。

## 6. 当前应该怎么理解状态流

在增强 CI/CD 语境里，Paperclip 状态大体可以理解为：

- `todo`
  - 失败已进入待处理
- `in_progress`
  - 修复、联调或自动修复尝试正在推进
- `in_review`
  - 等待验收或人工确认
- `blocked`
  - 卡在基础设施、凭证、漂移或外部动作
- `done`
  - 当前同类失败已恢复为绿色

更细职责边界见：

- [company/CI-CD-角色分工说明.md](../../../company/CI-CD-角色分工说明.md)

MVP 链路没有 Paperclip 状态流。MVP 链路的状态先看 GitHub Actions run 结果。

## 6.1 当前 workflow 面板的正确阅读方式

`Paperclip` 中的 workflow 面板，不应被理解成“所有历史 run 都是当前待处理问题”。

更接近 GitHub 的正确理解应是：

1. 首先看最近几次 run 是否健康
2. 再看当前主链是否仍被失败阻塞
3. 更早的失败默认作为历史追溯材料，而不是首屏待办

因此：

- 较早提交上的单次失败，如果已被后续成功 run 覆盖，默认不应继续作为当前红灯占据首屏
- 只有最新失败、连续失败、或当前基础设施阻塞，才应继续升级为当前行动信号

这条规则的正式 spec 见：

- 历史 spec 文件名：`2026-04-16-ci-cd-面板视图与收束规则.md`
  入口见 [projects/aimandala/docs/specs/README.md](../../../projects/aimandala/docs/specs/README.md)

## 7. 如果你想快速知道“当前系统包含什么”

当前最短答案是：

1. `mvp-release` 是当前优先看的 MVP 可用链路
2. GitHub 托管 runner `ubuntu-latest` 负责执行 MVP CI 和手动部署 job
3. `shared/tools/ci/aimandala-smoke.mjs` 负责 MVP 部署后的 smoke 检查
4. `aimandala-ci / deploy / nightly-smoke / auto-repair` 是增强设计链路
5. automation 节点、self-hosted runner、Paperclip 回写和 auto-repair 属于增强链路能力
6. 项目 runbook 负责告诉你如何登录、部署、排障和验证

## 8. 继续深入时该看哪里

- MVP 可用链路：
  - [.github/workflows/mvp-release.yml](../../../.github/workflows/mvp-release.yml)
- 角色边界：
  - [company/CI-CD-角色分工说明.md](../../../company/CI-CD-角色分工说明.md)
- 项目级交付总览：
  - 历史交付文件名：`2026-04-12-ci-cd-与自动修复交付记录.md`
    入口见 [projects/aimandala/docs/delivery/README.md](../../../projects/aimandala/docs/delivery/README.md)
- 项目级实施计划：
  - 历史任务文件名：`2026-04-12-ci-cd-实施计划.md`
    入口见 [projects/aimandala/docs/tasks/README.md](../../../projects/aimandala/docs/tasks/README.md)
- 运维手册：
  - [projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md](../../../projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
