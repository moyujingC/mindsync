# 大促第一波：物流和活动规则必须走对路｜Tool 与 RAG 场景验证

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396434584-8f422a86-717f-4e97-82ba-27fed175fbea.png" title="null" crop="0,0,1,1" id="PqN0T" class="ne-image">

## 场景：两类问题同时挤进客服群 大促第一波流量进来后，客服群里最先炸的是两类问题：

```latex
我的 SO20260602103000009-a1000009 到哪了？ 618 满减和金卡会员券能叠加吗？
```

这两句话看起来都像“客服问答”。
但你知道，它们不能走同一条路。
从第 42 课开始，课程不再从零新增一个模块，而是进入第十幕大促前测试。第 41 课已经把前面做过的能力合到同一版 Agent 里；现在要一波一波验证它有没有按工程边界工作。
第一波要验证的是最基础、也最容易混的边界：

```latex
实时业务事实，要查 Tool。 已发布业务规则，要查 RAG。
```

物流状态可能五分钟前刚变，不能让模型凭经验猜。
活动和会员规则代表小哲电商公司对外发布的口径，不能让模型现场编。
如果这两类问题走错路，回答偶尔也可能看起来顺，但系统已经不可靠了。

## 这一波到底要验什么 本课不是再讲一遍 Tool 和 RAG 的定义，而是用两个真实客服问题验同一版 Agent 有没有走对路径。

| 用户问题 | 正确路径 | 要看到的证据 |
| --- | --- | --- |
| `我的 SO20260602103000009-a1000009 到哪了？` | 订单和物流 Tool | `tool_calls` 包含 `get_order_detail`、`get_order_logistics`，`citations` 为空 |
| `618 满减和金卡会员券能叠加吗？` | 活动和会员规则 RAG | `citations` 包含 `promotion_618_stack_rule`、`member_coupon_gold_rule`，不调用物流工具 |
| `电子发票通常多久能准备好？` | 路由模型 + FAQ RAG + 最终话术模型 | 有模型配置时，`cost_summary.model_calls.route_planner=1`、`final_answer=1`，引用仍来自 `invoice_issue` | 这张表就是本课的验证目标。 你不是在问“Agent 会不会回答”，而是在问：

```latex
它回答之前，证据来源有没有走对？
```

这里特意放一个 FAQ 模型调用题，是为了防止你误以为这版 Agent 只是规则路由。Tool、RAG 和 Workflow 负责给出受控事实；模型配置可用时，路由模型负责判断该走哪条受控路径，最终话术模型负责把证据组织成自然客服回复。

## 测试剧本一：物流必须查实时业务事实 先发送物流问题：

```latex
请帮我查一下 SO20260602103000009-a1000009 的物流
```

这句话进入 `/chat` 后，第一步不是让模型直接回答“正在运输中”。
它要先进入任务判断。这里复习 TaskPlanner：TaskPlanner 就是先看用户这句话属于哪类客服任务，比如物流查询、活动规则、退款申请还是普通闲聊。
TaskPlanner 判断完以后，会形成一组 RoutePlan 风格的路由信号。RoutePlan 就是结构化路线图，里面写清楚本轮要不要查 Tool、要不要走 RAG、风险等级高不高、是否可能进入 workflow。
这里是在复习第 25 课的路由模型。第 41 课综合后端没有单独返回一个名叫 `RoutePlan` 的对象；它把这些判断压到 `intent`、`tool_calls`、`citations`、`session_state` 和 trace 这些可观察字段里。你读第 42-45 课时，要把 RoutePlan 当成复盘语言，而不是去场景目录里找一个新的 `RoutePlan` 类。
这次 RoutePlan 应该像这样：

```latex
intent = order_query needs_business_tools = true needs_rag = false risk_level = low
```

