# Paperclip 任务系统优化方案

> 状态：current
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-04-05
> source_of_truth：company/Paperclip任务系统优化方案.md

这份文档定义 `知行工坊` 当前阶段对 Paperclip 任务系统的优化方向。

它不是单次“整理 13 个任务”的临时操作说明，而是为了把：

- 任务语义
- 状态流
- review 机制
- 面板首屏结构
- 运行时对账
- agent 默认行为

收束成一套长期可维护的系统。

## 1. 当前暴露出的根问题

结合 `知行工坊` 当前本机实例的真实使用情况，问题不在于“系统不能工作”，而在于“系统工作了，但语义没有被界面和流程显式承载”。

当前主要表现为：

1. 原始输入、父任务、执行任务、资料沉淀、review 回合都长得像同一种 issue。
2. `todo / in_progress / in_review` 只能表示流程信号，不能单独说明当前任务到底在审什么、卡在哪、下一步归谁。
3. 公司治理文档、agent 指令、Paperclip 运行时之间已经出现轻度漂移。
4. 面板首屏更像“按时间排的任务流”，而不是“按行动优先级排的工作台”。
5. 系统健康问题目前主要靠人眼在面板里发现，没有形成默认巡检能力。

## 2. 优化目标

本轮优化要达到的目标不是“再造一套新工具”，而是让现有系统变成：

- 能明确区分任务类型的系统
- 能把状态翻译成行动建议的系统
- 能自动暴露健康问题的系统
- 能把治理源和运行时持续对账的系统
- 能被 CEO 和各角色稳定复用的系统

## 3. 非目标

本轮不做：

- 直接重写 Paperclip 的底层任务模型
- 为所有问题立刻新增数据库字段
- 先做复杂权限、审批或 routine 体系重构
- 把所有历史任务一次性彻底迁移成完美结构

当前更适合的做法是：

- 先用现有 `Issue` 结构补出“派生语义层”
- 再用脚本、入口文档和面板视图把这层语义固定下来
- 最后再判断是否有必要下沉为原生字段

## 4. 任务系统的目标形态

### 4.1 任务分层

在 `知行工坊` 里，Paperclip issue 默认分为四层：

1. `intake`
   - 原始输入、模糊想法、参考材料、待分诊问题
2. `epic`
   - 已进入正式推进的父任务或阶段任务
3. `execution`
   - 明确 owner、明确产物、可执行的子任务
4. `artifact / review`
   - 围绕某个交付物、阶段门或决策点展开的审阅回合

### 4.2 当前阶段的实现原则

在底层没有新增原生字段前，先用下面方式表达：

- `parentId`
  - 表达父子任务关系
- `project / goal`
  - 表达任务所处主上下文
- `status`
  - 只表达流程信号，不承担全部语义
- `issue documents`
  - 表达 `plan`、`research-brief`、正式 handoff、阶段产物
- `labels`
  - 后续用于补充 `type:*` 与 `review:*` 语义

当前约定以：

- [company/任务类型与标签规范.md](../company/任务类型与标签规范.md)
- [company/任务创建模板.md](../company/任务创建模板.md)
- [company/顶层任务收束规则.md](../company/顶层任务收束规则.md)

为执行入口。

也就是说：

- 现阶段先补“派生语义”
- 第二阶段再补“显式标签”
- 第三阶段再决定是否上“原生字段”

## 5. 状态语义的系统约束

### 5.1 `todo`

`todo` 只表示尚未开始执行，不表示“这条任务还没想清楚”。

在实践中需要进一步区分：

- `待分诊输入`
  - 常见特征：顶层、无 owner、原始描述
- `待开始执行`
  - 常见特征：已有 owner、已有父任务或 handoff、可直接开工

### 5.2 `in_progress`

`in_progress` 只表示正在推进。

系统必须额外识别：

- 正常推进中的执行任务
- 已长时间无活动的“假进行中”任务

### 5.3 `in_review`

`in_review` 在 `知行工坊` 中不是单一语义。

它至少包含三类：

- 方向审阅
- 交付物验收
- 决策审阅

这部分规则以：

