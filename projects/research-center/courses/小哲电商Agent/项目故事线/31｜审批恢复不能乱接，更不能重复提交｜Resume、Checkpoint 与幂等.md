# 审批恢复不能乱接，更不能重复提交｜Resume、Checkpoint 与幂等

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396428754-408a218b-8389-4a78-94f9-9d354c64cb4c.png" title="null" crop="0,0,1,1" id="O6e4P" class="ne-image">

## 审批通过后，状态还能不能接回来 第 30 课之后，退款和退货都能进入人工审批。 Agent 不会自己批准。 普通聊天也不能冒充审批。 你刚觉得这条线终于稳了，售后主管的审批页面又出问题了：

> 我点了通过，但客服页面刷新了。这个审批结果还能接回去吗？

> 开发小弟又补一刀：

> 如果主管连点两次，会不会提交两笔退款申请？如果用户在等待审批时订单已经发货了，还能按旧状态退款吗？

> 你意识到，第 30 课只是暂停。
> 第 31 课要处理恢复。

## 这次事故背后的 Agent 问题 审批恢复不是普通聊天续写。 它必须有自己的接口和校验：

| 问题 | 本课怎么处理 |
| --- | --- |
| 接哪条流程 | 用 `workflow_id` 定位 |
| 谁能恢复 | 用 `resume_token` 和 reviewer role 校验 |
| 恢复什么状态 | 从 checkpoint 读取冻结字段 |
| 事实是否变了 | 恢复时二次查询业务事实 |
| 会不会重复提交 | 用 `idempotency_key` 防重复 | 所以第 31 课第一次开放：

```latex
/chat/resume
```

它只服务 HITL 审批恢复。
它不是普通多轮聊天接口。
恢复要分成两层看。
第一层是流程运行时：流程暂停在哪里，恢复时应该从哪个节点继续。
第二层是业务协议：谁有资格恢复，恢复的是哪条 workflow，审批决定是否合法，订单状态有没有漂移，重复提交会不会造成第二笔申请。
如果只解决第一层，系统可能“能恢复”，但不一定“恢复得安全”。第 31 课关注的是第二层：把恢复入口、冻结字段、二次校验和幂等都放进业务边界。

## 技术机制：恢复到底在恢复什么 第 30 课解决的是“高风险动作先停下来等人”。 第 31 课要解决的是“人给出审批结果后，系统怎样安全地继续”。 这件事不能理解成普通多轮聊天里的“接着刚才说”。普通聊天依赖历史消息和当前上下文，审批恢复依赖的是流程状态、恢复凭证和业务事实。 你可以先把 Human-in-the-loop 的典型机制理解成：

```latex
流程运行到高风险节点 -> interrupt() 主动暂停 -> checkpointer 保存状态 -> 外部审批系统返回结构化决定 -> Command(resume=...) 把决定送回流程 -> 流程继续执行
```

这里有三个点最容易讲偏。
第一，checkpoint 不是日志。
日志回答“刚才发生过什么”，checkpoint 回答“流程现在可以从哪里继续”。它至少要能定位一条运行历史、保存当前 state、记录下一步该做什么。完整 LangGraph checkpoint 通常会和 `thread_id`、checkpoint id、state、下一步节点等信息关联；第 31 课的故事版不展开完整 durable checkpointer，而是用公开的 workflow checkpoint 演示同一个工程边界：

```latex
session_id + workflow_id -> 找回暂停的售后流程 -> 找回审批对象 -> 找回冻结字段 -> 找回恢复令牌和幂等键
```

它保存的是恢复所需的公开业务状态，不是完整聊天记录，也不是隐藏推理过程。
第二，resume 不是“从中断那一行后面继续”。
在 LangGraph 的 `interrupt()` 语义里，恢复时会从发生 `interrupt()` 的节点开头重新执行；再次走到同一个 `interrupt()` 时，`Command(resume=...)` 里的值才会作为返回值继续往下走。
这意味着：中断前面的代码可能被再次执行。
所以这里要记住一条工程规则：不要在 `interrupt()` 前放非幂等副作用。创建审批单、发通知、提交退款、写不可重复的审计记录，都不能假设“只执行一次”。如果确实要做，就必须用 upsert、唯一键或幂等键保护。
第 31 课的代码快照没有直接暴露 `Command(resume=...)` 给你，而是把受控恢复入口显式做成 `/chat/resume`。它表达的是同一层设计：

