# Functional API：用 `@entrypoint` 和 `@task` 构建函数式工作流

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396395378-4a41a10a-ca53-490b-83a0-0de891725895.png" title="null" crop="0,0,1,1" id="sYXV3" class="ne-image">

本节总览图：这张图左右对比两种 LangGraph 构建方式。左侧是 Graph API：`StateGraph -> state -> nodes -> edges -> compile`；右侧是 Functional API：`@entrypoint workflow -> 普通 Python if/for/function call -> @task long-running work -> invoke/stream`。底部画共同运行时：checkpoint、streaming、interrupt、resume。图中要强调两者共享 LangGraph 底层能力，但表达工作流的方式不同。

## 课程目标

学完这一节，你应该能说清：
- LangGraph 不只有 Graph API，也有 Functional API。
- `@entrypoint` 解决什么问题。
- `@task` 解决什么问题。
- Functional API 和 Graph API 的核心区别。
- 为什么 `@task` 对持久化恢复和避免重复副作用很重要。
- Functional API 中如何使用 `invoke`、`stream` 和 `Command(resume=...)`。
- 什么时候更适合用 Graph API，什么时候可以考虑 Functional API。

---

## 1. 为什么需要 Functional API 前面第 21 课讲的是 Graph API。它的核心是：

```latex
StateGraph -> 定义 State -> 添加 node -> 添加 edge -> compile
```

这种方式适合显式表达流程图，尤其适合：
- 多节点。
- 多分支。
- 需要可视化。
- 需要清晰状态结构。
- 需要精确控制路由。
但不是所有工作流一开始都适合改造成显式图。
很多已有代码本来就是普通 Python 函数：

```latex
if 条件判断 for 循环 函数调用 API 调用 中间人工确认
```

Functional API 的目标是：在尽量少改造现有代码结构的前提下，把 LangGraph 的持久化、streaming、interrupt、resume 等能力加进去。

---

## 2. Functional API 的两个核心装饰器 Functional API 主要有两个构建块：

| 装饰器 | 作用 |
| --- | --- |
| `@entrypoint` | 标记一个函数作为工作流入口 |
| `@task` | 标记一个独立工作步骤，例如 API 调用、数据处理、LLM 调用 | 最小心智模型：

```latex
@entrypoint def workflow(input): result = task_a(input).result() if 条件: result2 = task_b(result).result() return output
```

`@entrypoint` 定义“整个工作流怎么走”。
`@task` 定义“哪些独立步骤需要被 LangGraph 管理、缓存结果、参与恢复”。

---

## 3. `@entrypoint`：工作流入口 `@entrypoint` 把一个普通函数变成 LangGraph 可执行对象。这个对象可以使用：
- `invoke` + `ainvoke` + `stream` + `astream` 示例：

```python
from langgraph.checkpoint.memory import InMemorySaver from langgraph.func import entrypoint @entrypoint(checkpointer=InMemorySaver()) def after_sale_workflow(payload: dict) -> dict: order_no = payload["order_no"] reason = payload["reason"] return { "order_no": order_no, "reason": reason, "status": "received", }
```

调用方式和图类似：

```python
config = {"configurable": {"thread_id": "after_sale_001"}} result = after_sale_workflow.invoke( {"order_no": "20260001", "reason": "七天无理由"}, config, )
```

注意：为了支持 checkpoint，entrypoint 的输入和输出应该是可序列化的数据。基础课里你可以先理解为：优先使用字符串、数字、布尔值、列表、字典这类 JSON 友好的结构。

---

## 4. `@task`：可持久化的独立工作步骤 `@task` 用来标记一个独立工作步骤。这个步骤通常有明确输入和输出，适合被 LangGraph 记录结果、参与恢复。 例如：

```python
from langgraph.func import task @task def lookup_order(order_no: str) -> dict: return { "order_no": order_no, "status": "delivered", "category": "digital_accessory", }
```

在 entrypoint 里调用 task 时，返回的是类似 future 的对象。同步代码里常用 `.result()` 取结果：

```python
order = lookup_order(order_no).result()
```