- [company/任务审阅与状态流转规范.md](../company/任务审阅与状态流转规范.md)

为准。

## 6. 面板首屏应暴露的系统信号

系统的首屏不应只显示“最近任务”。

它应优先暴露下面几类行动信号：

1. `待分诊`
   - 顶层、无 owner、仍处于 backlog / todo 的输入
2. `待开始`
   - 已有 owner、处于 todo、可以直接启动的任务
3. `卡住 / 假进行中`
   - 处于 in_progress，但最近超过阈值没有活动
4. `待你决策`
   - 处于 in_review 的任务
5. `配置或结构漂移`
   - project / goal 映射、workspace 路径、入口文档等与治理源不一致
6. `执行路由漂移`
   - 任务应走本地人工审核，却被错误送进服务器端可写执行链
   - 或任务本应是 Automation，但没有真正 materialize 到 execution workspace

### 6.1 CI/CD / Deploy 类任务的最新窗口规则

对 `CI/CD`、`build`、`test`、`Deploy` 这类由新 run 持续覆盖旧 run 的时序型执行任务，面板默认不应无限展示历史记录。

当前推荐口径：

1. 看板默认只保留同一条流水线语境下“最新 `3` 次”任务作为行动窗口。
2. 用户与 agent 默认只围绕这最新 `3` 次介入，不再逐条回补更早的历史 run 任务。
3. 一旦发生修复并 `push`，新的 run 会自然生成新的任务记录，并进入新的最新窗口。
4. 超过最新 `3` 次之外的同类任务，默认按历史噪音处理，不再作为当前看板待办。
5. 若某条更早任务已被明确标记为“根因任务”或“唯一仍未闭环的结构性问题”，才允许例外保留在窗口内。

这条规则的目标不是隐藏失败，而是把注意力收束到当前真正可操作的反馈闭环：

- 看最新失败或最新成功
- 修复
- push
- 观察新的 run 结果

而不是让用户在面板中维护一长串已经被后续 run 覆盖的旧记录。

### 6.2 为什么先做这一层

因为这层信息不依赖新数据库字段，且能直接改变使用体验：

- 从“任务很多”变成“现在该处理什么”
- 从“靠标题猜上下文”变成“系统自己给出行动信号”

## 7. 运行时与治理源的对账要求

`知行工坊` 的公司治理源在仓库内，Paperclip 实际运行态在本机实例内。

两者不是天然同构的，因此系统必须持续做两类对账。

### 7.1 workspace 对账

已存在：

- [shared/tools/sync-paperclip-project-workspaces.sh](shared/tools/sync-paperclip-project-workspaces.sh)

用于检查：

- 运行时项目工作区路径是否仍与注册表一致

### 7.2 任务系统对账

本轮新增：

- [shared/tools/paperclip-task-system-audit.mjs](shared/tools/paperclip-task-system-audit.mjs)

用于检查：

- 顶层未分诊任务
- 长时间无进展的执行任务
- 久置 review
- 打开任务的 `type:*` 分布
- 缺少 `type:*` 标签的打开任务
- `project -> goal` 语义漂移
- 运行时项目与治理源映射差异

当前已经进一步升级为：

- 不再把健康的顶层 `type:epic` 误报成结构问题
- 可直接暴露当前打开任务按 `type:*` 的分布
- 可直接暴露当前打开任务按 `review:*` 的分布
- 可直接暴露哪些打开任务还没有补齐类型语义
- 可直接暴露哪些 `in_review` 任务还没有补齐 `review:*` 语义
- 可直接暴露哪些任务出现了“父任务已关闭但子任务仍打开”的结构异常
- 可直接暴露哪些任务出现了“activeRun 仍在 running，但长期没有评论或状态回写”的执行健康问题
- 可直接对 `CI/CD / Deploy` 类时序任务应用“仅关注最新 `3` 次”的窗口规则，避免旧 run 长期污染看板
- 可直接暴露 `execution_workspace_policy_not_materialized`
- 可直接暴露 `server_writable_execution_not_allowed`

### 7.3 服务器 Automation 与本地任务的正式分流

从 `2026-04-18` 起，`aimandala` 默认把任务分成两类：

