# 工具不该只服务你这一版 Agent｜MCP 与 Tool Use

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396424584-7de7f3f7-d9c0-4004-a4a9-4d2b03dffde9.png" title="null" crop="0,0,1,1" id="WhsZK" class="ne-image">

## 工具定义开始在多个 Agent 之间漂移 第 23 课之后，工具链路终于不再各管各的。 工具调用前有 `pre_tool_call`。 工具调用后有 `post_tool_call`。 异常有 `on_error`。 一轮请求结束有 `on_completion`。 你刚想松口气，老板又来了：

> 这套订单、物流、库存工具，客服 Agent 能用，运营 Agent 能不能也用？售后主管助手能不能也用？以后内部质检 Agent 能不能复盘工具调用？

> 你点开代码，心里一沉。
> 工具说明、参数 schema、边界说明、Observation 口径，现在都写在这一版客服 Agent 后端里。
> 如果另一个 Agent 也要用这些工具，要么复制代码，要么重新写一套工具定义。
> 复制一开始很快。
> 复制多了以后，版本就会开始分叉。
> 客服 Agent 里的物流工具说明更新了，运营 Agent 忘了更新。
> 售后主管助手把“退款进度查询”误写成“执行退款”。
> 内部质检 Agent 只知道工具名，不知道这个工具必须绑定当前登录用户。
> 这不是 Tool Use 本身坏了。
> 而是工具能力开始需要一个标准化来源。

## 技术机制

### MCP 为什么现在才出现 MCP 不是因为第 24 课才重要。 它是因为到第 24 课，问题终于变成了 MCP 能解决的问题。 前面几课解决的是“一个 Agent 能不能把工具用对”：
- 第 17 课先把实时订单、物流、库存这类事实从 RAG 和模型常识里分出来，交给业务事实层。
- 第 18 课把业务接口整理成 Tool Calling：工具名、参数 schema、身份边界和结构化 Observation。
- 第 20 课把原始 ToolResult 压缩成安全 Observation，避免把整包接口结果塞回模型。
- 第 21 课把工具超时、模型不可用和降级路径收住。
- 第 23 课再用 Hooks 把调用前校验、调用后摘要、异常降级和完成事件统一治理。
走到这里，单个客服 Agent 内部的 Tool Use 链路已经基本成形。
新的问题不是“模型会不会调用工具”，而是“这些工具能力是不是只能写死在这一版客服 Agent 里”。
如果运营 Agent 也要查库存，售后主管助手也要查退款进度，内部质检 Agent 也要复盘工具调用，难道每个 Agent 都复制一份工具说明、参数 schema、边界资源和 Observation 口径？
复制一次还好。
复制多了以后，工具能力就会开始漂移：有的 Agent 知道物流工具只能查当前登录用户订单，有的 Agent 忘了这个边界；有的 Agent 把退款进度查询写成只读工具，有的 Agent 写成了执行退款。
到这里，MCP 的问题才自然出现：

```latex
已经被 Tool Use 和 Hooks 治理过的工具能力，能不能用一种标准方式提供给多个 Agent 或客户端？
```

所以第 24 课讲 MCP，不是为了给前面的 Tool Use 换一个新名字，而是为了回答一个更靠后的工程问题：当工具已经能被正确调用、正确治理以后，怎样把工具、资源和 Prompt 片段变成可复用、可发现、可统一维护的能力来源。

### Tool Use 和 MCP 不是同一层东西 先把两者分清楚。 Tool Use 关心的是一轮 Agent 里怎么用工具：

| 环节 | Tool Use 负责什么 |
| --- | --- |
| 选择工具 | 当前问题该不该查物流、库存或退款进度 |
| 填参数 | `order_id`、`sku` 从哪里来，缺了要不要澄清 |
| 执行工具 | 调哪个业务能力，怎么处理只读重试 |
| 组织结果 | ToolResult 怎么变成 Observation |
| 收口回答 | 有事实就回答，失败就降级 | MCP 通用上可以标准化提供工具、资源和 Prompt；本课快照先用 MCP-style 目录把三类能力放到同一个可观察来源里：

| 类型 | 在小哲项目里的当前落点 |
| --- | --- |
| Tool | `mcp_catalog/catalog.py` 列出 `get_order_logistics`、`get_product_inventory`、`get_refund_status` 等只读工具定义 |
| Resource | `resource://xiaozhe/...` 承载工具边界和高风险边界说明 |
| Prompt | `prompt://xiaozhe/...` 承载 Observation 口径和高风险转人工口径 | 所以不要把 MCP 理解成“有了 MCP 就不用 Tool Use”。 更准确的说法是：

