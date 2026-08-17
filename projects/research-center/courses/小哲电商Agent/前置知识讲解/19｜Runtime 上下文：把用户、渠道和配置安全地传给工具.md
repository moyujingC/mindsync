# Runtime 上下文：把用户、渠道和配置安全地传给工具

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396393722-24d69262-b673-44b9-b013-9e2e46e1f084.png" title="null" crop="0,0,1,1" id="emy6X" class="ne-image">

本节总览图：这张图从左到右画出 `应用层请求 -> context_schema -> agent.invoke(context=...) -> ToolRuntime.context -> tool`。旁边画 `messages` 作为模型可见输入，和 `runtime.context` 作为工具可见运行时信息，两者用边界线分开，强调 user_id、tenant_id、channel 不应让模型随意生成。

## 课程目标

学完这一节，你应该能说清：
- Runtime context 解决什么问题。
- `context_schema` 如何定义运行时上下文结构。
- `ToolRuntime[Context]` 如何在工具中读取上下文。
- Runtime context 和 messages、state、store 的区别。
- 电商系统里 user_id、channel、tenant_id 为什么应该走 runtime。
- 运行时上下文不能替代权限校验。

---

## 1. 为什么需要 Runtime context 用户问：

```latex
帮我查我的订单。
```

模型能看到“我的订单”，但真正查询时，系统必须知道：
- 当前登录用户 ID。
- 当前店铺或租户。
- 当前渠道。
- 当前权限范围。
- 当前请求的 trace 或 metadata。
这些信息来自应用层，不应该让模型从自然语言里猜。
Runtime context 要解决的是：

```latex
把本次运行所需的外部配置和身份信息，以结构化方式传给 Agent 和工具。
```

---

## 2. context_schema 你可以用 dataclass 定义上下文结构：

```python
from dataclasses import dataclass @dataclass class RequestContext: user_id: str tenant_id: str channel: str
```

创建 agent 时声明：

```python
agent = create_agent(model=model, tools=[get_my_orders], context_schema=RequestContext)
```

调用时传入：

```python
result = agent.invoke({'messages': [{'role': 'user', 'content': '帮我查我的订单'}]}, context=RequestContext(user_id='user_123', tenant_id='shop_001', channel='web'))
```

---

## 3. 工具读取 runtime.context

```python
from dataclasses import dataclass from langchain.tools import tool, ToolRuntime @dataclass class RequestContext: user_id: str tenant_id: str channel: str @tool def get_my_orders(runtime: ToolRuntime[RequestContext]) -> str: """查询当前用户的订单列表。""" return ( f"正在为用户 {runtime.context.user_id} " f"查询店铺 {runtime.context.tenant_id} 的订单。" )
```

注意：`user_id` 不来自模型参数，来自 runtime context。

---

## 4. Runtime context 和其他上下文的区别

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396393794-eb1892fe-8e00-4a0e-924d-6936e3e733a4.png" title="null" crop="0,0,1,1" id="gYaQl" class="ne-image">

Runtime 与其他上下文对比图：这张图四列对比 `messages`、`state`、`runtime.context`、`store`。messages 标注模型可见对话；state 标注图运行中的可变状态；runtime.context 标注本次运行传入、不可变、工具可读；store 标注跨会话长期存储。图中用锁图标强调身份、租户和渠道应来自 runtime context。

| 概念 | 生命周期 | 是否应由模型填写 |
| --- | --- | --- |
| messages | 当前模型上下文 | 用户内容来自用户，模型回复来自模型 |
| state | 当前图运行 | 否，由图节点更新 |
| runtime.context | 本次运行配置 | 否，由应用层传入 |
| store | 跨会话长期存储 | 否，由工具或系统读写 | ---

## 5. Runtime context 不是权限系统 Runtime context 可以告诉工具当前是谁，但不能替代权限校验。 错误想法：

```latex
只要 runtime.context.user_id 存在，就允许查所有订单。
```

正确做法：

```latex
工具拿到 user_id 和 order_no -> 调用业务系统 -> 业务系统校验该用户是否有权访问订单 -> 返回允许或拒绝
```

Agent 不能绕过业务权限。

---

## 6. 可运行 Demo：用上下文控制查询范围

```python
from dataclasses import dataclass from langchain.tools import tool, ToolRuntime ORDERS = { "user_123": ["20260001", "20260002"], "user_456": ["20260003"], } @dataclass class RequestContext: user_id: str channel: str @tool def list_my_orders(runtime: ToolRuntime[RequestContext]) -> list[str]: """查询当前用户自己的订单号列表。""" return ORDERS.get(runtime.context.user_id, [])
```

