# Aimandala Automation 与本地执行分流 Phase 2 QA Basis

> 状态：superseded
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/qa/2026-04-19-automation-and-local-execution-routing-phase2-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-phase2-local-handoff-spec.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-automation-and-local-execution-routing-phase2-plan.md
> depends_on：projects/aimandala/docs/qa/2026-04-18-automation-routing-and-heartbeat-gate-verification.md
> reviewers：Engineer, Test / QA

> 2026-04-19 状态说明：
> 本文档已被 [2026-04-19-paperclip-native-execution-routing-qa-basis.md](projects/aimandala/docs/qa/2026-04-19-paperclip-native-execution-routing-qa-basis.md) 取代。
> 其中“人工本地接手流程标准化”不再是当前默认 QA 入口。

## 1. 本轮验证对象

phase 2 本轮只验证文档与流程合同，不验证代码实现。

验证对象固定为：

1. 人工本地接手流程是否被写成正式闭环
2. 三类 comment 模板是否已经固定
3. 推荐状态推进路径是否清楚且不过度收紧
4. phase 2 文档链是否与 phase 1 证据链一致
5. 是否仍然没有引入新的控制面语义

## 2. 测试矩阵

### 2.1 文档一致性

必须验证：

1. phase 2 `Task` 与 phase 2 spec 一致
2. phase 2 `QA Basis` 与 phase 2 spec 一致
3. phase 2 文档不与 phase 1 `Delivery / Verification` 冲突
4. phase 2 文档没有把“人工本地接手”写成“正式 execution node”

### 2.2 本地接手模板合同

必须验证三类模板都已明确：

1. 接手 comment
   - 有固定用途
   - 有固定最小字段
   - 能承接 phase 1 handoff comment
2. 验证 / 进展 comment
   - 能表达当前判断
   - 能表达验证结果
   - 能表达剩余阻塞
3. 完成 / 交付 comment
   - 能表达完成结果
   - 能表达验证结论
   - 能表达是否仍需 follow-up

### 2.3 推荐状态推进路径

必须验证：

1. 推荐路径明确为：
   - `blocked`
   - `in_progress`
   - `in_review`
   - `done`
2. 文档明确说明这是推荐路径，不是强约束状态机
3. 文档明确允许：
   - `blocked -> in_progress -> done`
   - `blocked` 持续保留并补 comment
4. 文档没有新增新的中间状态

### 2.4 非目标保护

必须验证 phase 2 文档仍未要求：

1. 本机 execution node
2. 本机 execution workspace
3. 新控制面状态
4. 新控制面原因码
5. `PaperclipAI` 源码改造

## 3. 验收条件

本轮通过条件：

1. phase 2 `Task / QA Basis` 已正式落地
2. 三类 comment 模板足够明确，后续实现者无需再决定字段结构
3. 推荐状态路径清楚，但未被误写成强制状态机
4. 文档明确说明 phase 2 仍然是流程标准化阶段
5. 文档明确说明 phase 2 尚未进入实现与 delivery

## 4. 阻断条件

出现任一情况，本轮不得宣称完成：

1. phase 2 文档隐含要求本机 execution node
2. phase 2 文档隐含要求控制面新增状态或原因码
3. 三类 comment 模板仍然停留在口头原则，没有固定结构
4. 状态推进路径被写成强约束状态机
5. phase 2 文档与 phase 1 已有证据链冲突

## 5. 当前基线

phase 2 当前必须继承下面这组 phase 1 基线：

1. phase 1 已完成服务器拒绝普通任务错路由的真实闭环
2. phase 1 已形成：
   - `blocked`
   - 标准 handoff comment
3. heartbeat 仍只拦活跃 Automation 风险
4. 普通任务本地接手的当前正式前提仍是：
   - 服务器已拒绝
   - 交接 comment 已存在

这组基线用于约束 phase 2：

1. phase 2 只能扩展人工本地接手流程
2. phase 2 不能重写 phase 1 路由规则
3. phase 2 不能把本地执行偷偷升级成 runtime 能力