看到这几个字段时，知识点已经出来了：TaskPlanner 不是替用户回答问题，而是在回答前先把任务分路；RoutePlan 也不是一段自然语言判断，而是后续执行器可以稳定读取的结构化路线。
接下来，Agent 还不能只相信用户说“我的订单”。
订单归属要看 Runtime Context。Runtime Context 就是系统在本轮对话里注入的可信运行信息，例如当前用户是谁、请求来自哪里、有哪些权限。这里真正要用的是登录态里的 `runtime_user_id`，不是用户自己说“这是我的订单”。
这一段测试带出的是身份边界：用户输入可以提供线索，但不能提供权限。订单查询如果绕过 Runtime Context，就算 Tool 调对了，也可能把别人的订单信息答出去。
确认当前用户以后，物流这种实时事实必须查 Tool。Tool Calling 就是让 Agent 调用业务系统接口去拿实时事实，而不是让模型凭记忆猜。
这轮应该出现两个工具调用：

```latex
get_order_detail(order_id, runtime_user_id) get_order_logistics(order)
```

你测试时要看的不是回答文案有多像客服，而是响应里有没有这些证据：

| 响应信号 | 应该看到什么 | 顺手复习的知识点 |
| --- | --- | --- |
| `tool_calls` | `get_order_detail`、`get_order_logistics` | Tool 是实时事实来源 |
| `citations` | 空 | 物流当前状态不能靠 RAG 文档回答 |
| trace | `tool_finished`、`cost_recorded` | Trace 记录公开执行摘要，不靠截图猜链路 |
| `cost_summary.path_type` | `light_react_agent` | Cost 记录本轮走的是轻路径 | 这张表不是测试结果清单那么简单。 你每看一个字段，就顺手复习一个 Agent 工程知识点：`tool_calls` 证明实时事实来自工具，`citations` 为空证明没有把物流当知识库规则查，trace 证明链路可复盘，cost summary 证明这轮没有被错误升级成重路径。 看到这里，你就能判断第一条路径有没有走对。 如果物流问题没有 `tool_calls`，而是出现了活动规则 citation，说明路由错了。 如果物流工具失败了，Agent 也不能猜状态；那是第 44 课要验的降级问题。

## 测试剧本二：活动规则必须有知识依据 再发送活动问题：

```latex
618 大促满减和金卡会员券能不能叠加？
```

这句话不是问某个订单现在在哪里。
它问的是小哲电商公司已经发布的活动和会员规则。
所以这轮 RoutePlan 应该换成：

```latex
intent = promotion_query needs_business_tools = false needs_rag = true risk_level = low
```

这一步带出的知识点是路由分层：同样从 `/chat` 进来，物流问题要打开业务工具，活动问题要打开知识检索。Agent 不是靠一个万能回答器处理所有问题，而是在回答前先决定证据来源。
这里复习 RAG：RAG 就是根据用户问题去知识库里找到相关资料，再把资料交给模型组织回答。
但 RAG 不是“给模型多塞一点背景”这么粗。
在客服 Agent 里，RAG 要解决的是公司规则可追踪。回答里应该带回 citations。citations 就是回答里的依据标签，告诉你这句话参考了哪条规则或哪份知识。
所以这里测试的不是“模型会不会解释满减”，而是“解释满减时有没有拿到小哲电商公司的规则依据”。这正好把 RAG 和 citations 的知识点从概念拉回场景。
这轮应该看到两条引用：

```latex
promotion_618_stack_rule member_coupon_gold_rule
```

你测试时要看的证据是：

| 响应信号 | 应该看到什么 | 顺手复习的知识点 |
| --- | --- | --- |
| `tool_calls` | 空 | 活动规则不是实时物流状态，不需要查物流工具 |
| `citations` | `promotion_618_stack_rule`、`member_coupon_gold_rule` | 已发布规则要有来源 |
| trace | `rag_pre_retrieved` | Trace 能说明知识检索真的发生过 |
| 回答文本 | 不乱承诺、不编不存在的叠加规则 | Prompt 角色边界约束客服口径 | 这里也要边测边看知识点：`tool_calls` 为空说明活动规则没有误走实时工具，`citations` 命中说明回答有公司规则依据，`rag_pre_retrieved` 说明知识检索发生在回答前，回答文本则检查 Prompt 角色边界有没有守住。 如果活动问题没有 citation，而是模型直接说“按平台规则可以叠加”，这就不是验证通过。 因为小哲电商客服 Agent 不是在猜一个通用电商平台规则。 它要对小哲电商公司已经发布的规则负责。

