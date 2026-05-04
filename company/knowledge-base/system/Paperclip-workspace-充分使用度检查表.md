# Paperclip Workspace / Git Worktree 充分使用度检查表

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-02
> source_of_truth：company/knowledge-base/system/Paperclip-workspace-充分使用度检查表.md

这份文档回答一个很实际的问题：

`Paperclip` 面板上已经能配置 `workspace`、`execution workspace`（执行工作区）和 `git worktree`（Git 工作树），那到底怎样才算“已经充分使用了”？

这里的“充分使用”不是指：

- 面板上把开关打开了
- 项目里写了 `executionWorkspacePolicy.enabled = true`
- 服务器上看到了几个 worktree 目录

而是指：

- 配置真的被运行时消费了
- 任务真的落到了对的工作区
- 收尾真的形成了 Git clean（Git 干净）闭环

如果只开了功能，但运行时还是会写脏主 checkout（主工作区），那就不能算“充分使用”。

## 1. 一句话判断标准

对 `墨予镜 / MindSync` 当前这套运行方式来说，只有同时满足下面三件事，才接近“充分使用”：

1. `project / issue` 的 workspace 配置已经启用
2. 运行时真的 materialize（真正落实）成实际 execution workspace 和 `git worktree`
3. 任务完成后不会留下 `done but dirty`（状态已完成但 Git 仍有脏改）的残局

如果只满足第 1 条，不算充分使用。

## 2. 10 条检查表

下面这 10 条按三组组织：

- 配置已启用
- 运行时已兑现
- 收尾已闭环

每条都回答三件事：

- 看什么
- 怎么判断合格
- 不合格时常见症状

### A. 配置已启用

#### 1. 项目级 execution workspace policy（执行工作区策略）是否真的开启

看什么：

- 项目运行态里是否存在 `executionWorkspacePolicy`
- 是否包含：
  - `enabled = true`
  - `defaultMode = isolated_workspace`
  - `workspaceStrategy.type = git_worktree`

怎么判断合格：

- 不只是文档里写了，而是运行态 project 对象里真的有这些字段
- 对服务器 automation 节点，`worktreeParentDir` 应落到 `/opt/automation/worktrees`

不合格时常见症状：

- 面板上觉得“好像已经开了”
- 实际 issue 仍经常回落到共享 checkout
- 排障时只能看到主 checkout 被写脏，看不到对应 worktree

#### 2. issue 是否允许继承并使用项目级 workspace 规则

看什么：

- issue 是否有异常 override（覆盖）
- 项目是否允许 `allowIssueOverride`
- issue 是否被手工改到一个与默认策略冲突的 workspace

怎么判断合格：

- 大多数普通 issue 不需要手工 override
- issue 没被改成和项目默认策略相冲突的 workspace

不合格时常见症状：

- 项目配置看起来没问题
- 但个别 issue 总是落不到预期 worktree
- 同一类任务出现“有的隔离、有的不隔离”

#### 3. server / local 两条执行链的语义是否已经分清

看什么：

- `task_class`
- `execution_route`
- 对应的任务类型文档和模板

怎么判断合格：

- `automation-execution + server_automation`
  - 才允许进入服务器可写执行链
- `manual-review-required + local_manual_review`
  - 默认回到本地执行

不合格时常见症状：

- 产品开发类任务也跑到服务器 worktree
- 本应本地处理的任务，被服务器静默执行
- 你以为是 workspace 问题，其实先错在路由语义

### B. 运行时已兑现

#### 4. issue 是否真的绑定了 execution workspace（执行工作区）

看什么：

- issue 上是否有：
  - `executionWorkspaceId`
  - 或 `currentExecutionWorkspace.id`

怎么判断合格：

- 活跃 issue 一旦进入真实执行阶段，就应看到真实 workspace 绑定
- 不能只看到 project policy 开着，但 issue 绑定仍是空

不合格时常见症状：

- issue 已经 `in_progress / in_review / done`
- 但 `executionWorkspaceId = null`
- 这说明 policy 只是“写在项目上”，没有真正兑现到 issue

#### 5. 宿主机上是否真的存在对应 worktree

看什么：

- 服务器：
  - `/opt/automation/worktrees/...`
- 本地：
  - 对应项目约定的本地 worktree 路径

怎么判断合格：

- issue 绑定的 execution workspace 在宿主机上有真实目录
- 路径和项目策略约定一致

不合格时常见症状：

- 面板里看起来像有 workspace
- 宿主机上找不到对应 worktree
- 或只有 Paperclip 历史兼容目录，没有真正隔离 checkout

#### 6. agent 的真实 cwd（当前执行目录）是否落在对的地方

看什么：

- `cwd`
- `paperclipWorkspace`
- `PAPERCLIP_WORKSPACE_*` 环境变量

怎么判断合格：

- 服务器 `server_automation` 任务的 `cwd` 必须落在 `/opt/automation/worktrees/...`
- 普通本地任务应落在本地 monorepo 或本地 worktree，而不是服务器可写区

不合格时常见症状：

- 配置和绑定都看起来存在
- 但 agent 实际执行时，还是跑进：
  - `/opt/automation/app/mindsync`
  - `/opt/automation/app/mindsync-heartbeat`

#### 7. observe-only checkout（只观察工作区）是否已经真正不再被写入

看什么：

- `/opt/automation/app/mindsync`
- `/opt/automation/app/mindsync-heartbeat`
- 它们的 `git status --short`

怎么判断合格：