```latex
MCP 可以成为工具能力的标准化来源。 Tool Use 仍然负责本轮怎么选、怎么填、怎么执行、怎么回答。
```

如果只看工程问题，可以用这张表分清楚：

| 问题 | 由谁解决 |
| --- | --- |
| 有哪些工具、Resource 和 Prompt 可以作为能力来源？

| MCP-style 目录 |
| 这一轮该不该用工具、用哪个工具？

| Tool Use / Planner |
| 参数从哪里来，缺了要不要澄清？

| Tool Use / Clarification |
| 工具真正怎么执行，结果怎么压缩成 Observation？

| 工具执行层 / Observation |
| 调用前后怎么校验、脱敏、降级和记录摘要？

| Hooks |
| 工具定义更新后，多个 Agent 怎样少复制、少漂移？

| MCP-style 目录 | 为了不把第六幕几个词搅在一起，你可以先这样分层：

| 概念 | 管什么 | 不管什么 |
| --- | --- | --- |
| Tool Use | 本轮怎么选工具、填参数、执行工具、接收 Observation。

| 不负责工具能力从哪里被发现和复用。

|
| Hooks | 工具调用前后怎么校验、脱敏、降级和留下安全摘要。

| 不决定业务主路径，也不能审批退款。

|
| MCP | 工具能力怎么标准化暴露给多个 Agent 或客户端。

| 不替代权限校验、Workflow、HITL、Trace 或 Eval。

|
| TaskPlanner | 本轮应该走 RAG、Tool、Tool + RAG 还是高风险分流。

| 不直接查数据库，也不执行退款。

|
| Workflow | 高风险流程按固定节点、状态和条件边推进。

| 不替代人工审批，也不自动解决恢复和幂等。

| 所以第 24 课只解决一件事：工具来源不再只绑死在这一版客服 Agent 里。它不改变前面已经建立的工具执行、治理和高风险边界。

### 读代码前先看三层 下面会出现 `MCPCatalog`、`MCPToolDefinition`、`MCPResource`、`MCPPrompt` 和执行器这些名字。先别急着背类名。 你只看三层：

| 层次 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| MCP-style 目录 | 统一列出工具名、description、参数 schema、Resource 和 Prompt。

| 不决定本轮该不该调用工具。

|
| 候选收窄 | 根据用户问题和风险等级选择少量候选工具。

| 不把所有工具无条件交给模型。

|
| 执行器 | 只在收窄后的工具里发起调用，并沿用 Observation 和 Hooks。

| 不绕过 Runtime Context、权限校验或高风险流程。

| 也就是说，MCP 解决的是“工具能力从哪里统一发现”。这一轮要不要调用、能不能越权、结果能不能信，仍然由 Planner、Runtime Context、工具执行层和治理链路一起决定。

## 代码落地

### 这一版 Agent 怎么改 第 24 课代码快照在：

```latex
code/agent-course-versions/lesson-24-mcp-tool-use/backend/
```

它可以按前面课次的方式启动，用来观察 MCP-style Tool Use、工具说明、Resource / Prompt 绑定和 Hooks 摘要。
这一课只看课程快照。快照在第 23 课模块基础上新增 `mcp_catalog/catalog.py`，并继续保留 `models/answer_client.py`、Observation 和 Hooks 分层。这里不直接叫 `mcp/`，是为了避免和外部 `mcp` 包混淆；课程里你要观察的是“工具能力目录”这一层，而不是把 MCP 当成新的业务服务。
关键代码分在四个位置：

| 位置 | 负责什么 |
| --- | --- |
| `mcp_catalog/catalog.py` | 用 MCP-style 目录统一列出工具、Resource 和 Prompt |
| `tools/contracts.py` | 定义 `MCPToolDefinition`、`MCPResource`、`MCPPrompt` 和内部 `ToolSpec` |
| `agents/customer_service_agent.py` | 读取 MCP-style 目录，选择本轮工具，并把绑定摘要放进响应 |
| `hooks/manager.py` | 继续处理调用前校验、调用后摘要、异常归一和完成事件 | 关键链路是：

```latex
/chat -> MCPCatalog.list_tools() / to_tool_specs() -> 根据用户问题和风险等级收窄候选工具 -> Tool Use 选择本轮工具并组织参数 -> execute_tool_action(...) 调用业务事实层 -> ToolResult -> Observation -> Hooks 继续校验、脱敏、降级和完成摘要 -> ChatResponse(mcp_context, tool_calls, observation)
```

这条链路里最关键的观察点是：