## 测试链路怎么落在现有代码里 本课复用第 41 课综合演练版：

```latex
code/agent-course-versions/lesson-41-final-rehearsal/backend/
```

本课专属验证材料在：

```latex
code/agent-course-versions/lesson-42-tool-rag-scenario/scenario_tool_rag.json
```

这节课不新增后端能力。
它只拿同一版 Agent 跑两条场景测试：

```latex
物流问题 -> /chat -> RoutePlan(intent=order_query, needs_business_tools=true) -> get_order_detail -> get_order_logistics -> tool_calls + trace + cost_summary 活动/会员问题 -> /chat -> RoutePlan(intent=promotion_query, needs_rag=true) -> rag_pre_retrieved -> citations: promotion_618_stack_rule, member_coupon_gold_rule -> trace + cost_summary
```

配套验证真正检查的是类似这样的断言：

```latex
物流 case：tools == ["get_order_detail", "get_order_logistics"] 活动 case：citations == ["promotion_618_stack_rule", "member_coupon_gold_rule"] 两类 case：trace 里都有 cost_recorded
```

这里的关键不是“代码里有没有两个分支”，而是同一入口 `/chat` 能不能根据用户问题选择正确事实来源。

## 边验证边收回来的知识点 这一课把前面学过的能力收回到两个场景里。

| 知识点 | 一句话说明 | 在本课怎么被验证 |
| --- | --- | --- |
| `/chat` 响应契约 | 前后端约好的返回格式，让页面和验证脚本都知道去哪拿结果。

| 同一个响应里检查 `answer`、`tool_calls`、`citations`、`session_state` 和 trace |
| TaskPlanner / RoutePlan | 先判断任务类型，再把执行路线写成结构化字段。

| 物流进入订单工具链路，活动规则进入 RAG 知识链路 |
| Runtime Context | 系统注入的可信运行信息，例如当前用户和权限。

| 查订单时使用 `runtime_user_id`，不信用户自称 |
| Tool Calling | 调业务系统接口拿实时事实。

| 物流必须出现订单和物流工具调用 |
| RAG / citations | 查已发布知识，并把引用依据带回来。

| 活动和会员规则必须返回规则 ID |
| Prompt 角色边界 | 让模型稳定扮演小哲电商客服，并知道哪些话不能乱承诺。

| 回答不能编物流、不能编活动规则 |
| Trace / Eval / Cost | 记录链路、做回归检查、看资源消耗。

| 测试时不只看最终回答，还看路径证据和成本路径 | 你可以把本课的结论收成三句话：

```latex
订单、物流、库存是实时业务事实，要查 Tool。 活动、会员、FAQ、售后 SOP 是已发布知识，要查 RAG。 高风险退款、退货、补偿不能只回答，要进入 Workflow/HITL。
```

第 42 课只验前两句。
第三句留给下一波退款压力。

## 项目复盘追问 这一课的项目复盘，不要背成“我集成了 Tool 和 RAG”。 你要把刚才的验证证据翻译成一句项目能力：

```latex
我做的是 fact-source-aware routing：实时交易事实走业务 Tool，已发布公司知识走 RAG，并用 tool_calls、citations、trace 和成本摘要做路径级验证。
```

这组复盘问题可以按四层准备：

| 层次 | 复盘时真正要讲清楚什么 | 本课能拿出的证据 |
| --- | --- | --- |
| 基础分工 | Tool、RAG、Runtime Context 分别解决什么问题。

| 物流走订单工具，活动规则走 RAG，订单归属看 `runtime_user_id`。

|
| 路由执行 | 模型、RoutePlan、工具调用和知识检索怎么协作。

| 物流 `needs_business_tools=true`，活动 `needs_rag=true`。

|
| 质量验证 | 怎么证明不是“答得像”，而是真的路径正确。