观察点：
- 工具没有让模型传 `user_id`。
- 查询范围来自 runtime context。
- 真实系统仍要在后端做权限校验。

---

## 7. 常见错误

### 错误一：让模型从用户输入里提取 user_id 用户可以伪造 ID。身份信息必须来自认证后的应用层。

### 错误二：把 runtime context 写进 system prompt 不必要时不要把 user_id、tenant_id 等敏感信息暴露给模型。

### 错误三：把 runtime context 当成长期记忆 Runtime context 是本次运行输入，不负责跨会话持久保存。

---

## 8. 四类上下文总对比 第 6 课里，我们建立过四类上下文：

```latex
Model context Tool context State Runtime context
```

到这里，你已经分别学过它们在 LangChain / LangGraph 中的具体落点。

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396393260-2e160787-9c8c-4699-ad6c-75b39dd9d854.png" title="null" crop="0,0,1,1" id="kw88b" class="ne-image">

四类上下文总对比图：这张图中心是 `Agent run`。左侧画 `Model context` 指向 Chat model，包含 system prompt、messages、tools、response_format；下方画 `Tool context` 指向 tool function，包含工具参数、ToolRuntime、工具返回；右侧画 `State`，标注随图运行变化并可由 checkpointer 保存；上方画 `Runtime context`，标注由应用层在本次运行传入，包含 user_id、tenant_id、channel。图中要用边界线强调：模型可见内容、工具可见内容、图状态和应用层配置不是同一个东西。

| 上下文类型 | 谁主要使用 | 生命周期 | 典型内容 | 课程对应 | 电商例子 |
| --- | --- | --- | --- | --- | --- |
| Model context | Chat model | 单次模型调用 | system prompt、messages、可见工具定义、结构化输出 schema | 第 6 课、第 5-8 课 | 让模型看到当前问题、精选历史、政策片段 |
| Tool context | Tool function | 单次工具调用 | 工具参数、`ToolRuntime`、工具返回、错误信息 | 第 9-11 课 | `get_order_status(order_no)` 读取订单号并返回订单状态 |
| State | LangGraph / Agent run | 当前 thread 或图运行 | messages、已查订单、检索结果、审批状态 | 第 17 课、第 20-22 课 | 同一会话里记住用户刚刚说“明天出差” |
| Runtime context | 应用层传入，工具或节点读取 | 本次运行 | user_id、tenant_id、channel、权限范围、配置 | 第 19 课 | 当前登录用户是 `user_123`，渠道是 web | 最容易混淆的是这几组：

| 容易混淆 | 正确区分 |
| --- | --- |
| Model context vs State | Model context 是本次模型调用看到的内容；State 是图运行中保存和传递的数据 |
| Tool context vs Runtime context | Tool context 包含工具执行所需的一切；Runtime context 是其中由应用层传入的身份和配置 |
| State vs Runtime context | State 会随流程变化；Runtime context 通常是本次运行的不可变输入 |
| Runtime context vs 长期记忆 | Runtime context 不负责持久保存；长期记忆通过 store 跨会话保存  |

一个判断方法是问四个问题：

```latex
模型需要看到吗？如果需要，放进 Model context。 工具执行需要吗？如果需要，放进 Tool context。 流程后续节点还要用吗？如果需要，放进 State。 这是应用层已认证的身份或配置吗？如果是，放进 Runtime context。
```

---

## 9. 本节知识框架总结

```latex
Runtime context -> context_schema 定义结构 -> invoke(context=...) 传入 -> ToolRuntime[Context].context 读取 -> 身份、渠道、租户来自应用层 -> 不由模型生成 -> 不替代业务权限校验 -> Model context / Tool context / State / Runtime context 边界要分清
```

## 10. 本节小结 你需要记住：
1. Runtime context 用来传递本次运行的身份和配置。
2. `context_schema` 让上下文结构明确。
3. 工具通过 `ToolRuntime.context` 读取上下文。
4. user_id、tenant_id、channel 不应该让模型填写。
5. Runtime context 是权限校验的输入，不是权限校验本身。
6. 四类上下文分别服务模型调用、工具执行、图状态传递和应用层运行配置。
课后练习：
1. 为客服渠道定义一个 `RequestContext`。
2. 写一个只能查询当前用户订单的工具。
3. 说明 runtime context 和长期记忆的区别。
4. 列出哪些字段不应该放进模型消息。
5. 分别举例说明 Model context、Tool context、State、Runtime context 应该放什么。