```latex
session_state.mcp.tool_source = mcp_catalog session_state.mcp.resources session_state.mcp.prompts session_state.mcp.boundary
```

它们告诉你：工具能力不再只是一组本地函数名，而是带着工具说明、Resource 边界和 Prompt 口径一起进入本轮 Tool Use 链路。

### MCP-style 目录怎么表达工具、Resource 和 Prompt 第 24 课快照用 `MCPCatalog` 表达 MCP-style 能力目录。 物流工具定义类似这样：

```python
MCPToolDefinition(name='get_order_logistics', description='查询当前登录用户某个订单的物流状态，只读工具。', required=['order_id'], parameters_schema={'order_id': '订单号，例如 SO20260602103000009-a1000009'}, read_only=True, risk_level='low', resource_uris=['resource://xiaozhe/tools/logistics-boundary'], prompt_ids=['prompt://xiaozhe/tool-observation'])
```

这里同时定义了五类信息：

| 信息 | 在这个例子里是什么 |
| --- | --- |
| 工具名 | `get_order_logistics` |
| 参数 schema | `order_id` 必填 |
| 风险等级 | `risk_level = low` |
| Resource 绑定 | `resource://xiaozhe/tools/logistics-boundary` |
| Prompt 绑定 | `prompt://xiaozhe/tool-observation` | Resource 负责讲工具边界：

```latex
物流工具只返回当前登录用户订单的实时物流事实，不能编造包裹位置，也不能查询他人订单。
```

Prompt 负责讲 Observation 口径：

```latex
把工具返回压缩成事实摘要，保留必要字段和 omitted_fields，不把内部调试字段暴露给用户。
```

所以，“MCP-style 目录”不是把工具名写进一个字符串列表。它要把工具说明、参数契约、资源边界和回答口径一起放进可复用能力目录。
这里要守住本课边界：课程快照里的 MCP-style 目录用于观察工具能力怎样被统一组织，不等于已经接入完整远程 MCP Server，也不等于把权限、部署、审计和高风险流程都交给 MCP 处理。
Resource 和 Prompt 在目录里的分工也要分清楚：

| 类型 | 放什么 | 不放什么 | 本课例子 |
| --- | --- | --- | --- |
| Resource | 稳定边界说明、工具使用限制、业务风险提示 | 不放本轮用户隐私、不放即时订单状态 | `resource://xiaozhe/tools/logistics-boundary` 说明物流工具只能查当前登录用户订单 |
| Prompt | 可复用回答口径、Observation 摘要格式、转人工话术边界 | 不放权限判断结果、不替代业务流程 | `prompt://xiaozhe/tool-observation` 说明工具返回要压缩成事实摘要 | 举一个具体例子。上面的 `get_order_logistics` 从 `MCPCatalog` 转成模型可见工具说明时，可以理解成类似这样：

```json
{
  "name": "get_order_logistics",
  "description": "按订单号查询物流信息。物流状态变化频繁，属于 Tool 查询，不属于 RAG 知识库。",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_no": {
        "type": "string"
      }
    },
    "required": [
      "order_no"
    ]
  }
}
```

当用户问：

```latex
查一下订单 SO20260602103000009-a1000009 的物流到哪了
```

Agent 侧拿到这个 MCP tool 后，模型不会直接访问小哲电商数据库，而是在已收窄的候选工具里生成一次工具调用：

```json
{
  "tool_name": "get_order_logistics",
  "arguments": {
    "order_no": "SO20260602103000009-a1000009"
  }
}
```

这次调用不会让模型直接访问数据库。Tool Use 仍然要把参数交给后端执行层，后端再做订单归属校验、业务接口访问、Observation 压缩和风险治理。

### MCP 提供说明，Tool Use 仍然执行 第 24 课最重要的代码点，是这两步。 启动时，Agent 从 `MCPCatalog` 读取工具目录：

```latex
MCPCatalog.list_tools() -> MCPToolDefinition(name, description, required, schema, resource_uris, prompt_ids) -> MCPCatalog.to_tool_specs()
```

执行时，Agent 只把收窄后的工具交给 Tool Use 链路：

```latex
candidate tools -> Tool Use 选择工具和参数 -> execute_tool_action(...) -> Observation -> Hooks
```

用户问：

```latex
查一下 SO20260602103000009-a1000009 的物流到哪了
```