```latex
普通聊天入口 /chat -> 只能让流程暂停并返回待审批状态 审批恢复入口 /chat/resume -> 只接收结构化审批决定 -> 校验 workflow_id、resume_token 和 reviewer_role -> 通过 checkpoint 找回冻结状态 -> 复核业务事实 -> 用 idempotency_key 提交一次业务申请
```

第三，幂等不是前端体验优化。
按钮置灰只能减少重复点击，不能挡住浏览器重试、网络超时后的重复提交，也不能挡住审批系统重复回调。真正的幂等必须落在后端和业务系统能识别的稳定键上。
在这一课里，三个标识各有分工：

| 标识 | 解决的问题 | 不能替代什么 |
| --- | --- | --- |
| `workflow_id` | 找到哪条暂停的售后流程。

| 不能证明调用者有权限恢复。

|
| `resume_token` | 证明这次恢复拿到了暂停时发出的恢复凭证。

| 不能证明订单事实没有变化。

|
| `idempotency_key` | 让同一次审批恢复只产生同一个售后申请结果。

| 不能跳过角色校验和业务复核。

| 所以安全恢复要按顺序做：

```latex
先定位流程 再校验凭证和角色 再读取 checkpoint 冻结字段 再二次查询订单、支付、物流等业务事实 最后才按幂等键提交申请
```

任何一步缺失，都可能出现不同类型的事故：乱接流程、冒用审批、沿用过期事实，或者重复提交。

## 代码落地

### 当前 Agent 的实现边界 本节代码快照在：

```latex
code/agent-course-versions/lesson-31-resume-checkpoint-idempotency/backend/
```

这一课开始把恢复状态从 workflow 里拆出来：`state/checkpoints.py` 保存 checkpoint、冻结字段、业务事实二次校验和幂等提交；`api/routes.py` 则新增 `/chat/resume`，让审批恢复不再混在普通 `/chat` 里。
关键链路分成两段。
第一段是 `/chat` 暂停：

```latex
/chat -> AfterSaleWorkflow.run(request) -> build_approval_request(...) -> freeze_workflow_fields(...) -> save_checkpoint(session_id, workflow_id) -> ChatResponse(workflow_id, resume_token, idempotency_key)
```

第二段是 `/chat/resume` 恢复：

```latex
/chat/resume -> load checkpoint by session_id + workflow_id -> validate resume_token -> validate reviewer_role -> recheck_business_facts(frozen_fields) -> submit_after_sale_action(idempotency_key) -> ChatResumeResponse(resume_result, business_recheck)
```

这一课的核心不是“恢复能跑”。
而是“恢复不能乱接，也不能重复提交”。

### 核心代码拆解 `freeze_workflow_fields` 会在暂停时冻结这些字段：

```latex
workflow_id workflow_type order_id runtime_user_id order_status payment_status logistics_status amount policy_ids eligibility_status
```

这些字段代表审批时看到的业务事实。
恢复时，用户新发来的话不能覆盖它们。
`save_checkpoint` 用 `session_id + workflow_id` 保存公开 workflow 状态。这样 `/chat/resume` 不会从普通聊天历史里猜“刚才那个审批是什么”。
checkpoint 保存的是恢复所需的公开业务事实，不是完整聊天记录。
等待审批期间，用户可能继续问别的订单，也可能修改说法。最新 Memory 里的“这个订单”不能覆盖暂停时绑定的订单、金额、政策和资格判断。恢复时必须先回到 checkpoint，再决定是否继续。
这里还有一个很容易在 Python 代码里踩到的坑：冻结字段不能只是引用当前会话里的可变对象。
如果 checkpoint 里保存的是同一个 dict 或 list 的引用，后面用户继续聊天、系统继续更新 session state，暂停时的审批事实也可能被一起改掉。那就会出现很危险的事故：主管审批时看到的是订单 A，恢复时系统却拿着被覆盖后的订单 B 往下走。
所以 `freeze_workflow_fields` 表达的是“拷贝并冻结恢复所需的公开事实”，不是给当前状态起一个别名。课程代码不要求你在这里背深拷贝概念，但你要记住工程边界：

```latex
checkpoint 保存的是暂停那一刻的业务事实快照。 恢复时的新消息只能作为新输入，不能覆盖冻结字段。
```

