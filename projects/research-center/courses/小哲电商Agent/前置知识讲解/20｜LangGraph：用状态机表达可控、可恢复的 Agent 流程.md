# LangGraph：用状态机表达可控、可恢复的 Agent 流程

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396393894-640800c5-acc7-4997-a769-c7e252c0337e.png" title="null" crop="0,0,1,1" id="J8bKL" class="ne-image">

本节总览图：这张图左侧画普通 `create_agent` 的 `model -> tools -> model` 循环，右侧画 LangGraph 的 `StateGraph`，包含多个明确节点：识别意图、查订单、检索政策、人工确认、生成回复。中间用箭头标注：当流程需要明确状态、分支、持久化、人工介入和恢复时，就从简单 Agent 封装走向 LangGraph。

## 课程目标

学完这一节，你应该能说清：
- 为什么简单 Agent 不够表达复杂业务流程。
- LangGraph 解决哪些 Agent 编排问题。
- durable execution、streaming、human-in-the-loop 和 persistence 的价值。
- StateGraph 和状态机思维的关系。
- 电商售后流程为什么适合用图表达。
- 为什么 LangGraph 不是替代 `create_agent`，而是显式编排复杂步骤。

---

## 1. 为什么需要 LangGraph 前面你已经学过工具调用、RAG、短期记忆、长期记忆和 Runtime 上下文。 这些能力单独都能工作：
- 工具调用可以查订单、库存、物流等实时业务数据。
- RAG 可以检索商品说明、售后政策、发票规则等知识资料。
- 短期记忆可以接住同一会话里的上下文。
- 长期记忆可以保存跨会话的稳定偏好。
- Runtime 上下文可以把 user_id、tenant_id、channel 等运行时信息传给工具。
但真实客服流程不是把这些能力随机堆在一起。它往往需要明确顺序和边界：

```latex
先识别用户意图 -> 再判断是否需要订单信息 -> 如果需要，查订单 -> 如果涉及政策，检索知识库 -> 如果涉及退款、赔付或规则例外，进入人工确认 -> 最后基于已确认的信息生成回复
```

这就是 LangGraph 要解决的问题。

> LangGraph 不是替代 `create_agent`，而是让你能显式编排工具、RAG、记忆、Runtime 和人工确认这些步骤。

> 简单客服 Agent 可以是：

```latex
用户问题 -> 模型 -> 工具 -> 模型 -> 回答
```

但真实业务流程经常更复杂：

```latex
识别问题类型 -> 查订单 -> 判断是否售后 -> 检索政策 -> 判断是否高风险 -> 必要时人工确认 -> 生成回复 -> 记录处理结果
```

如果全部藏在一个 prompt 或一个函数里，流程会越来越难调试、难恢复、难测试。
LangGraph 的价值是：

```latex
把 Agent 流程拆成明确的状态、节点和边。
```

---

## 2. LangGraph 关注的核心能力 官方概览里强调 LangGraph 面向 Agent 编排的底层能力，包括：
- Durable execution：失败后可以恢复。
- Streaming：可以观察执行过程。
- Human-in-the-loop：可以在关键点暂停等待人工。
- Persistence：可以保存状态。
- 状态图：用节点和边表达流程。
这些能力不是为了让代码更复杂，而是为了让复杂流程可控。

---

## 3. 状态机思维

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396394386-fc6f59ed-1c58-4255-98c7-cf00b2a82aab.png" title="null" crop="0,0,1,1" id="lzF8a" class="ne-image">

状态机思维图：这张图从 `State` 开始，连接多个 `Node`。每个节点读取 state、执行一小步、返回 state update；边根据固定规则或条件函数决定下一个节点。图中标注“不要把所有逻辑写进一个节点”，强调节点职责单一，状态显式传递。
你可以把 LangGraph 理解成：

```latex
状态记录当前流程知道什么 节点负责做一件事 边负责决定下一步去哪里
```

电商售后例子：

| 节点 | 职责 |
| --- | --- |
| `classify_request` | 判断是订单、物流、售后还是普通咨询 |
| `lookup_order` | 查询订单状态 |
| `retrieve_policy` | 检索售后政策 |
| `need_human_review` | 判断是否需要人工确认 |
| `draft_reply` | 生成回复 | ---