| `tool_calls`、`citations`、trace、cost summary。

|
| 生产治理 | 如果规则变、工具坏、问题混合，系统怎么继续可靠。

| 路径分层、低置信兜底、知识版本、企业系统替换边界。

| **追问：为什么物流不能走 RAG？** 回答：物流是实时交易事实，不是文档知识。它必须通过订单和物流工具查询，RAG 最多保存服务口径，不能当作订单当前状态来源。本课里我用 `tool_calls` 证明 SO20260602103000009-a1000009 走了 `get_order_detail` 和 `get_order_logistics`。 **追问：为什么不把活动规则也做成 Tool？** 回答：核心看规则来源和更新方式。活动和会员规则如果是已发布文本，适合进 RAG，并保留 citation，便于追踪规则依据；如果生产环境里活动规则来自实时配置中心，那可以做 Tool。本课这条测试验证的是“已发布规则文本走 RAG，不让模型现场编”。 **追问：Tool 是不是模型自己在执行？** 回答：不是。模型只提出要查什么，真正的 I/O 由 Agent Runtime 和工具层执行。这样模型不会直接拥有业务系统权限，订单、物流、库存这类实时事实都通过受控工具返回。 **追问：为什么订单归属还要看 Runtime Context？用户都给订单号了。** 回答：订单号只是线索，不是权限证明。Runtime Context 里的 `runtime_user_id` 才是系统可信的当前用户。物流查询要用当前用户校验订单归属，不能因为用户说“这是我的订单”就返回订单信息。 **追问：怎么证明 Tool 和 RAG 分工真的生效？** 回答：我不只看 answer，而看路径证据。物流场景要有订单和物流工具调用，且 `citations` 为空；活动场景要有目标规则 citation，且不调用物流工具。trace 里还要能看到工具完成、知识预检索和成本记录。这样验证的是路径正确，不只是话术像客服。 **追问：Tool 返回成功，就能直接把结果交给用户吗？** 回答：不一定。Tool success 只说明事实获取成功，最终回答还要受客服口径和风险边界约束。比如查到物流状态以后，Agent 可以解释物流进度，但不能顺手承诺赔偿、退款或改地址。 **追问：Tool observation 为什么要摘要化，不能把接口原文全塞给模型吗？** 回答：不能。接口原文可能有冗余字段、内部状态和隐私信息，直接塞给模型会增加 token 成本和泄露风险。更稳的做法是把工具结果整理成回答需要的状态、节点、风险和下一步建议。 **追问：Planner 为什么容易 over-plan，你怎么防？** 回答：over-plan 往往是把低风险单步查询误升级成复杂任务。这里用 RoutePlan 约束它只判断是否需要业务工具、RAG 和风险流程；执行器再按工具组过滤、缺参澄清和风险分流。最后用 trace 和 cost summary 检查物流这种轻路径有没有被误跑成重链路。 **追问：路由层分错路怎么办？** 回答：我会先把它当成 routing defect，而不是只改回答 Prompt。排查时看 RoutePlan 和 trace：物流问题没进订单工具链路，说明意图识别或规则路由有问题；活动问题没触发 RAG，说明知识路径 gating 没生效。修复后要补对应场景样例做回归。 **追问：如果一个问题既问物流又问活动优惠怎么办？** 回答：要做 source decomposition，把问题拆成不同证据来源。物流部分查订单和物流 Tool，活动优惠部分查 RAG 规则，最后可以合成回答，但 Tool 事实和 RAG 规则不能互相冒充。 **追问：RAG 返回了 citation，就一定说明答案正确吗？** 回答：不一定。citation 解决的是可追踪，不自动保证答案忠实。还要看引用是不是目标规则、有没有混入相邻规则、回答有没有把条件说错。本课的活动场景至少要命中 `promotion_618_stack_rule` 和 `member_coupon_gold_rule`，不能拿别的售后政策冒充活动规则。 **追问：如果活动规则没有命中，能不能让模型凭经验回答？** 回答：不能。活动规则是小哲电商公司的 company-specific policy，没有 citation 就不能承诺。低置信时应该说明当前没有找到可信规则，建议查看活动页或转人工确认，而不是编一条“平台通常可以叠加”。 **追问：RAG 最难的问题是什么？** 回答：最难的不是接向量库，而是 citation quality 和规则消歧。活动规则、会员券规则、售后政策语义很近，用户表达又很口语化。要避免召回相邻规则后被模型串用，所以测试时要看目标规则命中、错误引用控制和回答是否忠实使用证据。 **追问：TopK、threshold、reranker 这些参数怎么调？** 回答：按检索指标和场景样例调，不按单次回答观感调。目标规则没召回，先看 TopK 是否太小、阈值是否太高、查询改写是否不足；不该出现的规则混入，则看候选池是否太宽、阈值是否太低、reranker 有没有把目标规则排到前面。 **追问：长上下文模型能不能替代 RAG？** 回答：不能完全替代。长上下文解决的是装得下，RAG 解决的是找得对、引用对、可审计。客服规则还需要版本控制、权限过滤、引用追踪和检索可观测性，这些不是把所有文档塞进上下文就自然有的。 **追问：为什么本课还要看 cost summary？Tool 和 RAG 分流跟成本有什么关系？** 回答：路径分错也会带来成本问题。物流查询应该是轻路径，不能误触发大量 RAG context injection；活动规则走 RAG 时，也要观察检索、重排和上下文注入有没有把延迟和 token 成本推高。cost summary 用来确认路径复杂度符合场景预期。 **追问：如果用户追问“那这个订单还能退吗”，能直接用刚才的物流结果吗？** 回答：不能直接当作当前事实。Memory 可以帮助理解“这个订单”指的是上一轮订单，但退款涉及高风险动作，必须重新查订单状态和售后政策，再进入 Workflow/HITL。第 42 课验的是事实来源分层，第 43 课会验退款为什么必须停住。 **追问：活动规则更新以后怎么办？** 回答：活动规则更新是知识治理问题，不只是重新跑一次 embedding。生产环境需要有发布、审核、版本、灰度和回滚的知识库管理；Agent 只能读取已发布、可追踪、权限允许的知识版本，回答保留 citation，评测样例检查应该命中的规则和不该混入的规则。课程项目先用已发布 Markdown 知识和 citation / eval 信号演示这条边界，不假装已经实现完整知识运营平台。 **追问：这套分工在生产环境里怎么落地？** 回答：生产环境中，Tool 层接企业订单、物流、库存和权限系统；RAG 层接知识发布、审核、版本、权限过滤和灰度回滚；Eval 层接线上样本和人工质检。核心原则不变：runtime facts 走 Tool，published knowledge 走 RAG，高风险动作走 Workflow/HITL。

