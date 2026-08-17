# 给 Agent 一套工具箱，但参数和身份不能乱来｜Tool Calling

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396422355-04660260-0fbe-4a40-83ea-79c45746741d.png" title="null" crop="0,0,1,1" id="wDOxh" class="ne-image">

## 接口能查了，模型还是不知道该调用谁 第 17 课里，小哲电商客服 Agent 终于不再拿 RAG 猜快递状态。 它知道订单、物流、库存和退款进度要查业务事实服务。 老板看完 `SO20260602103000009-a1000009` 的物流结果，表情缓和了一点：

> 行，至少这次没编。

> 但开发小弟很快提醒你：

> 现在更像是代码替它查。后面订单、商品、退款、优惠、售后接口越来越多，大模型自己要怎么知道什么时候该查、该查哪个工具、参数从哪里来？

> 这才是 Tool Calling 真正要解决的问题。
> 它不是给后端多包一层接口名，而是把可调用能力整理成模型能读懂的工具定义：这个工具能拿什么事实、需要哪些参数、什么时候不能用。这样模型遇到“查 SO20260602103000009-a1000009 物流”时，不是凭记忆编一句客服话术，而是生成一次明确的工具动作。
> 你也发现一个更危险的问题：

```latex
用户在聊天框里写了订单号，不等于他有权查这个订单。 模型觉得该查物流，不等于工具参数就是安全的。
```

所以第 18 课要把“业务接口”升级成“工具箱”：让模型知道怎么调用工具获取事实，同时让执行层守住参数和身份边界。
这就是 Tool Calling。

## 可调用能力的契约设计 关键不是知道“模型可以调用函数”。 真正要落住的是：怎么把真实业务系统里的能力，整理成 Agent 可以安全使用、前端可以观察、评测可以检查的工具契约。

| 这次要补上的能力 | 你要能说清楚什么 |
| --- | --- |
| 生产问题 | 大模型需要事实时，必须知道有哪些工具可用、该选哪个工具、要带哪些参数；如果没有工具契约，Agent 会乱选能力、乱填参数、乱越权。

|
| 本项目实现 | `ToolSpec` 描述工具，`ToolAction` 表示本轮调用，`execute_tool_action` 用 `runtime_user_id` 做归属校验。

|
| 当前边界 | 本课只做只读查询工具，不执行退款、取消订单、补偿发放等写动作。

|
| 错误说法 | “工具参数是模型生成的 JSON，所以可以直接执行。”这是错的。

|

## 技术机制

### Tool Calling 是让模型知道怎么查事实 你可以先把工具调用理解成三件事：

| 环节 | 在小哲项目里做什么 |
| --- | --- |
| Tool description | 告诉模型这个工具能查什么、需要哪些参数、不能做什么 |
| Action | LangChain Agent 根据模型输出选择一个工具，并给出参数 |
| Observation | 工具执行后，把真实结果作为观察事实交回 Agent | 在这一版里，工具调用进入 LangChain：`create_agent` 接收本轮候选 `StructuredTool`，真实 OpenAI-compatible ChatModel 根据用户问题和工具描述生成 tool call，LangChain 再把 tool call 交给对应工具执行。 这里有一个重要边界：LangChain 负责工具调用循环，但后面的参数校验、身份校验和工具执行仍然留在后端代码里。框架能帮你组织 Action / Observation，不等于可以把业务权限交给模型判断。 为了不把框架名词和通用概念混在一起，你可以这样分开看：