MCP-style 目录能告诉 Agent：
- 有一个 `get_order_logistics` 工具。
- 它需要 `order_id`。
- 它的 description 说明这是按订单号查询物流信息。
- 它绑定了物流边界 Resource 和 Observation 口径 Prompt。
但真正决定“这一轮要不要调用它”的，仍然是 Tool Use 链路。
真正执行业务查询的，也不是模型直接访问数据库，而是 `tools/tool_runtime.py` 里的工具执行函数调用业务事实层。
真正做参数校验、脱敏、异常归一和完成事件的，仍然是 Hooks。
MCP 不是魔法。
它只是把工具能力从“散落在当前 Agent 里的本地函数说明”整理成“标准化目录提供的能力来源”。

### MCP 工具也要先收窄候选 还有一个很容易误解的地方：MCP 目录能列出很多工具，但不代表每一轮都要把所有工具交给模型。 正确链路应该是：

```latex
MCP-style tools list -> 工具目录携带业务域、风险等级、Resource 和 Prompt 绑定 -> 根据用户问题选少量候选工具 -> Tool Use 在候选工具里选择和执行
```

比如用户问物流，候选工具应该优先是订单和物流域；用户问发票规则，更多应该走知识或 FAQ；用户说“直接退款”，高风险创建类工具不能因为 MCP 目录里存在，就被普通轻路径直接放给模型。
所以 MCP 解决“工具从哪里来”，不解决“这一轮该给模型看哪些工具”。工具候选收窄、风险分层、缺参数澄清和高风险分流，仍然属于 Agent Runtime 自己的责任。

## 技术机制补充

### MCP 目录的关键工程经验 课程快照里做 MCP-style 目录，最容易犯的错不是工具调不通，而是把工具列出来以后就当作“治理完成”。 小哲项目这里有几条经验要记住。 第一，MCP 工具不能裸进 Agent。 工具目录至少要带上工具名、description、参数 schema、风险等级、Resource 和 Prompt。只列工具名不够，因为模型不知道这个工具的业务边界。

```latex
risk_level resource_uris prompt_ids
```

未登记风险等级和边界说明的新工具，默认不能进入轻路径。这样就算目录里新增了一个高风险工具，也不会因为“目录里能发现”就被普通客服 Agent 直接暴露给模型。
第二，工具执行仍然必须绑定可信 Runtime Context。
订单、退款、售后、优惠券这类工具不能让模型填写 `user_id`。本课快照仍然通过请求里的运行时上下文判断当前用户、风险等级和订单归属，不能把这些可信事实交给模型参数。
第三，MCP-style 目录只替换工具说明来源，不替换治理链路。
这一课里，规划、缺参澄清、工具执行、Observation 压缩、Hooks 降级和高风险边界仍然在原来的 Agent 链路里。MCP-style 目录只是让工具、Resource 和 Prompt 不再散在各处。
第四，MCP 的 Resource 和 Prompt 能力可以继续扩展，但本课重点是先看工具目录怎样带上边界。
也就是说，这一版不要讲成“资源和 Prompt 已经变成完整生产平台”。当前快照先让物流、库存、退款进度工具带上 Resource 边界和 Prompt 口径；真正的知识运营、权限发布和跨 Agent 复用，还属于后续增强方向。

### 高风险动作仍然不能被 MCP 放行 第 24 课有一个容易误解的地方。 MCP 可以暴露退款资格检查、退款进度查询、审批状态查询这类工具，但这不代表 MCP 可以审批退款。 用户说：

```latex
SO20260602103000009-a1000009 直接退款，马上给我退钱
```

课程快照仍然必须按风险边界处理：
- 查询类工具可以走 MCP。
- 资格判断可以返回依据。
- 创建退款申请、创建售后申请、提交审批申请这类高风险动作不能进入普通轻路径。
- 真正的批准、拒绝、恢复和幂等，要交给后续 Workflow / HITL / `/chat/resume`。
所以 MCP-style 目录里即使能看到相关工具，也不能把它们理解成“模型可以自由调用的退款按钮”。
MCP 解决复用和标准化，不解决高风险业务审批、幂等、防重和审计闭环。

## 怎么验证老板能闭嘴 按本课代码目录的 `README.md` 启动第 24 课快照后，在工作台输入：

```latex
请帮我查一下 SO20260602103000009-a1000009 的物流
```

你应该看到：
- `session_state.mcp.tool_source = mcp_catalog` + `session_state.mcp.selected_tool = get_order_logistics` + `session_state.mcp.resources` 包含物流工具边界 Resource + `session_state.mcp.prompts` 包含 Observation 口径 Prompt + `tool_calls` 里仍然能看到 `get_order_logistics` + ToolResult / Observation 仍然经过 Hooks 摘要和脱敏 + 最终回答仍然基于业务工具 observation，不编造物流事实 这能证明两件事。
第一，工具说明、Resource 和 Prompt 绑定来自本课快照的 MCP-style 目录。
第二，工具来源变了，但 Tool Use、Runtime Context、Hooks 和风险边界没有被 MCP 替代。

