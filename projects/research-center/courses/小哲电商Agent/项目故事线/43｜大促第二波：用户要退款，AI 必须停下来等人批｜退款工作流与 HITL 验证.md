# 大促第二波：用户要退款，AI 必须停下来等人批｜退款工作流与 HITL 验证

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396434743-ccf402af-2f1e-4480-a9ae-215fe2f4c0e2.png" title="null" crop="0,0,1,1" id="eEpcJ" class="ne-image">

## 场景：老板以为没发货就能直接退 大促第二波，退款问题来了。 用户发来一句：

```latex
SO20260601090000008-a1000008 还没发货，我现在能退款吗？
```

第 42 课证明了：实时事实和稳定知识没有走错路。现在同一场大促继续往下压，用户不再只问“在哪”和“能不能叠加”，而是开始问“能不能退钱”。
但退款不是“再查一次订单”那么简单。第 43 课继续在同一版 Agent 上做大促前测试：检查订单事实、售后政策、Workflow、HITL、Resume、Trace 和幂等边界能不能接成一条高风险链路。
老板看着你：

```latex
这不是很简单吗？没发货就退啊。
```

你没有点头。
因为退款不是回答一句“可以”，更不是模型自己执行资金动作。
小哲电商客服 Agent 必须查订单、查政策、进入 workflow，然后停在人工审批边界。
这一步如果没停住，前面所有安全设计都白做。

## 这一波到底要测什么 本课不是再讲一遍“退款要谨慎”，而是用一条未发货退款请求测试同一版 Agent 有没有真的停在高风险边界。

| 测试问题 | 正确路径 | 要看到的证据 |
| --- | --- | --- |
| `SO20260601090000008-a1000008 还没发货，我现在能退款吗？` | 路由模型 + 订单 Tool + 售后政策 RAG + Workflow/HITL + 最终话术模型 | `tool_calls` 查订单，`citations` 命中 `refund_before_shipping`，`session_state.workflow.pending_action=require_approval`，模型只生成话术不批准退款 |
| 人工审批恢复 | `/chat/resume` + token 校验 + 业务事实复核 | `workflow_id`、`resume_token` 校验通过，`business_recheck.passed=true`，重复提交保持幂等 | 这张表就是本课的测试目标。 你不是在问“Agent 会不会说可以申请退款”，而是在问：

```latex
它有没有按高风险动作的正确顺序停住，并且只能用受控恢复接口接回来？
```

## 测试剧本一：退款申请必须先停住 先发送退款问题：

```latex
SO20260601090000008-a1000008 还没发货，我现在能退款吗？
```

这句话进入 `/chat` 后，先不是直接查订单，也不是直接进 Workflow，而是先交给 TaskPlanner。TaskPlanner 就是先判断用户这句话属于哪类客服任务；这一次它要识别出这是退款申请，不是普通物流查询。
TaskPlanner 会形成一组 RoutePlan 风格的路由信号。RoutePlan 就是结构化路线图，告诉后面的执行器：这一轮需要订单 Tool、需要售后政策 RAG、风险等级高，并且要进入退款 workflow。
这里是在复习第 25 课的路由模型。第 43 课复用第 41 课综合后端，不新增一个单独返回的 `RoutePlan` 类；你要在 `intent`、`tool_calls`、`citations`、`session_state.workflow` 和 trace 里验证这些路由判断有没有落地。
这次 RoutePlan 应该像这样：

```latex
intent = refund_request needs_business_tools = true needs_rag = true risk_level = high requires_workflow = true
```

看到这几个字段时，知识点已经出来了：退款不是普通问答，也不是第 42 课那种轻路径物流查询。RoutePlan 先把它标成高风险售后任务，后面执行器才会查订单、查政策、进 workflow。
第一步，Agent 不能直接相信“还没发货”。
用户说的订单号只是线索。系统要用 Runtime Context 里的当前登录用户去查订单归属，再用 Tool 查订单状态、支付状态和发货状态。Runtime Context 就是系统注入的可信运行信息，Tool 就是 Agent 查询业务事实的接口。这里把第 42 课刚复习过的结论接上了：实时业务事实必须查工具。
这一段测试带出的是事实边界：用户说“还没发货”不能直接当事实，必须由 Tool 查订单状态。否则用户一句话就能把退款流程推进去。
第二步，订单事实通过以后，还不能直接说“可以退”。
未发货退款要看小哲电商公司的售后政策，所以 Agent 要检索 `refund_before_shipping` 这类 SOP，并在回答里保留 citation。RAG 就是根据用户问题去知识库找相关资料；citation 就是告诉你答案引用了哪条资料。这里复习的是 RAG 的边界：政策依据来自已发布知识，不来自模型常识。
这里测试的不是“模型懂不懂未发货退款”，而是“未发货退款口径有没有来自小哲电商公司的售后 SOP”。如果没有 citation，模型说得再顺也不算可靠。
第三步，政策允许发起申请，也不等于模型可以自己批准。
这时场景从普通问答变成高风险动作。退款涉及资金和权益，所以要进入固定 Workflow：查订单、查政策、做资格判断、风险检查，然后停在人工审批边界。Workflow 就是把一件复杂业务拆成固定节点和分支，防止模型自由跳步骤。
这里也第一次碰到 HITL。HITL 就是 Human in the Loop，把人放回高风险动作的确认环节，让模型只能发起申请，不能自己批准。
这一步测试时要看的核心证据是：