| 通用概念 | 第 18 课里的 LangChain 实现 | 小哲项目里必须自己守住的边界 |
| --- | --- | --- |
| 工具说明 | `StructuredTool` 的 name、description 和参数签名 | 工具描述要写清使用场景、禁止场景和参数格式 |
| 工具选择 | `create_agent` 让模型生成 tool call | 只能在候选工具范围内选择，不能越过高风险动作边界 |
| 工具执行 | LangChain 调用 `StructuredTool` 包装的函数 | 函数内部仍要校验当前用户、订单归属和必填参数 |
| 工具结果 | `ToolMessage` 把 Observation 带回 Agent | Observation 要做摘要和字段收口，不能把内部原始数据全塞回模型 | 换成别的框架时，名字可能不是 `StructuredTool` 或 `ToolMessage`，但这四层责任不会消失。你真正要记住的是工具契约、受控执行、可信身份和 Observation 边界。 所以 Tool Calling 不是“模型直接执行 Python 函数”。这条链路至少有四层责任：

| 层次 | 谁负责 | 不能越界做什么 |
| --- | --- | --- |
| 模型 | 根据用户问题和工具说明提出 tool call。

| 不能证明参数可信，也不能自己访问业务系统。

|
| LangChain | 把模型输出接成标准工具调用消息。

| 不替代业务鉴权、归属校验和风险判断。

|
| 后端工具层 | 校验参数来源、当前用户身份和对象归属，再执行工具。

| 不能把用户自称当系统事实。

|
| 业务系统 | 返回订单、物流、库存、退款进度等真实事实。

| 不把内部原始字段直接暴露给模型和用户。

| 这一课的工具都是只读工具：

- `get_order_logistics` + `get_product_inventory` + `get_refund_status` 它们只查询事实，不执行退款、不取消订单、不发补偿。
真正危险的写操作以后会单独处理。

### 参数不能靠用户自称，身份不能靠模型判断 本节代码快照在：

```latex
code/agent-course-versions/lesson-18-tool-calling/backend/
```

第 18 课是在第 17 课模块基础上继续长出来的。`api/`、`config/`、`integrations/` 和 `tools/runtime_context.py` 继续保留；新增重点是 `tools/contracts.py` 里的 `ToolSpec`、`tools/langchain_tools.py` 里把工具包装成 LangChain `StructuredTool`、`models/llm_client.py` 里创建真实 ChatModel，以及 `tools/tool_runtime.py` 里的只读工具执行。`agents/customer_service_agent.py` 只负责把这些模块串成一轮 Agent 响应；`tools/planning.py` 只保留轻量意图识别和参数提取，用于缺参数时提示和响应标注。
关键链路是：

```latex
/chat -> classify_intent(user_message) -> create_agent(model, StructuredTool[]) -> LangChain AIMessage(tool_calls) -> StructuredTool -> validate_tool_action(action) -> execute_tool_action(action, ChatRequest) -> LangChain ToolMessage(observation) -> ChatResponse(tool_calls)
```

`ToolSpec` 负责说明工具。真实代码在 `tools/contracts.py` 里是这样定义的：

```python
class ToolSpec(BaseModel): name: str description: str required: list[str] parameters_schema: dict[str, str]
```

这四个字段不是装饰。
它们决定了 LangChain Agent 能不能把自然语言请求变成安全的工具动作：

| 字段 | 要回答的问题 | 小哲项目里的例子 |
| --- | --- | --- |
| `name` | 工具叫什么，执行层怎么找到它。

| `get_order_logistics` |
| `description` | 什么场景该用它，什么场景不能用它。

| 只查物流事实，不处理退款。

|
| `required` | 哪些参数缺了就不能调用。

| `order_id` 必填。

|
| `parameters_schema` | 参数类型、格式和允许范围是什么。

| `order_id` 必须是小哲电商真实订单号，例如 `SO20260602103000009-a1000009`。

| 这一版里的物流工具定义就是：

```python
ToolSpec(name='get_order_logistics', description='查询当前登录用户某个订单的物流状态，只能用于用户自己的订单。', required=['order_id'], parameters_schema={'order_id': '小哲电商订单号，例如 SO20260602103000009-a1000009'})
```