## 本节知识总结 MCP 解决的是工具能力如何标准化提供给不同 Agent 的问题。 当工具只写在某一个 Agent 后端里时，别的 Agent 想复用同一批能力，就容易复制工具说明、复制参数 schema、复制边界文案。复制越多，漂移越快。 MCP 的通用价值，是把外部工具能力变成标准化来源。Agent 不必把所有能力说明都散落在自己的执行代码里，而是可以从标准目录发现工具、读取说明、拿到 schema，再交给自己的执行链路治理。

| 知识点 | 核心概念 | 小哲项目里的落点 |
| --- | --- | --- |
| Tool Use  |

一轮请求里选择工具、填写参数、执行工具、接收结果并组织 Observation。

| 小哲客服 Agent 可以查订单、物流、库存等实时事实。

|
| MCP-style 目录 | 用标准方式组织工具名、说明、参数 schema、Resource 和 Prompt。

| `mcp_catalog/catalog.py` 暴露小哲电商工具目录。

|
| MCP Resource | 给工具绑定边界说明和稳定业务说明。

| 物流工具绑定 `resource://xiaozhe/tools/logistics-boundary`。

|
| MCP Prompt | 给工具绑定可复用回答或 Observation 口径。

| 工具结果统一走 `prompt://xiaozhe/tool-observation`。

|
| MCP 与 Hooks | MCP 改变能力来源，Hooks 继续治理调用链路。

| 工具来自 MCP-style 目录，执行前后仍由 Hook 管参数、脱敏、降级和完成摘要。

|
| MCP 与候选收窄 | MCP 提供工具目录，但每轮只应给模型少量相关候选。

| 物流问题只给订单/物流候选，高风险创建工具不进普通轻路径。

|
| MCP 边界 | MCP 不是权限系统，也不替代工作流、HITL、Trace 或 Eval。

| MCP 提供能力说明，但退款、补偿、取消订单仍要走受控流程。

|

## MCP 继续增强时看什么 这一版只是课程快照里的 MCP-style 目录，用来观察工具、Resource 和 Prompt 怎样形成统一能力来源。后续如果把它增强成跨 Agent 可复用的 MCP Server，仍然要按工程系统来验收，不能只看工具能不能调通。 关键检查项是：

| 边界 | 为什么重要 |
| --- | --- |
| 工具来源配置 | 工具目录必须能回退或降级，避免工具来源异常时全链路不可用。

|
| 业务后端配置 | 工具执行仍然必须访问受控业务后端，不能维护另一份订单假数据。

|
| Runtime Context | 当前用户、租户、风险等级不能由模型填写，必须来自登录态、会话或服务端可信上下文。

|
| 工具元数据治理 | 新增 MCP 工具后必须登记业务域、风险等级和轻路径准入策略，默认未知工具不能直接进轻路径。

|
| 连接和部署 | 如果扩展成远程 MCP Server，要考虑 transport、连接池、超时、重连和健康检查。

|
| 审计和限流 | 谁发现工具、谁调用工具、调用失败率、异常频率和高风险命中，都要进入 trace、log 和 monitor。

|
| 高风险闭环 | 退款、补偿、取消订单不能因为走 MCP 就绕过 Workflow、HITL、幂等和审批。

| 更重要的是，MCP 不会把退款、补偿、取消订单变成普通工具按钮。 这些动钱动作仍然需要后续受控流程和人工确认。

## 第六幕收束：工具不再散，能力也不再死绑 到这里，第六幕的问题终于闭合了。 第 23 课让工具链路有了统一治理点。 第 24 课让工具说明、边界 Resource 和回答 Prompt 不再散落在这一版客服 Agent 的执行代码里。 现在的小哲电商客服 Agent，已经能查订单、物流、库存，也能在工具链路里做参数校验、错误降级、安全摘要，并且知道工具定义可以来自标准化目录。 但你并没有因此真的放心。 能查、能管还不够。 真正危险的是用户让它动钱。 退款、补偿、取消订单这些动作，不能交给自由发挥的 Agent。 小哲心里隐隐觉得：

> 下一幕，该把高风险动作关进流程里了。

> > 代码同步说明：从本课开始，课程快照会尽量使用真实 OpenAI 兼容大模型生成最终客服话术。Tool、RAG、Workflow、Runtime Context 和安全模块先产出受控事实与边界，模型负责把这些事实组织成自然回复；只有模型不可用、测试隔离、低置信或安全边界触发时，才回退到确定性话术。
> >