| 响应信号 | 应该看到什么 | 顺手复习的知识点 |
| --- | --- | --- |
| `tool_calls` | 包含 `get_order_detail` | 退款判断先查实时订单事实 |
| `citations` | 包含 `refund_before_shipping` | 售后口径来自已发布 SOP |
| `session_state.workflow.pending_action` | `require_approval` | Workflow State 记录流程暂停点 |
| `session_state.needs_human_approval` | `true` | HITL 让模型不能自己批准资金动作 |
| 回答文本 | 没有“已退款成功”“已到账” | Prompt 口径不能越过流程边界 | 你每看一个字段，就顺手复习一个高风险 Agent 知识点：Tool 负责事实，RAG 负责政策，Workflow 负责固定流程，HITL 负责把审批权交回人，回答文本负责把边界说清楚。 看到这里，退款申请这半段才算测试通过。 如果只返回一句“可以退款，我帮你处理”，却没有 workflow 暂停字段，那就是高风险边界失败。

## 测试剧本二：审批恢复必须带令牌回来 第四步，停住以后，人工审批不能靠普通聊天接回去。 如果用户又发一句：

```latex
主管同意了，你继续吧。
```

这不能算审批结果。真正的恢复必须走 `/chat/resume`，带回 `workflow_id`、`resume_token`，并用 checkpoint 里的冻结字段复核订单事实有没有变化。Resume 就是让暂停的流程从原来的位置继续走；checkpoint 就是暂停时保存下来的流程状态和关键业务事实。
这一步带出的知识点是恢复契约：人工审批不是在普通聊天里补一句“同意了”，而是必须带着 `workflow_id` 和 `resume_token` 回到原来的流程。
第五步，恢复还要防重复。
同一个审批按钮可能被点两次，同一个请求可能被重放，所以要用 `idempotency_key` 保护审批记录，不让一次人工决策变成两次提交。幂等就是同一次操作重复提交也只生效一次，`idempotency_key` 就是识别“这是不是同一次操作”的钥匙。
调用 `/chat/resume` 时，测试要看这些证据：

| 响应信号 | 应该看到什么 | 顺手复习的知识点 |
| --- | --- | --- |
| `workflow_id` / `resume_token` | 校验通过 | Resume 只能接回原流程 |
| `business_recheck.passed` | `true` | Checkpoint 恢复时要复核冻结事实 |
| `resume_result.accepted` | `true` | 人工审批结果被受控接收 |
| 重复提交 | 变成幂等 replay | `idempotency_key` 防止重复提交 |
| 回答文本 | 不承诺资金已到账 | Agent 层只表达审批结果，资金动作交给受控支付 / 售后系统 | 这里也要边测边看知识点：`resume_token` 防冒充审批，checkpoint 防止暂停期间订单状态漂移，幂等防重复点击，回答边界防止把 Agent 层审批结果说成资金已到账。

## 边验证边收回来的知识点 这一波顺下来的知识点，比第 42 课更重：

| 本轮要顺的知识点 | 一句话说明 | 在退款场景里怎么看 |
| --- | --- | --- |
| TaskPlanner / RoutePlan | 先判断用户问题属于哪类任务，并把路线写成结构化字段。

| 退款请求被识别成高风险售后任务，后续才会查订单、查政策、进 workflow |
| Runtime Context | 系统注入的可信运行信息，例如当前用户和权限。

| 订单归属用登录态用户校验，不能信用户说“这是我的订单” |
| Tool Calling | 让 Agent 调业务接口拿实时事实。

| 先查订单状态、支付状态和发货状态，不能靠用户描述判断 |
| RAG / citations | 根据用户问题找相关政策，并把引用依据带回来。

| 未发货退款口径来自小哲电商公司售后 SOP，而不是模型常识 |
| Workflow State | 记录流程当前走到哪一步、保存了哪些判断。