注意，本课 `ToolSpec.parameters_schema` 是给学习者和调试后台看的描述性映射，不是标准 JSON Schema。真正交给 LangChain `StructuredTool` 的参数约束来自函数签名；生产系统如果要做更严格的类型、枚举和格式校验，通常会使用 Pydantic 参数模型或标准 JSON Schema，并继续在执行层做二次校验。
注意 `description` 里必须写边界。
如果只写“查询订单”，模型可能会把物流查询、退款进度、取消订单都混成一个工具。小哲这版故意把工具命名得很窄，就是为了让你看到：工具越贴近业务动作，边界越要清楚。
一个可用的工具 Schema 至少要把四件事说清：

| Schema 内容 | 这一版要写清的内容 | 为什么重要 |
| --- | --- | --- |
| 使用场景 | “查询当前登录用户某个订单的物流状态”。

| 让模型知道什么时候该选这个工具。

|
| 禁止场景 | 物流工具只负责物流查询；退款、取消订单、补偿不走这个工具。

| 防止低风险工具被拿去做高风险动作。

|
| 参数格式 | `order_id` 必须是小哲订单号，例如 `SO20260602103000009-a1000009`。

| 降低模型生成错误参数的概率。

|
| 参数来源 | `order_id` 可以来自用户输入，`runtime_user_id` 必须来自系统。

| 防止用户自称身份被当成可信权限。

| 生产里如果工具入参或返回字段继续扩展，也要在 Schema 或工具目录里标清边界。比如同样叫物流查询，当前只承诺提供受控的物流查询摘要和后端实际返回的已知字段；如果没有返回预计送达、异常原因，就不要让模型猜测这些字段。Schema 写得越窄，执行层越容易判断“这个参数或字段是不是被模型凭空补出来的”。

### 为什么不暴露一个万能订单工具 你可能会想：既然后端本来就有订单接口，为什么不直接给模型一个 `query_order`，让它自己决定查物流、查退款、查售后？

这在小哲电商客服现场会很危险。

| 万能工具的诱惑 | 真正的风险 |
| --- | --- |
| 一个工具能查很多信息 | 模型更难判断这次到底是物流、退款进度还是取消订单。

|
| 参数看起来更灵活 | 用户话术里的线索和系统可信身份容易混在一起。

|
| 后端包装更省事 | 高风险能力可能被低风险问题顺手暴露。

|
| Observation 一次返回更多字段 | 地址、手机号、内部备注、退款状态都可能被塞进模型上下文。

| 所以这一版把工具拆窄：物流只查物流，库存只查库存，退款进度只查进度，而且都先保持只读。这样模型选择工具时看到的是明确的业务动作，执行层也能按工具类型做参数校验、身份校验和风险控制。 工具 Schema 不是为了让代码好看。它是在告诉模型“你只能提出什么调用”，也在告诉后端“执行前必须检查什么”。真正可信的边界不来自模型自觉，而来自窄工具、必填字段、白名单和运行时身份校验一起收口。

### 大模型怎么决定调用哪个 Tool 理解工具选择时，有一句话很关键：

```latex
模型看到的不是 Python 函数体，而是工具名、description 和参数 schema。
```

也就是说，大模型不是打开后端代码看 `execute_tool_action` 怎么写。
它通常看到的是类似这样的工具说明：

```latex
工具名：get_order_logistics 描述：查询当前登录用户某个订单的物流状态，只能用于用户自己的订单。 参数：order_id，必填，小哲电商订单号，例如 SO20260602103000009-a1000009
```

然后它把用户问题、系统提示词、对话上下文和工具说明放在一起判断：

| 判断步骤 | 模型在判断什么 | 小哲项目里的例子 |
| --- | --- | --- |
| 1. 是否需要外部事实 | 这个问题能不能直接回答，还是必须查实时系统。

| “SO20260602103000009-a1000009 到哪了”需要查物流，不能凭模型记忆回答。

|
| 2. 哪个工具语义最匹配 | 工具名和 description 是否对应当前任务。

| 物流问题匹配 `get_order_logistics`，不是 `get_refund_status`。

