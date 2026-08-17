# 商品推荐终于靠谱了：库存、价格、知识一起看｜Tool + RAG 联合回答

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396424076-d87802ad-d3b0-4510-a1bf-06d1d70346af.png" title="null" crop="0,0,1,1" id="E0Q6x" class="ne-image">

## 一个商品问题，同时要实时事实和稳定依据 第 21 课之后，Agent 在工具超时、模型服务不可用和高风险退款请求面前，至少不会乱编、不会乱做。 你刚松一口气，老板拿着运营日报过来：

> 物流能查了，那商品推荐能不能别像背广告词？用户问耳机，你得知道有没有货、多少钱、能不能叠券。

> 用户的问题也很真实：

```latex
我通勤想买降噪耳机，现在有库存吗，活动怎么算？
```

这个问题不能只走 RAG。
知识库知道降噪蓝牙耳机适合通勤、差旅，也知道 618 消费电子会场会员价规则。
但库存和当前价格必须查商品系统。
第 22 课要让 Tool 和 RAG 第一次一起回答。

## 多来源证据合成 关键不是证明“Tool 和 RAG 可以一起用”。 真正要落住的是：真实客服问题常常同时依赖实时事实和稳定知识，Agent 必须知道不同来源各自负责什么，并在回答里保留来源边界。

| 这次要补上的能力 | 你要能说清楚什么 |
| --- | --- |
| 生产问题 | 商品推荐既要看库存价格，也要看商品卖点和活动规则，单靠 Tool 或单靠 RAG 都不完整。

|
| 本项目实现 | 商品库存价格走 `get_product_inventory`，商品知识和活动规则走 citations，`answer_sources` 记录来源。

|
| 当前边界 | 低风险商品咨询可以合成回答；退款、补偿、取消订单仍要走高风险边界。

|
| 错误说法 | “只要 RAG 引用了活动规则，就可以承诺当前价格和库存。”这是错的。

|

## 商品咨询要同时看两类事实 你把商品咨询拆成两条线：

| 信息 | 来源 |
| --- | --- |
| 当前库存 | 商品工具 |
| 当前价格 | 商品工具 |
| 当前活动状态 | 商品工具 |
| 商品卖点 | 商品知识库 |
| 会员价能不能叠券 | 活动规则知识库 | 如果只看工具，回答会像数据库字段。 如果只看 RAG，回答会漏掉实时库存和价格。 所以这一课的目标是：

```latex
实时事实由 Tool 查。 稳定解释由 RAG 补。 最终回答把两边合在一起。
```

## RAG 有时候也可以做成一个工具 这里要补一个容易被忽略的工程做法：RAG 不一定永远是 Agent 内部的一段隐藏检索流程，它有时候也可以被包装成一个工具。 比如小哲电商客服 Agent 后面如果接入多个知识库，商品知识、售后政策、活动规则、客服 SOP 都有自己的权限、版本和审核状态，那么检索就不只是“从向量库里取几段文本”了。它本身也会变成一个受控能力：

```latex
search_xiaozhe_knowledge 输入：query、knowledge_domains、top_k、user_channel 输出：命中的知识片段、citation_id、知识版本、置信度
```

这时，你可以把它当成一个只读工具交给 Agent 使用。它和 `get_product_inventory` 的差别不在于“是不是工具”，而在于查的事实类型不同：

| 工具化能力 | 查什么 | 输出应该带什么 |
| --- | --- | --- |
| `get_product_inventory` | 当前库存、价格、活动状态 | 当前业务事实和时间边界 |
| `search_xiaozhe_knowledge` | 商品说明、活动规则、售后 SOP | 知识片段、citation、版本和置信度 | 这样做的好处是，RAG 的调用也能进入统一的 Tool 调度、权限控制、日志、Trace 和 Eval。你可以看到本轮到底检索了哪个知识域、用了哪个 query、命中了哪些 citation，而不是只在最终回答里看到几条引用。 但这不等于所有项目都必须把 RAG 做成工具。 如果系统只有一个简单知识库，检索流程固定，内部直接调用 RAG 模块会更清晰。等到知识库很多、权限复杂、多个 Agent 都要复用同一套检索能力，或者你希望 MCP / Tool Catalog 统一管理“能查什么”时，再把 RAG 包成工具更有价值。 本课代码为了让你先看清 Tool + RAG 的来源分工，仍然把商品工具和 RAG 检索分成两条显式链路。你要记住的是这个边界：

