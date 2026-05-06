# 一镜一梳本地人工接手 Runbook

> 状态：superseded
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/runbooks/本地人工接手-runbook.md

> 2026-04-19 状态说明：
> 本文档保留为旧 phase 2 手工 handoff 流程的历史 runbook。
> 当前 execution routing 主路径已改为直接路由到本地执行节点，不再以“服务器拒绝后本地接手”为默认入口。

这份 runbook 用于收口 `execution routing phase 2` 下的本地人工接手流程。

它回答的问题是：

- 当服务器已经拒绝继续执行普通任务后，本地 owner 应该怎么接手
- 接手后应该在什么边界内处理
- 应该如何用现有 status / comment 合同回写进展

它不回答的问题是：

- 如何把本机注册成 execution node
- 如何改造 `PaperclipAI` 控制面
- 如何新增状态或原因码

## 1. 适用范围

本 runbook 只适用于下面这类 issue：

1. `task_class: manual-review-required`
2. `execution_route: local_manual_review`
3. issue 已被服务器以 `blocked + handoff comment` 交回

本 runbook 不适用于：

1. `automation-execution + server_automation`
2. automation 节点运维任务
3. 需要服务器继续代跑的 deploy / smoke / runner / infra 任务

## 2. 进入条件

只有同时满足下面条件，才进入本地人工接手流程：

1. issue 当前为 `blocked`
2. issue comment 流中存在 phase 1 标准 handoff comment
3. handoff comment 已明确说明：
   - 当前任务属于 `local_manual_review`
   - 服务器拒绝可写执行
   - 后续必须由人工在本地环境接手

若这三条不成立，不应直接套用本 runbook。

## 3. 本地接手流程

### 3.1 阅读 handoff comment

先做下面三件事：

1. 阅读最新 handoff comment
2. 确认服务器拒绝原因
3. 确认当前阻塞点与当前 owner

接手前不要默认认为：

1. 服务器还会继续执行
2. automation 节点会替你补验证
3. 后续会自动恢复到运行中

### 3.2 确认接手

本地 owner 接手时，必须先回写一条接手 comment。

这条 comment 至少要说明：

1. 已阅读 handoff comment
2. 由谁在本地接手
3. 将在哪个本地工作区处理
4. 下一步要做什么

接手 comment 的固定模板见：

- [本地人工接手-comment-模板规范.md](../../../../projects/aimandala/docs/runbooks/本地人工接手-comment-模板规范.md)

### 3.3 准备本地工作区

本地处理必须在本地项目工作区进行。

本 runbook 的正式口径是：

1. 本地执行是人工流程
2. 本地执行不是 runtime capability
3. 本地执行不是 execution node 声明
4. 不要求控制面为普通任务分配正式本地 execution workspace

因此本阶段只要求：

1. 使用本地已有项目工作区
2. 准备完成后进入人工处理

### 3.4 本地处理

本地 owner 在本地工作区执行：

1. 分析
2. 修改
3. 验证
4. 判断是否应提交
5. 判断是否应继续推进

本 runbook 不替代工程判断。

它只要求：

1. 需要人工判断的内容必须由人工在本地完成
2. 不等待 automation 节点继续代跑

### 3.5 回写进展

本地处理过程中，必须继续通过现有合同回写进展：

1. 使用现有 issue comments
2. 使用现有 issue status
3. 不等待新的状态
4. 不等待新的原因码

进展 comment 与完成 comment 的固定模板见：

- [本地人工接手-comment-模板规范.md](../../../../projects/aimandala/docs/runbooks/本地人工接手-comment-模板规范.md)

## 4. 推荐状态路径

phase 2 只定义推荐路径，不定义强约束状态机。

推荐路径为：

1. `blocked`
   - 服务器拒绝继续执行，等待人工接手
2. `in_progress`
   - 本地 owner 已确认接手并开始处理
3. `in_review`
   - 本地修改与验证已完成，进入人工审核或待确认
4. `done`
   - 本地流程完成且不再需要继续跟进

## 5. 允许的人工偏离

下面偏离在 phase 2 中是允许的：

1. `blocked -> in_progress -> done`
   - 若任务不需要单独审核阶段，可直接进入 `done`
2. `blocked` 持续保留
   - 若本地判断后仍有阻塞，可以继续保持 `blocked`
   - 但必须补进展 comment

下面偏离在 phase 2 中不允许：

1. 把本地接手流程写成新的 execution node 方案
2. 因为需要更多语义而自行发明新状态
3. 因为需要更多语义而自行发明新原因码

## 6. 服务器职责边界

对 `manual-review-required + local_manual_review` 任务，服务器只负责：

1. 拒绝可写执行
2. 记录审计证据
3. 生成 handoff comment

服务器不负责：

1. 为普通任务继续执行写操作
2. 为普通任务创建本地 runtime
3. 替本地 owner 决定是否提交
4. 替本地 owner 完成闭环

## 7. 本地 owner 最低完成标准

本地接手后，最低完成标准是：

1. 已有接手 comment
2. 已有至少一条验证 / 进展 comment 或完成 / 交付 comment
3. issue 状态已按实际进展被更新
4. 没有把本地处理误写成服务器继续执行

## 8. 关联文档

1. phase 2 spec：
   - [../specs/2026-04-18-automation-and-local-execution-routing-phase2-local-handoff-spec.md](projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-phase2-local-handoff-spec.md)
2. phase 2 task：
   - [../tasks/2026-04-19-automation-and-local-execution-routing-phase2-plan.md](projects/aimandala/docs/tasks/2026-04-19-automation-and-local-execution-routing-phase2-plan.md)
3. phase 2 QA：
   - [../qa/2026-04-19-automation-and-local-execution-routing-phase2-qa-basis.md](projects/aimandala/docs/qa/2026-04-19-automation-and-local-execution-routing-phase2-qa-basis.md)
4. comment 模板规范：
   - [本地人工接手-comment-模板规范.md](../../../../projects/aimandala/docs/runbooks/本地人工接手-comment-模板规范.md)