|
| 3. 参数能不能补齐 | schema 里的必填参数是否能从用户话里提取。

| 用户说了 `SO20260602103000009-a1000009`，可以形成 `{"order_id": "SO20260602103000009-a1000009"}`。

|
| 4. 是否应该先停下 | 如果缺必填参数，应该澄清，而不是猜一个参数。

| 用户只说“我的物流到哪了”，第 19 课会处理澄清。

| 所以，模型选择工具不是因为它“知道物流在哪里”，而是因为工具契约告诉它：

```latex
遇到订单物流实时事实 -> 可以提出 get_order_logistics 调用 -> 参数需要 order_id
```

这一版已经采用这种 LangChain Agent 形态，把工具列表传给 `create_agent`：

```python
agent = create_agent(model=model, tools=tools, system_prompt=system_prompt)
```

模型返回的不是最终答案，而是一次结构化工具调用请求：

```latex
tool_name = get_order_logistics arguments = {"order_id": "SO20260602103000009-a1000009"}
```

注意这里的边界：

```latex
模型只提出 tool call。 运行时才真正执行工具。
```

这一版直接读取 `course.env` 里的模型配置，使用真实 ChatModel 生成 LangChain 标准 tool call。你可以在前端观察到本轮工具动作的结构：

```latex
ToolSpec -> ToolAction -> 参数校验 -> 身份校验 -> 工具执行 -> Observation
```

代码里还给 LangChain 调用设置了 `recursion_limit=4`。第 18 课只需要一次“用户消息 -> tool call -> observation -> 最终回答”的闭环，4 步足够；真实多工具链路可以调大，但始终要有上限，避免工具循环失控。
生产项目里还会多一层保护：不会把所有工具一次性都塞给模型，而是先根据任务类型收窄候选工具，再让模型在候选范围里选择。这样可以减少误调用，也能降低上下文成本。第 18 课先讲 LangChain 单次工具选择的基本原理，后面再逐步展开完整路由和治理。
`ToolAction` 是本课对 LangChain tool call 的公开摘要，方便前端观察和测试。
在第 18 课代码里，LangChain 消息里出现 `get_order_logistics` 的 tool call 后，课程响应会把它整理成这个动作：

```python
return ToolAction(tool_name='get_order_logistics', arguments={'order_id': order_id}, reason='用户询问订单物流，需要实时查询物流工具。')
```

`ToolSpec` 和 `ToolAction` 的关系可以这样记：

```latex
ToolSpec 是菜单：系统有哪些工具，每个工具需要什么参数。 ToolAction 是点单：这一轮具体要调用哪个工具，参数是什么。
```

### 工具不是 HTTP 接口换个名字 把业务接口包装成工具时，不是给模型多一个 URL。 它至少要同时管住三层边界：

| 边界 | 这层管什么 | 小哲项目里的例子 |
| --- | --- | --- |
| 工具暴露 | 当前客服 Agent 能看到哪些能力。

| 只暴露物流、库存、退款进度这类查询工具，不暴露真实打款、批量退款、审批通过工具。

|
| 参数来源 | 哪些参数可以从用户话里来，哪些必须由系统注入。

| `order_id` 可以来自用户；`runtime_user_id`、渠道、权限不能让模型自己填。

|
| 对象归属 | 查到的订单、售后单、退款单是不是当前用户的。

| 工具执行层再次校验归属，不靠模型判断“这是我的”。

| 这三层都守住，Tool Calling 才是受控能力，不是把业务系统直接递给模型。 真正执行前还要校验。这一版里的校验逻辑是：

```python
def validate_tool_action(action: ToolAction) -> ToolObservation | None: spec = TOOL_SPECS.get(action.tool_name) if spec is None: return ToolObservation(tool_name=action.tool_name, status="error", summary="工具不存在。") missing = [field for field in spec.required if not action.arguments.get(field)] if missing: return ToolObservation( tool_name=action.tool_name, status="error", summary=f"工具参数缺失：{', '.join(missing)}。", data={"missing": missing, "parameters_schema": spec.parameters_schema}, ) return None
```