```latex
RAG 可以工具化。 但工具化以后，它查的仍然是稳定知识，不会变成库存、价格、物流这种实时业务事实。
```

## 这一版 Agent 怎么改 本节代码快照在：

```latex
code/agent-course-versions/lesson-22-tool-rag-product-answer/backend/
```

第 22 课继续复用前面的工具分层，但新增 `rag/product_knowledge.py` 专门处理商品知识检索和 citations。商品库存、价格和活动状态仍在 `tools/tool_runtime.py` 里通过业务工具读取；稳定卖点和活动规则从 RAG 模块返回；`agents/customer_service_agent.py` 最后把 Observation 和 citations 合成一个有来源边界的回答。
关键链路是：

```latex
/chat -> classify_intent(user_message) -> plan_tool_action(ChatRequest, intent) -> execute_product_tool(action) -> retrieve_product_knowledge(user_message, sku) -> build_citations(hits) -> build_product_answer(observation, citations) -> ChatResponse(tool_calls, citations)
```

`execute_product_tool` 会查：

```latex
sku name current_price promotion_price inventory activity
```

`retrieve_product_knowledge` 会从本课的 `knowledge_chunks.json` 找商品卖点和活动规则。
最后 `build_product_answer` 把工具 Observation 和 RAG citations 合在一起：
- 先说当前库存和价格。
- 再说商品适合什么场景。
- 再提醒会员价不能叠加会员券或满减券。
- 最后让优惠以结算页为准。
这比“这款耳机很适合你”靠谱得多。

## 两种来源合并时要有优先级 Tool + RAG 联合回答最怕一件事：两边信息看起来都像“证据”，但代表的事实类型不同。 你要先给来源定优先级：

| 信息类型 | 优先来源 | 不能怎么做 |
| --- | --- | --- |
| 当前库存 | Tool | 不能用商品知识里的“热销现货”替代库存数。

|
| 当前价格 | Tool | 不能用旧活动文案里的价格替代实时价格。

|
| 商品卖点 | RAG | 不能让库存工具凭空生成推荐理由。

|
| 活动规则 | RAG + Tool 当前活动状态 | 不能只看活动文案，忽略当前是否生效。

|
| 结算页优惠 | Tool 或业务系统最终结果 | 不能承诺一定能叠加。

| 合并回答时，可以按这个顺序组织：

```latex
1. 先说 Tool 已确认的当前事实。 2. 再说 RAG 引用支持的稳定说明。 3. 最后说优惠、库存、价格的边界。
```

## 用户偏好只能当低风险辅助 商品推荐里还有一类信息容易被混在一起：用户偏好。 用户本轮说“我通勤用”“预算 300 左右”“想要降噪”，这些都可以帮助推荐排序。后续如果接入偏好服务，常用配送方式、偏好品类、预算区间也可以作为低风险辅助。 但偏好不能替代实时事实：

| 偏好能做什么 | 偏好不能做什么 |
| --- | --- |
| 帮助筛选更适合的商品场景。

| 替代库存、价格、上下架状态。

|
| 让推荐理由更贴近用户需求。

| 替代售后限制、活动规则和结算结果。

|
| 记录低风险口味、预算、品类倾向。

| 把地址、证件、银行卡、支付信息当作普通偏好保存。

| 当前版本先只使用用户本轮明确说出的场景和预算，不提前进入长期偏好记忆。这样可以先把 Tool、RAG 和低风险推荐线索的边界讲清楚。 最小逻辑可以这样理解：

```python
def build_product_answer(observation: Observation, citations: list[Citation]) -> str: facts = observation.facts product_points = select_citations(citations, domain="product") promotion_rules = select_citations(citations, domain="promotion") return render_answer( current_price=facts["current_price"], inventory=facts["inventory"], product_points=product_points, promotion_rules=promotion_rules, boundary="最终优惠以结算页为准", )
```

这里不是把工具结果和知识片段简单拼接。
它是在回答里保留来源分工：库存价格来自工具，卖点和活动解释来自引用，最终优惠边界来自业务规则。
如果两边冲突，要优先相信更适合该事实类型的来源。比如知识库说“618 会场商品热销”，但工具返回库存为 0，那当前回答必须说暂时无库存。