为什么不直接调用普通函数？
因为 `@task` 的结果可以和 checkpoint 结合。工作流恢复时，已经成功完成的 task 结果可以从 checkpoint 中读取，而不是重复执行。
这对电商系统很重要。查询订单通常问题不大，但创建审批单、调用外部接口、发通知这类动作如果重复执行，可能造成业务错误。

---

## 5. Functional API 和 Graph API 对比

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396396339-3d08b936-5a77-440a-a117-166a012de644.png" title="null" crop="0,0,1,1" id="JNfvM" class="ne-image">

Graph API 与 Functional API 对比图：这张图左侧用流程图表示 Graph API：`State schema -> node A -> conditional edge -> node B/C -> END`。右侧用代码块表示 Functional API：`@entrypoint` 内部使用 `if`、`for`、函数调用和 `@task`。中间标出共同能力：checkpoint、interrupt、streaming、resume。图中要强调 Graph API 更显式、易可视化；Functional API 更贴近普通 Python 控制流。

| 对比项 | Graph API | Functional API |
| --- | --- | --- |
| 核心写法 | `StateGraph`、node、edge | `@entrypoint`、`@task` |
| 控制流 | 显式边和条件边 | 普通 Python `if` / `for` / 函数调用 |
| 状态管理 | 显式 State schema 和 reducer | 状态更局部，围绕函数和 task |
| 可视化 | 更适合画成图 | 不强调静态可视化 |
| 适合场景 | 复杂流程、清晰状态机、多分支 | 现有代码改造、函数式流程、少量控制流 |
| checkpoint | superstep 后产生 checkpoint | entrypoint invocation 和 task 结果都可以进入 checkpoint | 两者不是互相替代。你可以先用 Functional API 给已有流程加持久化和 interrupt；当流程变复杂、节点和分支需要更清晰表达时，再改成 Graph API。

---

## 6. `@task` 和 resume：避免重复执行已完成工作 第 23 课会讲持久化恢复，第 24 课会讲 interrupt。这里先建立一个关键意识：

```latex
Functional API 恢复时会从 entrypoint 开头重新执行。 但已经完成并保存的 task，可以直接读取结果，不必重新计算。
```

例如：

```python
from langgraph.checkpoint.memory import InMemorySaver from langgraph.func import entrypoint, task from langgraph.types import interrupt @task def generate_review_summary(order_no: str) -> str: return f"订单 {order_no} 的售后审核摘要" @entrypoint(checkpointer=InMemorySaver()) def review_workflow(order_no: str) -> dict: summary = generate_review_summary(order_no).result() approved = interrupt({"summary": summary, "action": "请审批"}) return {"summary": summary, "approved": approved}
```

如果工作流在 `interrupt()` 暂停后恢复，entrypoint 会从开头重新执行。但 `generate_review_summary` 这个 task 已经成功完成，结果可以从 checkpoint 读取，避免重复生成。
这就是 `@task` 的工程价值：把可能耗时、昂贵或有副作用的步骤交给 LangGraph 管理。
Functional API 里 checkpoint 不只保存 task 结果。只要 `@entrypoint(checkpointer=...)` 配置了 checkpointer，同一个 `thread_id` 上的 invocation 信息也会被保存。`@task` 的价值是进一步把独立工作步骤的结果保存下来，恢复时避免重复执行已经完成的工作。
至于 checkpoint 是在什么时候写入持久化存储，以及性能和一致性之间怎么取舍，第 23 课会用 durability modes 继续展开。

---

## 7. Human-in-the-loop 中的 `Command(resume=...)` Functional API 也可以使用 `interrupt()` 和 `Command(resume=...)`。 示例：

```python
from langgraph.types import Command, interrupt @entrypoint(checkpointer=InMemorySaver()) def refund_review(payload: dict) -> dict: approved = interrupt({ "order_no": payload["order_no"], "amount": payload["amount"], "action": "是否批准退款？", }) return {"approved": approved} config = {"configurable": {"thread_id": "refund_001"}} refund_review.invoke( {"order_no": "20260001", "amount": 99}, config, ) refund_review.invoke( Command(resume=True), config, )
```

这里的 `Command(resume=True)` 和第 21 课讲的一样：它是作为 `invoke` / `stream` 的输入传入，用来恢复暂停的执行，不是从普通函数内部返回。

