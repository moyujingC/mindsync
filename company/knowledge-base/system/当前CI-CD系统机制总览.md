# 当前 CI/CD 系统机制总览

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/knowledge-base/system/当前CI-CD系统机制总览.md

这份文档用于解释 `墨予镜` 当前已经落地的 CI/CD 系统到底包含哪些组件、怎样流转、解决什么问题。

当前正式样例以 `一镜一梳 / aimandala` 为准。

## 1. 这套系统不只是 GitHub Actions

当前 CI/CD 是一个多组件协作链路，而不是单个 workflow 文件。

它至少包含：

- GitHub Actions workflows
- self-hosted runner
- automation 宿主机
- Paperclip 问题单路由
- smoke 检查
- 自动修复脚本
- 运行健康巡检脚本

## 2. 当前已落地的主链路

### 2.1 workflow 层

当前已拆成四条主链：

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

当前使用：

- self-hosted
- linux
- `mindsync-ci`
- `aimandala`

这意味着 GitHub Actions 并不是跑在 GitHub 托管 runner 上，而是落到我们自己的 automation 节点上执行。

### 2.3 automation 节点

当前 `一镜一梳 / automation` 节点同时承接：

- Paperclip UI/API
- self-hosted runner
- nightly smoke
- auto-fix
- heartbeat / maintenance timer

公司级服务器入口见：

- [company/服务器与基础设施入口.md](/Users/xinran/Downloads/dev/mindsync/company/服务器与基础设施入口.md)

项目级 runbook 见：

- [projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
- [projects/aimandala/deploy/paperclip-automation/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/paperclip-automation/README.md)

## 3. Paperclip 在这条链路里做什么

`Paperclip` 在 CI/CD 中不直接代替 GitHub Actions 跑构建。

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

## 4. 当前这套链路已经具备哪些能力

### 4.1 失败自动进入 Paperclip

失败不会只停留在 GitHub Actions 红点里，而会被同步为可追踪任务。

### 4.2 同一提交会做父子任务收束

- 父任务收口某次提交的失败汇总
- 子任务承接具体失败项

### 4.3 评论会持续回写上下文

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

### 4.4 基础设施问题和代码问题会被区分

当前会区分至少这些失败类型：

- 代码 / 构建 / 测试失败
- runner / 基础设施异常
- 凭证问题
- 工作区漂移

### 4.5 有受控自动修复边界

自动修复只在白名单范围内尝试，不默认对所有失败做激进改动。

## 5. 当前还不该误解为“已经全自动”的部分

这套链路已经是正式系统，但还不是无人值守万能修复系统。

仍然需要人参与的地方包括：

- secrets / vars 配置
- runner 在线性与宿主机健康
- 非白名单问题的真实修复
- QA 验收与放行

## 6. 当前应该怎么理解状态流

在 CI/CD 语境里，大体可以理解为：

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

- [company/CI-CD-角色分工说明.md](/Users/xinran/Downloads/dev/mindsync/company/CI-CD-角色分工说明.md)

## 7. 如果你想快速知道“当前系统包含什么”

最短答案是：

1. GitHub Actions 负责触发工作流
2. automation 节点上的 self-hosted runner 负责执行
3. 共享 `shared/tools/ci/` 脚本负责同步、巡检、smoke 和 auto-fix
4. Paperclip 负责建单、路由、回写和协作
5. 项目 runbook 负责告诉你如何登录、部署、排障和验证

## 8. 继续深入时该看哪里

- 角色边界：
  - [company/CI-CD-角色分工说明.md](/Users/xinran/Downloads/dev/mindsync/company/CI-CD-角色分工说明.md)
- 项目级交付总览：
  - [projects/aimandala/docs/delivery/2026-04-12-ci-cd-与自动修复交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-12-ci-cd-与自动修复交付记录.md)
- 项目级实施计划：
  - [projects/aimandala/docs/tasks/2026-04-12-ci-cd-实施计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-ci-cd-实施计划.md)
- 运维手册：
  - [projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