`recheck_business_facts` 会在恢复时重新读电商系统里的业务事实。
故事课演示订单由电商后端补齐。正常未发货退款可以用 `SO20260601090000008-a1000008`；如果等待审批期间订单被真实业务系统推进到发货，恢复复核会读到 `SHIPPED`，而不是继续沿用暂停时的 `PENDING_SHIPMENT`。
这时即使审批人点了通过，系统也会阻断提交。
`submit_after_sale_action` 使用 `idempotency_key`。
第一次恢复会生成申请号。
第二次用同一个 workflow 和 token 恢复，会命中同一个幂等键，只返回原申请号，不重复提交。
幂等也不能只靠前端按钮置灰。
浏览器会重试，请求会超时，主管也可能重复点击。真正能防止重复提交的是后端和业务系统都识别同一个 `idempotency_key`：同一个 workflow 的同一次批准，只能对应同一个售后申请结果。

## 怎么验证恢复和重复提交都守住 按本课代码目录的 `README.md` 启动后端后，先发送：

```latex
SO20260601090000008-a1000008 未发货退款
```

你应该看到：
- `workflow.status = paused` + `workflow.workflow_id` + `workflow.resume_token` + `workflow.idempotency_key` + `workflow.frozen_fields.order_status = PENDING_SHIPMENT` 然后调用 `/chat/resume`：

```json
{
  "session_id": "lesson31-refund",
  "workflow_id": "...",
  "resume_token": "...",
  "reviewer_id": "manager-01",
  "reviewer_role": "after_sale_manager",
  "decision": "approved"
}
```

你应该看到：
- `status = completed` + `business_recheck.passed = true` + `resume_result.request_id` 有值 + 再调用一次会出现 `idempotent_replay = true`

## 本节知识总结 恢复、checkpoint 和幂等解决的是“暂停后的流程怎么安全接回来”。 只要流程中间停下来等人、等系统、等外部回调，就不能假设下一次请求天然接得上。恢复时必须知道恢复的是哪个流程、谁有资格恢复、暂停时保存了哪些事实、这些事实有没有漂移，以及重复点击会不会造成重复提交。 这类问题不只出现在退款审批。开户、合同审批、权限变更、支付确认、工单升级，只要有暂停和恢复，都要考虑同一组边界。

| 知识点 | 核心概念 | 小哲项目里的落点 |
| --- | --- | --- |
| Resume 接口 | 恢复高风险流程应该走专门接口，不能混进普通聊天。

| `/chat/resume` 用来接回 HITL 审批结果。

|
| `workflow_id` | 恢复时要定位具体暂停流程。

| 小哲用它找到原来的售后 workflow。

|
| `resume_token` | 恢复需要防冒用凭证，不能只靠流程 ID。

| 防止别人拿到 `workflow_id` 就恢复退款流程。

|
| Checkpoint | 暂停时保存恢复所需的公开流程状态和关键事实；它不是普通日志。

| 保存订单、金额、政策、资格和暂停节点。

|
| 冻结字段 | 高风险事实恢复时不能被新消息随意覆盖。

| 恢复时不让用户新话术改掉订单、金额或政策依据。

|
| 业务事实二次校验 | 恢复前要确认外部事实没有漂移。

| 审批通过前重新确认订单状态没有变化。

|
| Resume 重执行风险 | 在 LangGraph `interrupt()` 语义里，恢复会从中断节点开头重跑，前置副作用必须谨慎。

| 把业务提交放到受控恢复阶段，并用幂等键保护。

|
| 恢复分层 | 流程运行时负责停在哪，业务协议负责谁能恢复和能否执行。

| `/chat/resume` 校验 token、角色、冻结字段、事实漂移和决策。

|
| 幂等 | 重复恢复或重复点击不能造成重复提交，不能只靠前端按钮置灰。

| 同一次审批恢复命中同一申请，不重复提交退款。

|

## 第七幕收束：流程稳了，但上下文开始不安分 到这里，老板最怕的事情终于被压住了。 Agent 不会因为一句自然语言自动动钱。 它知道先查事实，再进流程，再等人工审批，再用 checkpoint 和幂等恢复。 但你心里没有完全放松。 因为用户不会只说一轮话。 他们会说：

```latex
就刚才那个订单。 我其实是 VIP。 上次客服说可以退。 你记得我前面说过的地址吧？
```

流程已经稳住了。
可多轮聊天、用户身份、历史上下文和用户自述会继续制造麻烦。
小哲心里隐隐觉得：

> 流程稳住以后，上下文污染和记忆边界，才是真正的新坑。

> > 代码同步说明：从本课开始，课程快照会尽量使用真实 OpenAI 兼容大模型生成最终客服话术。Tool、RAG、Workflow、Runtime Context 和安全模块先产出受控事实与边界，模型负责把这些事实组织成自然回复；只有模型不可用、测试隔离、低置信或安全边界触发时，才回退到确定性话术。
> >