- 主镜像区和 heartbeat 巡检区长期保持干净
- 它们只作为参考 checkout，不再承接真实写操作

不合格时常见症状：

- 你明明启用了 worktree
- 但真正变脏的还是主镜像区或 heartbeat 区
- 这通常说明 runtime checkout 消费链路仍在漂移

### C. 收尾已闭环

#### 8. 任务完成后，worktree 是否保持 Git clean（Git 干净）

看什么：

- `git status --short`
- issue 状态是否已经是 `done`

怎么判断合格：

- 对服务器执行任务：
  - clean worktree 才能稳定保持 `done`
- 有改动时：
  - 要么自动提交并转 `in_review`
  - 要么保留现场并转 `blocked`

不合格时常见症状：

- issue 面板已经 `done`
- 但 worktree 里还有 tracked/untracked 改动
- 这就是典型 `done but dirty`

#### 9. workspace 关闭与清理语义是否成立

看什么：

- execution workspace 是否有 close / cleanup 语义
- maintenance（维护）脚本是否只回收 clean 的过期 worktree

怎么判断合格：

- clean 且已完成的 workspace 才进入可清理状态
- dirty worktree 不会被误删

不合格时常见症状：

- 脏 worktree 长期堆积
- 或维护脚本只能靠人工判断哪些能删
- workspace 生命周期没有形成稳定语义

#### 10. 健康检查是否把漂移当成阻断，而不只是审计

看什么：

- health check / heartbeat / maintenance 的 strict gate（严格闸门）
- 是否阻断以下问题：
  - policy 已开但 issue 未真正绑定 workspace
  - 本地任务误入服务器可写区
  - `done` issue 对应 worktree 仍 dirty

怎么判断合格：

- 这些问题一旦出现，不只是“记一条日志”
- 而是会直接阻断本轮成功回写或后续自动动作

不合格时常见症状：

- 系统一直“知道有问题”
- 但问题只是被审计、没有被阻断
- 于是脏工作区会重复出现

## 3. 四种结论模板

用完上面 10 条后，可以直接落到下面四种结论之一。

### 3.1 未使用

适用判断：

- 没开 project policy
- 没有稳定 workspace 约定
- 基本仍是共享 checkout 直接执行

### 3.2 已启用但未兑现

适用判断：

- 面板上已经开了 workspace / policy
- 但 issue 经常没有真实 workspace 绑定
- 宿主机也没有对应 worktree

### 3.3 已部分兑现但未闭环

适用判断：

- 已经出现真实 worktree
- 部分任务也确实落到了隔离目录
- 但仍会出现：
  - 写脏主 checkout
  - 本地任务误入服务器
  - `done but dirty`

### 3.4 已充分使用

适用判断：

- project / issue / runtime / host worktree 四层一致
- server / local 路由明确
- 主 checkout 长期不再承接真实写操作
- 任务完成后不再留下 dirty worktree
- 漂移会被 strict gate 直接阻断

## 4. 你当前环境的默认判断

按 `MindSync / 墨予镜` 当前这套环境的正式口径，默认判断应是：

**已启用并部分兑现，但还未完全闭环。**

更直白一点说：

- 功能已经不是“没开”
- `git worktree` 也不是“完全没用上”
- 但它还没有完全变成强约束的默认执行底座

当前主要缺口不在 UI 配置本身，而在两件事：

1. 运行时强约束
   - 不能只看面板配置
   - 必须保证真实 `cwd`、真实 workspace 绑定、真实 host worktree 一致
2. 收尾闭环
   - 不能再允许 `done but dirty`
   - 必须把 Git 收尾、workspace 关闭、清理语义绑定起来

补充到 `2026-05-03` 的正式判断：

1. 多项目 heartbeat 已经落地
2. 但 observe-only checkout 是否长期干净，已经成为判断“worktree 是否真正用起来”的硬条件
3. 如果 `/opt/automation/app/mindsync` 或 `/opt/automation/app/mindsync-heartbeat` 继续承接真实写操作，就不能宣称当前环境已充分使用 `workspace / git worktree`

## 5. 用这份检查表时最容易踩的误区

### 5.1 把“开了 policy”当成“已经充分使用”

不是。

`executionWorkspacePolicy.enabled = true` 只是起点，不是完成态。

### 5.2 把“看到了 worktree 目录”当成“已经完全生效”

也不是。

worktree 目录存在，只说明系统部分会创建隔离 checkout，不等于每条任务都真的落到了那里。

### 5.4 把“多项目 heartbeat 跑通了”当成“observe-only checkout 已治理完成”

也不是。

heartbeat 能同时检查 `main` 和 `relayhub/dev`，只说明巡检能力已经覆盖多项目。

如果巡检 checkout 自己仍然会被写脏，或者升级仍依赖脏目录直接继续运维，就还不算闭环。

### 5.3 把“issue done”当成“执行闭环已经成立”

也不是。

只要 Git 还脏，或者 workspace 还没形成稳定关闭语义，就不能算真正闭环。

## 6. 推荐搭配阅读

- 机制总入口：
  - [company/projects/Automation/PROJECT.md](company/projects/Automation/PROJECT.md)
- 当前正式项目级实例：
  - [projects/aimandala/deploy/paperclip-automation/README.md](projects/aimandala/deploy/paperclip-automation/README.md)
- 任务语义与执行边界：
  - [company/任务类型与标签规范.md](company/任务类型与标签规范.md)
  - [company/标签与状态使用说明.md](company/标签与状态使用说明.md)