## 本课复盘：路径证据比回答更重要 场景验证解决的是“回答看起来对，但路径可能走错”的问题。 大促第一波里，你真正验的是两条路径：

| 复盘点 | 你要记住什么 | 小哲项目里的证据 |
| --- | --- | --- |
| 事实类型先分清 | 订单、物流、库存是实时事实；活动、会员、FAQ 是稳定知识。

| SO20260602103000009-a1000009 物流走 `tool_calls`；618 规则走 citations。

|
| 回答不能替代证据 | answer 只是结果，路径信号才证明 Agent 没猜。

| 物流看 `get_order_detail`、`get_order_logistics`；活动看规则 ID。

|
| 复习要贴着场景 | Tool、RAG、Runtime Context、Trace 和 Cost 要放在同一个客服问题里看。

| 同一个 `/chat` 响应里同时检查 answer、tool_calls、citations、session_state 和 trace。

| 这时候你能对老板说：

```latex
物流查的是实时业务接口，活动规则查的是稳定知识库，它们没有混路。
```

## 下一波压力：退款不是一句答复 物流和活动规则终于走对路。 你刚把第一波流量压住，售后主管就把一条退款消息贴到群里：

```latex
用户说订单没发货，要求马上退钱。
```

下一课，大促第二波来了。
这次不是查事实，而是动钱边界。