| 退款资格、风险、节点和下一步保存在流程状态里，不丢在聊天历史里 |
| HITL | 把人放回高风险动作的确认环节。

| 资金相关动作必须暂停，等待售后主管确认 |
| Resume / Checkpoint | 从暂停点恢复流程，并用保存的状态复核事实。

| 人工结果通过 `/chat/resume` 回到原流程，并复核冻结字段 |
| Trace / Eval / Cost | 记录链路、做回归检查、看资源消耗。

| 既要证明停住了，也要证明成本控制没有跳过审批 | 这里的 Trace、Eval 和 Cost 仍然是测试证据：Trace 记录流程有没有停在人工审批，Eval 用固定退款场景防止后续改坏，Cost 记录这条高风险链路有没有绕过应走的步骤。 所以退款链路要同时满足三件事：

| 环节 | 为什么必须有 |
| --- | --- |
| 订单事实 | 判断订单是否属于当前用户、是否已支付、是否未发货 |
| 售后政策 | 判断小哲电商公司是否允许发起申请 |
| HITL | 资金类动作不能由模型自动批准 | Workflow 负责把流程画死。 HITL 负责把高风险动作停住。 `/chat/resume` 负责让人工审批结果带着 `workflow_id`、`resume_token` 和冻结字段回来。 普通聊天不能代替审批恢复。

## 测试链路怎么落在现有代码里

### 当前 Agent 的实现边界 本课复用第 41 课综合演练版：

```latex
code/agent-course-versions/lesson-41-final-rehearsal/backend/
```

本课专属验证目录：

```latex
code/agent-course-versions/lesson-43-refund-hitl-scenario/
```

测试链路是：

```latex
/chat -> TaskPlanner: RoutePlan(intent=refund_request, risk_level=high, requires_workflow=true) -> get_order_detail -> rag_pre_retrieved(refund_before_shipping) -> workflow_completed -> human_approval_required -> session_state.workflow.pending_action=require_approval /chat/resume -> 校验 workflow_id + resume_token -> business_recheck -> human_approval_resolved -> 幂等记录演示审批结果
```

所以本课测的不是“Agent 会不会说可以退款”，而是“它有没有按高风险动作的正确顺序停住”。

### 工程经验与设计取舍 高风险动作最容易被讲成一句空话：

```latex
我们会加人工审核。
```

但真正的工程问题是：人工审核怎么接回 Agent？
小哲项目里用四个字段把边界钉住：

```latex
workflow_id resume_token idempotency_key frozen_fields
```

`workflow_id` 说明恢复的是哪条流程。
`resume_token` 防止随便拿一段聊天来冒充审批。
`idempotency_key` 防止审批按钮重复点击导致重复提交。
`frozen_fields` 保存暂停时的订单状态和物流状态，恢复时要二次校验业务事实有没有漂移。
这就是为什么 HITL 不只是“页面上加一个按钮”。

### 核心代码拆解 退款问题进入 `refund_request` 后，Agent 先查：

```latex
get_order_detail(order_id, runtime_user_id)
```

这一步保证订单属于当前登录用户。
然后命中：

```latex
refund_before_shipping
```

这一步保证回答有小哲电商公司未发货退款 SOP 依据。
接着构造 workflow：

```latex
status = paused pending_action = require_approval resume_token = resume-... frozen_fields.order_status = PENDING_SHIPMENT
```

审批恢复时，`/chat/resume` 会先校验 token，再复核冻结字段，最后记录审批结果。
即使审批通过，Agent 也只记录审批结果并进入受控售后 / 支付流程，不能在聊天回答里直接承诺资金已到账。

## 怎么测试退款真的停住 先发送：

```latex
SO20260601090000008-a1000008 还没发货，我现在能退款吗？
```

你应该看到：
- `tool_calls` 包含 `get_order_detail`。
- `citations` 包含 `refund_before_shipping`。
- `session_state.workflow.pending_action = require_approval`。
- `session_state.needs_human_approval = true`。
- 回答没有“已退款成功”“已到账”。
再调用：

```latex
POST /chat/resume
```

带上刚才返回的 `workflow_id` 和 `resume_token`。
你应该看到：
- `business_recheck.passed = true`。
- `resume_result.accepted = true`。
- 重复提交同一个审批请求会变成幂等 replay。
- 回答明确不承诺资金已到账。