---

## 8. 可注入参数：previous、store、writer、config 官方文档说明，`@entrypoint` 可以声明一些运行时注入参数。基础阶段先知道它们的用途即可：

| 参数 | 用途 |
| --- | --- |
| `previous` | 读取同一 thread 上一次 checkpoint 保存的值 |
| `store` | 访问长期存储 |
| `writer` | 写入自定义 streaming 信息 |
| `config` | 读取本次运行配置 | 例如：

```python
@entrypoint(checkpointer=InMemorySaver()) def workflow(payload: dict, *, previous: dict | None = None) -> dict: count = (previous or {}).get("count", 0) + 1 return {"count": count, "payload": payload}
```

这和前面课程讲过的 runtime、store、stream writer 是同一类思想：工作流不只依赖用户输入，也可能需要运行时上下文、长期存储和流式输出能力。
默认情况下，`previous` 读取的是同一 `thread_id` 上一次 entrypoint invocation 保存的值。多数基础场景直接返回字典就够了。
官方还提供 `entrypoint.final`，可以把“返回给调用方的值”和“保存到 checkpoint、供下次 `previous` 读取的值”分开。这个能力适合更精细的状态设计，基础课了解即可，不需要现在掌握。

---

## 9. 什么时候选哪一个 API 推荐判断：

```latex
如果你想清楚画出流程图、节点边界和路由： -> 优先 Graph API 如果你已有一段普通 Python 流程，只想加 checkpoint / interrupt / streaming： -> 可以考虑 Functional API 如果流程会长期演化成多个节点、多个分支、多团队协作： -> Graph API 更清晰 如果只是把少量函数组合成一个可恢复工作流： -> Functional API 更轻量
```

电商客服与售后完整项目课仍然会优先使用 Graph API，因为项目课需要清晰展示意图识别、订单查询、政策检索、人工确认、生成回复等节点关系。
Functional API 的价值是补全你的 LangGraph 知识体系：以后你看到官方文档、已有项目或轻量流程时，不会误以为 LangGraph 只能写 `StateGraph`。

---

## 10. 常见错误

### 错误一：以为 LangGraph 只有 StateGraph Graph API 是重要入口，但不是唯一入口。Functional API 也是官方构建工作流的方式。

### 错误二：把所有普通函数都加 `@task` `@task` 适合耗时、昂贵、可能失败、需要持久化结果或有副作用的步骤。普通字符串处理、简单字段拼接不一定需要 task。

### 错误三：忽略序列化要求 entrypoint 输入输出和 task 输出要适合 checkpoint。不要随便返回数据库连接、文件句柄、函数对象或复杂类实例。

### 错误四：误以为 Functional API 更适合所有场景 Functional API 轻量，但不如 Graph API 直观展示复杂流程。复杂状态机、多人协作和可视化调试场景，Graph API 往往更合适。

---

## 11. 本节知识框架总结

```latex
Functional API -> @entrypoint：工作流入口 -> @task：独立工作步骤 -> invoke / stream：执行工作流 -> Command(resume=...)：恢复 interrupt -> previous / store / writer / config：运行时注入参数 -> entrypoint invocation 可在同一 thread_id 上保存信息 -> task 结果可被 checkpoint 保存 -> entrypoint.final 可分离返回值和保存值 -> Graph API 更显式，Functional API 更贴近普通 Python 控制流
```

## 12. 本节小结 你需要记住：
1. LangGraph 有 Graph API 和 Functional API 两种高层构建方式。
2. `@entrypoint` 把函数变成可执行、可 checkpoint、可 stream 的工作流入口。
3. `@task` 表示一个可被 LangGraph 管理的独立工作步骤。
4. Functional API 可以用普通 Python `if`、`for` 和函数调用表达流程。
5. `previous` 可以读取同一 thread 上一次保存的值。
6. 复杂可视化流程仍然更适合 Graph API。
课后练习：
1. 用 `@entrypoint` 写一个最小售后审核工作流。
2. 把查询订单封装成一个 `@task`。
3. 说明 `@task` 和普通函数调用的区别。
4. 比较同一个售后流程用 Graph API 和 Functional API 表达时的差异。