## 4. 什么时候不用 LangGraph 不是所有 Agent 都需要你自己用 `StateGraph` 定义状态、节点和边。 这里说的“自己定义图”，指的是你显式编写：
- State：流程中要保存哪些数据。
- Node：每一步由哪个函数执行。
- Edge：节点之间如何流转。
- 条件路由：不同情况进入哪个分支。
如果只是一个简单的工具调用 Agent，使用 LangChain 提供的 agent 构建函数 `create_agent` 通常已经足够；只有当流程需要明确分支、恢复、人工确认或节点级测试时，才需要自己设计 LangGraph。
不需要 LangGraph 的场景：
- 单轮问答。
- 固定工具循环。
- 没有人工确认。
- 不需要状态恢复。
- `create_agent` 已经足够。
需要 LangGraph 的场景：
- 多步骤业务流程。
- 复杂条件分支。
- 长时间运行。
- 需要人工审批。
- 需要持久化、恢复和时间旅行。
- 需要明确测试每个节点。

---

## 5. 最小 LangGraph 长什么样 在进入第 21 课的具体 API 之前，你先看 LangGraph 最小结构长什么样。 一个最小 LangGraph 通常包含四类东西：

| 元素 | 作用 | 你可以先怎么理解 |
| --- | --- | --- |
| State | 图运行时携带的数据 | 当前流程的“工作台” |
| Node | 执行一步逻辑的函数 | 做一件具体事情 |
| Edge | 节点之间的连接 | 下一步去哪里 |
| START / END | 图的入口和出口 | 从哪里开始，到哪里结束 |

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396393995-d3b16a3e-c6bb-439e-a43c-7726547478a3.png" title="null" crop="0,0,1,1" id="ntow0" class="ne-image">

最小 LangGraph 结构预览图：这张图从 `START` 开始，箭头指向 `answer_node`，再指向 `END`。图下方画一个 `State` 盒子，包含 `question` 和 `answer` 两个字段；`answer_node` 从 State 读取 `question`，返回 `{"answer": ...}` 更新 State。图中要强调节点不是直接修改全局变量，而是接收 state、返回 state update。
最小流程可以先用伪代码理解：

```latex
定义 State：图里要保存 question 和 answer 定义 Node：读取 question，生成 answer 连接 Edge：START -> Node -> END compile：把图编译成可运行对象 invoke：传入初始 state，得到最终 state
```

对应到代码就是：

```python
from typing import TypedDict from langgraph.graph import StateGraph, START, END class State(TypedDict): question: str answer: str def answer_node(state: State) -> dict: return {"answer": f"收到问题：{state['question']}"} builder = StateGraph(State) builder.add_node("answer", answer_node) builder.add_edge(START, "answer") builder.add_edge("answer", END) graph = builder.compile() print(graph.invoke({"question": "订单怎么查？", "answer": ""}))
```

观察点：
- State 明确定义流程数据。
- node 接收 state，返回更新。
- edge 决定执行顺序。
- compile 后才得到可运行 graph。
第 21 课会把这里出现的 Graph API，也就是 `StateGraph`、`add_node`、`add_edge`、`add_conditional_edges`、reducer 和 `Command` 分别拆开讲。第 22 课会补充另一种官方构建方式 Functional API，也就是用 `@entrypoint` 和 `@task` 表达函数式工作流。

---

## 6. 本节知识框架总结

```latex
LangGraph -> 用图表达 Agent 流程 -> State 记录数据 -> Node 执行一步 -> Edge 决定下一步 -> START / END 表示入口和出口 -> 支持持久化、流式、人类介入、恢复 -> 简单场景先用 create_agent
```

## 7. 本节小结 你需要记住：
1. LangGraph 适合复杂、可控、可恢复的 Agent 流程。
2. 图不是为了炫技，而是为了让流程显式。
3. 状态、节点和边是 LangGraph 的基础。
4. 简单工具 Agent 先用 `create_agent`，复杂流程再用 LangGraph。
5. LangGraph 是编排层，用来组合工具、RAG、记忆、Runtime 和人工确认。
课后练习：
1. 把售后处理流程拆成 5 个节点。
2. 判断一个订单查询 Agent 是否需要 LangGraph。
3. 解释 durable execution 对售后审批的价值。
4. 画出“查订单 -> 查政策 -> 生成回复”的图。