1. `automation-execution`
   - CI 失败修复
   - deploy / smoke
   - runner heartbeat
   - infra / maintenance
   - 其他明确依赖服务器本地环境、runner、systemd、docker 或服务器凭据的任务
2. `manual-review-required`
   - 产品功能开发
   - UI / 文案
   - 一般业务逻辑改动
   - 数据结构与普通研发决策

对应运行约束：

1. 只有 `automation-execution` 才允许走 `execution_route: server_automation`
2. 其他任务默认必须走 `execution_route: local_manual_review`
3. 项目开启 `executionWorkspacePolicy` 不是服务器可写执行的充分条件
4. 服务器端自动提交只允许推到 `automation/aimandala/<task-scope>` 固定自动化分支命名空间
5. shared checkout 只保留镜像、巡检和运维参考职责，不再是普通任务执行目录

## 8. Agent 默认行为调整

系统优化不只改 UI，也要改 agent 的默认入口。

### 8.1 CEO / Orchestrator

默认需要：

- 在巡检时优先看系统健康，而不是只看“最近活跃”
- 在创建任务前先判断它属于 `intake` 还是正式 `epic`
- 在 handoff 前确认 project / goal / artifact 是否对齐

### 8.2 项目角色

默认需要：

- checkout 后尽快回写第一条“已开始处理”的进度评论
- 进度评论默认带出 `当前判断 / 已做动作 / 下一步动作 / 谁来解除阻塞`
- 在正式阻塞时带出 `blocked reason`
- 对需要仓库基线判断的任务，默认回写 `cwd / branch / sha / dirty`

- 不把顶层原始输入直接当成可执行任务
- 不把 `in_review` 自动理解成“可直接 done”
- 不把局部实验偷偷改写成全局定位
- 若任务不是 `automation-execution`
  - 不应把它送进服务器端可写执行链
- 若任务属于 `automation-execution` 但 `executionWorkspaceId = null`
  - 应按运行时漂移处理，而不是继续默认执行

## 9. 建议的三阶段落地路径

### 9.1 第一阶段：先补系统健康层

立即落地：

- 系统优化方案文档
- 入口文档更新
- CEO 工具入口修正
- 任务系统巡检脚本
- Dashboard 首屏增加系统信号视图

### 9.2 第二阶段：补任务语义层

下一步建议：

- 建立 `type:*` 标签族
  - `type:intake`
  - `type:epic`
  - `type:execution`
  - `type:artifact`
- 建立 `review:*` 标签族
  - `review:direction`
  - `review:deliverable`
  - `review:decision`
- 在 New Issue / handoff 中加入默认模板

当前已先在治理层补齐：

- [company/任务类型与标签规范.md](../company/任务类型与标签规范.md)
- [company/任务创建模板.md](../company/任务创建模板.md)
- [company/顶层任务收束规则.md](../company/顶层任务收束规则.md)

若要处理某一批具体存量任务，应额外创建项目级或阶段性交付文档，不直接写入 `company/` 规则层。

当前运行态已经部分落地：

- 已创建最小 `type:*` 标签集
- 已为当前打开任务补上 `type:epic` / `type:execution`
- 审计脚本已开始把缺标签任务当成治理问题主动暴露

下一步的默认重点不是继续手工整理某一批历史任务，而是让系统具备以下自维护能力：

- 新任务进入 review 时，缺 `review:*` 会被主动暴露
- review 结束后，残留的 `review:*` 语义漂移会被主动暴露
- 父子任务结构再次坏掉时，会被主动暴露，而不是等面板混乱后再人工排查

### 9.3 第三阶段：再判断是否要原生字段化

只有在下面条件成立时，才建议新增 Paperclip 原生字段：

1. 标签和派生语义仍不足以稳定表达任务类型
2. UI 和脚本层已经证明这些语义是长期稳定的
3. `知行工坊` 之外的其他公司样本也需要同一能力

## 10. 一句话结论

`知行工坊` 当前最需要的不是“更多任务”，而是“让任务系统自己显出结构”。

因此，本轮系统优化的主线是：

- 先补语义
- 再补巡检
- 再补首屏
- 最后才考虑改底层模型
