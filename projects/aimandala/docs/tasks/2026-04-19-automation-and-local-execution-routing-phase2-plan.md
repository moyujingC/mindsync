# Aimandala Automation 与本地执行分流 Phase 2 实施计划

> 状态：superseded
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-automation-and-local-execution-routing-phase2-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-phase2-local-handoff-spec.md
> depends_on：projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-spec.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

> 2026-04-19 状态说明：
> 本文档已被 [2026-04-19-paperclip-native-execution-routing-plan.md](projects/aimandala/docs/tasks/2026-04-19-paperclip-native-execution-routing-plan.md) 取代。
> “本地人工接手流程标准化”不再是当前默认实施入口。

## 1. 本轮目标

在 phase 2 spec 已经成立的前提下，本轮只补齐 phase 2 的正式 `Task` 与后续实现入口，不进入代码实现。

本轮目标固定为：

1. 把人工本地接手流程从原则层收口为可执行的文档合同
2. 把本地接手 comment 模板固定成实现者无需再做决定的标准模板
3. 把推荐状态推进路径写成可交接的建议流程
4. 为下一轮 `QA Basis` 与后续 runbook 更新提供唯一执行入口

## 2. 本轮边界

本轮明确要做：

1. 定义本地接手 runbook 的最小骨架
2. 定义三类 comment 模板
3. 定义推荐状态推进路径
4. 定义 phase 2 的 QA 验证矩阵入口

本轮明确不做：

1. 不实现本机 execution node
2. 不实现新的 execution workspace 语义
3. 不新增控制面状态
4. 不新增控制面原因码
5. 不修改 `PaperclipAI` 源码
6. 不补 `Delivery`

## 3. 实施对象

phase 2 后续实现只围绕下面四类对象展开：

### 3.1 本地接手 runbook

后续要补的 runbook 必须覆盖：

1. 何时进入本地接手
   - issue 已被服务器以 `blocked + handoff comment` 交回
2. 如何确认接手
   - 阅读最新 handoff comment
   - 明确当前 owner 与当前阻塞点
3. 如何在本地工作区处理
   - 在本地项目工作区执行
   - 不依赖 automation 节点继续代跑
4. 如何回写进展
   - 使用现有 status
   - 使用现有 comments
   - 不等待控制面新语义

### 3.2 三类 comment 模板

后续 runbook 与模板文档必须固定三类 comment：

1. 接手 comment
   - 表示已阅读 handoff comment
   - 表示由谁在本地接手
   - 表示将在哪个本地工作区处理
   - 表示下一步要做什么
2. 验证 / 进展 comment
   - 记录当前判断
   - 记录已完成验证
   - 记录剩余阻塞
   - 说明继续推进、回退或继续保持阻塞
3. 完成 / 交付 comment
   - 记录本地完成结果
   - 记录验证结论
   - 记录是否已提交
   - 记录是否进入人工审核
   - 记录是否仍需 follow-up

模板要求：

1. 模板是文档合同，不是控制面 schema
2. 模板字段、顺序和措辞要尽量固定
3. 模板必须与 phase 1 handoff comment 语义对接

### 3.3 推荐状态推进路径

phase 2 固定采用推荐路径，而不是强约束状态机：

1. `blocked`
   - 服务器拒绝继续执行，等待人工接手
2. `in_progress`
   - 本地 owner 已确认接手并开始处理
3. `in_review`
   - 本地修改与验证已完成，进入人工审核或待确认
4. `done`
   - 本地流程完成且不再需要继续跟进

同时写死下面规则：

1. 推荐路径不是强约束
2. 若任务不适合进入 `in_review`，可由人工直接进入 `done`
3. 若本地判断后仍应保持阻塞，可继续留在 `blocked` 并补 comment
4. 不新增中间状态

### 3.4 QA 验证矩阵入口

phase 2 的 QA 重点从“服务器是否拒绝”扩展为“人工本地接手是否闭环”。

后续 QA 必须覆盖：

1. owner 能否根据 handoff comment 正确接手
2. 本地接手后是否按模板回写
3. 本地接手后是否按推荐路径推进状态
4. phase 2 文档链是否仍与 phase 1 证据链一致
5. 是否仍未引入新控制面语义

## 4. 实施顺序

phase 2 后续工作必须按下面顺序执行：

1. 先补本地接手模板与 runbook 骨架
2. 再补 `QA Basis`
3. 再决定是否进入实现

禁止反过来做：

1. 不允许先写实现再补模板
2. 不允许先写实现再补 QA
3. 不允许把本地执行流程直接写成 execution node 方案

## 5. 完成标准

只有同时满足下面条件，phase 2 的 planning artifact 才算完整：

1. phase 2 `Task` 与 phase 2 spec 完全一致
2. 三类 comment 模板已经被正式收口为后续唯一推荐模板
3. 推荐状态路径已经明确，但没有升级为强约束状态机
4. 已明确下一步必须补 `QA Basis`
5. 文档没有隐含要求：
   - 本机 execution node
   - 新状态
   - 新原因码
   - 控制面源码改造