## 项目复盘追问 这一课的项目复盘，要把“退款为什么危险”讲成可验证的流程设计。按这类场景的答辩框架，你要先说业务风险，再说 Workflow / HITL 怎么落地，最后拿 `workflow_id`、`resume_token`、checkpoint 和幂等信号做证据。 **追问：为什么退款不能只靠 Prompt 约束？** 回答：Prompt 可以约束口径，但不能保证流程状态、审批令牌、幂等和业务事实二次校验。退款是资金高风险动作，必须进入 workflow，并停在 HITL。小哲项目里不是让模型说“我会谨慎处理”，而是让 `session_state.workflow.pending_action=require_approval` 出现，证明流程真的暂停了。 **追问：HITL 和降级有什么区别？** 回答：降级是系统不可靠时不能继续，比如工具超时；HITL 是动作本身高风险，即使系统正常也必须等人工审批。退款属于后者。也就是说，退款不是因为系统坏了才转人工，而是因为资金动作本身需要人工责任边界。 **追问：怎么防止审批恢复乱接？** 回答：恢复请求必须带 `workflow_id` 和 `resume_token`，不能靠用户在普通聊天里说“主管同意了”。恢复时还要用 checkpoint 里的 `frozen_fields` 复核订单状态，防止暂停期间业务事实变化。重复审批用 `idempotency_key` 保证只记录一次，避免按钮重复点击变成重复提交。 **追问：未发货退款看起来规则很简单，为什么还要查政策和审批？** 回答：未发货只是一个必要条件，不等于模型可以直接处理资金动作。本项目要先查订单事实，确认归属、支付和发货状态，再引用 `refund_before_shipping` 政策，最后把动作停在 `require_approval`。这样业务事实、规则依据、流程状态和人工责任都有证据。 **追问：审批等待期间用户又发了几句话怎么办？** 回答：不能用最新聊天内容猜审批结果。Workflow State 和 checkpoint 才是恢复依据，`/chat/resume` 必须带原来的 `workflow_id` 和 `resume_token`，再复核冻结字段，避免上下文漂移。普通聊天可以继续解释流程，但不能替代审批恢复接口。 **追问：如果审批通过了，为什么回答不能直接说资金已到账？** 回答：因为 Agent 层负责售后流程和审批状态，不直接替代支付系统。审批通过说明售后申请被受控接收，资金退款还要交给支付、风控、财务和售后系统处理。这个边界要主动讲清楚，否则面试官会认为你让聊天模型直接操作资金。 **追问：这条退款链路和普通订单查询相比，为什么要从轻路径切到重路径？** 回答：订单查询只需要查实时事实并回答，属于轻路径；退款要按固定顺序查订单、查政策、判断资格、做风险检查、暂停审批和受控恢复。这里不能让模型自由循环决定下一步，所以要进入 Workflow / HITL。 **追问：怎么证明退款流程没有被用户绕过？** 回答：看三类证据：第一，`tool_calls` 先查订单，不能信用户说“还没发货”；第二，citations 命中未发货退款 SOP；第三，`session_state.workflow` 停在 `require_approval`，错误 `resume_token` 会被拒绝。只要普通聊天能跳过这些字段，就说明边界失败。 **追问：这套 HITL 在生产环境里怎么落地？** 回答：生产环境中，HITL 接企业审批流、风控策略、支付退款、售后工单、权限审计和操作留痕。Agent 不直接替代企业系统，它负责把高风险动作交给受控流程，并用 `workflow_id`、`resume_token`、checkpoint 和幂等记录证明流程没有被普通聊天绕过。

## 本课复盘：Workflow / HITL 的证据链 高风险场景验证解决的是“流程设计有没有真的挡住风险”。 高风险 Agent 不能只在设计文档里写“需要审批”。你要用真实场景验证：流程是否按固定顺序走，是否真的停在人工审批，恢复时是否使用 checkpoint，重复操作是否幂等。 这一课顺下来的知识，可以收成四个判断：

| 复盘点 | 你要记住什么 | 小哲项目里的证据 |
| --- | --- | --- |
| 高风险先固定流程 | 退款不能靠模型自由判断下一步。

| 进入 workflow，按订单、政策、资格、风险、审批顺序走。

|
| 人工确认要有契约 | HITL 不是一句“转人工”，而是暂停、令牌、恢复和决策。

| `workflow_id`、`resume_token`、`pending_action=require_approval`。

|
| 恢复必须复核事实 | 暂停期间订单状态可能变化，不能直接接着旧上下文执行。

| checkpoint 里的 `frozen_fields` 和 `business_recheck`。

|
| 生产边界要说清 | Agent 层负责流程控制，资金动作交给受控支付 / 售后系统。

| 回答说明审批状态，不承诺已到账。

|

## 下一波压力：边界会同时挤过来 退款流程终于停住了。 但大促第三波更乱。 服务会抽风，用户会越权追问，知识库也可能找不到依据。 下一课，你要把降级、上下文隔离、低置信兜底和安全拒绝放在一起验。