## 这也是售后高风险之前的分水岭 商品咨询是低风险查询。 它可以把 Tool 和 RAG 合起来回答。 但用户一旦说：

```latex
SO20260602103000009-a1000009 直接退款，马上给我退钱
```

当前版本仍然只会标记：

```latex
risk_level = high needs_human_approval = true next_action = transfer_to_human
```

它不会进入退款审批，也不会创建售后工作流。
这条线必须分清。
否则你会把“能查事实”误解成“能执行高风险动作”。

## 怎么验证老板能闭嘴 按本课代码目录的 `README.md` 启动后端后，发送：

```latex
我通勤想买降噪耳机，现在有库存吗，活动怎么算？
```

你应该看到：
- `tool_calls[0].action.tool_name = get_product_inventory` + `tool_calls[0].observation.facts.sku = SKU-AUD-101` + `tool_calls[0].observation.facts.inventory` 来自小哲电商后端的 `stock` + `tool_calls[0].observation.facts.promotion_price` 来自小哲电商后端的促销字段 + `citations` 同时包含商品知识和活动规则 + `session_state.tool_rag.answer_sources = ["tool", "rag"]` 如果用小哲电商客服 Agent 调试后台验证，可以同时打开“工具调用”和“RAG 引用”开关。React 页面应该一边展示 `get_product_inventory` 的实时库存价格 Observation，一边展示商品知识和活动规则 citations。两边一起出现，才说明这一课真的完成了 Tool + RAG 联合回答。

## 本节知识总结 Tool + RAG 联合回答解决的是“一个问题同时需要实时事实和稳定知识”的情况。 很多真实问题不能只靠一种来源回答。商品咨询既要看库存、价格、SKU 这类实时事实，也要看产品卖点、适用场景、活动规则这类稳定知识。只查工具，回答可能缺推荐理由；只查 RAG，回答可能忽略当前是否有货、价格是否变化。 通用做法是先分清来源：实时事实走 Tool，稳定知识走 RAG，再把两边证据合成一个有边界的回答。

| 知识点 | 核心概念 | 小哲项目里的落点 |
| --- | --- | --- |
| Tool + RAG | 同一问题同时使用实时工具事实和稳定知识依据。

| 商品咨询同时查库存价格工具和商品/活动知识。

|
| 来源分工 | Tool 负责当前状态，RAG 负责稳定说明和规则依据。

| `get_product_inventory` 查库存，citations 提供商品知识和活动规则。

|
| RAG 工具化 | 把知识检索包装成只读工具，纳入统一调度、权限、Trace 和 Eval。

| 复杂知识库场景可设计 `search_xiaozhe_knowledge`，但它仍然只查稳定知识。

|
| 联合回答 | 回答要整合事实和知识，但不能混淆二者来源。

| 先说库存价格，再说适用场景和活动边界。

|
| answer_sources | 系统要记录回答来自哪些来源，方便验证路径。

| `session_state.tool_rag.answer_sources = ["tool", "rag"]`。

|
| 偏好边界 | 用户偏好只能辅助低风险推荐，不能替代实时事实或保存敏感信息。

| 本轮预算和场景可用于推荐；库存价格仍以工具结果为准。

|
| 高风险边界 | 能查事实和知识，不等于能执行资金或权益动作。

| 商品咨询可联合回答，退款仍只标记高风险并转人工。

|

## 第五幕收束 到这里，Agent 已经能查实时订单、物流、库存，也能在信息不足时澄清，在工具或模型不稳时降级，在商品咨询里把工具事实和知识库依据合起来回答。 但小哲没有真的放心。 工具越来越多，每个工具里都开始重复写：
- 参数校验。
- 错误处理。
- 日志摘要。
- 安全边界。
查询事实只是第一步。
工具越多，治理逻辑也会越来越乱。
小哲心里隐隐觉得：

> 下一幕，不能再让每个工具各管各的了。工具链路需要统一治理。

> > 代码同步说明：从本课开始，课程快照会尽量使用真实 OpenAI 兼容大模型生成最终客服话术。Tool、RAG、Workflow、Runtime Context 和安全模块先产出受控事实与边界，模型负责把这些事实组织成自然回复；只有模型不可用、测试隔离、低置信或安全边界触发时，才回退到确定性话术。
> >