这一步很关键。不要因为 Action 看起来像 JSON，就默认它安全。JSON 只是结构化，不等于可信。
同理，本课工具函数把 `ToolObservation` 以 JSON 字符串返回，是为了让调试后台稳定解析 Action / Observation 配对。生产系统可以把给模型看的 Observation 写得更自然，同时把结构化证据放进 trace 或审计日志；关键是不要把内部原始字段不加筛选地塞回模型。
`execute_tool_action` 不会相信用户一句“这是我的订单”。
它会用 `runtime_user_id` 去核验订单是否属于当前登录用户。
这就是这一课的身份边界：

```latex
用户输入可以提供线索。 当前登录用户身份必须来自系统确认。
```

第 18 课只讲这个边界，不展开完整 Runtime Context 体系。
同时要注意：Tool Calling 接管的是实时事实查询路径，不是把前面已经完成的稳定知识 RAG 拿掉。活动规则、售后规则这类不需要实时业务接口的问题，仍然走第 16/17 课沿用下来的 Hybrid RAG 和 citations；订单物流、库存价格、退款进度这类实时事实，才交给 LangChain Tool Calling。

## 工程级经验：别把工具调用做成接口裸奔 写到这里，你要先建立一个工程判断：

```latex
Tool Calling 的难点不在“能不能调函数”，而在“这个函数能不能被模型安全、稳定、可追踪地使用”。
```

生产环境里，工具不是越多越好，也不是把所有后端接口原样暴露给模型就行。
小哲这版只做了三个只读工具，但已经能看到几个工程经验：

| 工程经验 | 为什么重要 | 本课代码里的落点 |
| --- | --- | --- |
| 工具按业务动作拆，不按大接口裸露。

| 一个万能 `query_order` 很容易把物流、退款、取消、售后混在一起，模型也更难选对。

| 拆成 `get_order_logistics`、`get_product_inventory`、`get_refund_status`。

|
| `description` 要写使用场景和禁区。

| 模型主要靠工具说明判断什么时候调用；说明太泛，工具选择就会漂。

| 物流工具写明“当前登录用户某个订单”“只能用于用户自己的订单”。

|
| 参数要分清用户线索和系统事实。

| 用户可以提供订单号，但不能提供可信身份、权限和渠道。

| `order_id` 来自用户输入，`runtime_user_id` 从 `ChatRequest` 进入执行层。

|
| 执行层必须二次校验。

| 模型选了工具、填了参数，只代表它提出了调用意图，不代表这个调用安全。

| `validate_tool_action` 检查工具和必填参数，`execute_tool_action` 校验订单归属。

|
| 工具结果要留下证据链。

| 工程验收不能只看最终回答像不像客服，还要看它到底有没有查事实。

| `tool_calls` 同时记录 `action` 和 `observation`，方便前端观察和测试检查。

| 你可以把这一课的经验压成一句话：

```latex
模型负责在工具契约内提出调用动作，后端负责注册工具、校验参数、确认身份、执行查询和留下证据。
```

这也是工程级 Agent 和玩具项目的区别。
玩具项目只要回答里出现某个固定物流节点就算成功。
工程级 Agent 还要回答：

```latex
它为什么选择物流工具？ 参数是不是从用户问题里来的？ 当前用户有没有权限查这个订单？ 工具结果有没有作为 Observation 被记录？ 最终回答是不是从 Observation 组织出来的？
```

## 这一版响应多了 tool_calls 从这一课开始，响应里会出现：

```latex
tool_calls
```

它记录本轮工具 Action 和 Observation。
例如用户问：

```latex
查一下 SO20260602103000009-a1000009 的物流到哪了
```

当前用户是订单所属用户时，工具会返回成功 Observation：

```latex
SO20260602103000009-a1000009 物流状态：来自电商后端的最新物流或订单状态
```

当前用户换成 `U1002` 时，工具会返回错误 Observation：

```latex
订单不属于当前登录用户
```

这不是模型礼貌不礼貌的问题。
这是工具执行层必须守住的业务边界。

## 怎么验证这次不是模型在装作查过 这一课要验证的是：Agent 不是自己编物流，也不是页面替它查，而是按工具描述生成 Action，再由后端执行工具并返回 Observation。 你发送：

```latex
查一下 SO20260602103000009-a1000009 的物流到哪了
```

你要观察到：
- 工具 Action 选择的是 `get_order_logistics`。
- 工具参数里带的是用户问题中的 `SO20260602103000009-a1000009`。
- Observation 显示工具执行成功，并返回可回答用户的物流事实。
- 最终回答来自 Observation，而不是知识库里的通用发货 FAQ。
如果用小哲电商客服 Agent 调试后台验证，打开“工具调用”开关后，页面展示的是当前 Agent 返回的嵌套结构：

```latex
tool_calls[0].action.tool_name tool_calls[0].action.arguments tool_calls[0].observation.summary tool_calls[0].observation.status
```

调试后台只负责展示这些字段，不替 Agent 选择工具，也不在页面里补业务判断。

## 本节知识总结 Tool Calling 解决的是“Agent 怎么安全调用外部能力”的问题。 当 Agent 需要查订单、查物流、查库存或执行计算时，不能只让模型随口说“我查一下”。系统要把可调用能力定义成工具：工具叫什么、能做什么、需要哪些参数、参数从哪里来、执行结果如何返回、哪些身份和权限边界必须守住。

| 知识点 | 核心概念 | 小哲项目里的落点 |
| --- | --- | --- |
| Tool Calling | 把工具定义交给模型，让它在需要实时事实时生成明确工具名和参数，而不是只用语言假装查过。

| 小哲用 `get_order_logistics` 查询物流。

|
| 工具选择 | 模型根据用户问题、上下文、工具名、description 和参数 schema 判断是否调用工具以及调用哪个工具。

| `get_order_logistics` 的描述匹配物流问题，`order_id` 来自用户问题。

|
| Action | LangChain Agent 根据模型输出选择工具，并生成结构化参数。

| 工具 Action 里有 tool_name 和 arguments。

|
| Observation | 工具执行后返回可供回答使用的观察结果。

| 物流 Observation 提供状态、当前位置和摘要。

|
| 参数边界 | 工具参数要来自用户线索和系统事实，不能让模型乱填。

| `SO20260602103000009-a1000009` 来自用户问题，当前用户身份来自 `runtime_user_id`。

|
| 身份校验 | 工具执行层必须验证权限和归属。

| 非当前登录用户不能查询这笔订单物流。

|
| 权限分层 | 工具安全不只靠参数格式，还要管工具暴露、参数来源和对象归属。

| 客服 Agent 只能调用查询工具，系统注入身份，执行层校验订单归属。

|
| 工程落地 | 工具定义既是给模型看的能力说明，也是给后端执行层看的安全契约。

| `description` 写边界，`required` 和 `parameters_schema` 管参数，`execute_tool_action` 管鉴权。

|
| 工具证据 | 响应要保留工具调用记录，证明回答不是模型编的。

| 调试后台展示 `tool_calls` 的 Action 和 Observation。

|

## 工具箱有了，缺参数事故也来了 这一版让 Agent 第一次有了真正的工具箱。 但工具越像真的，缺参数时越危险。 如果用户只说“我的物流到哪了”，系统现在只能提示需要订单号。 下一次事故很可能不是工具查错，而是模型在订单号不清楚时装懂，随便拿一个订单去查。 小哲心里隐隐觉得：

> 工具箱有了，但用户不会总把参数说清楚。模型最容易在缺参数时装懂，下一课必须先让它学会问清楚。
> >
