# 短期记忆：让 Agent 在同一会话里接住上下文

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396392761-187569a5-507a-48b6-9bfb-9f822702078c.png" title="null" crop="0,0,1,1" id="hJAfh" class="ne-image">

本节总览图：这张图从左到右画出 `thread_id -> checkpointer -> state["messages"] -> model`。同一个 `thread_id` 的多轮输入会读取同一条线程状态，不同 `thread_id` 互相隔离。下方画消息裁剪、删除和摘要三种管理方式，强调短期记忆有上下文窗口限制。

## 课程目标

学完这一节，你应该能说清：
- 短期记忆解决什么问题。
- thread 和 message history 的关系。
- LangGraph checkpointer 如何让状态跨轮保留。
- 为什么短期记忆只在同一 thread 内有效。
- 消息历史太长时可以裁剪、删除或摘要。
- 电商多轮咨询为什么需要短期记忆。

---

## 1. 为什么需要短期记忆 用户不会每轮都把信息说全：

```latex
用户：我明天出差，要买个降噪耳机。 用户：这款能赶上吗？ 用户：那如果不合适可以退吗？
```

第二句里的“这款”、第三句里的“不合适”都依赖前文。没有短期记忆，模型不知道用户说的是哪款商品、什么时间约束、什么诉求。
短期记忆要解决的是：

```latex
同一会话内，Agent 能看到必要的历史上下文。
```

这里的“短期”和“长期”不是按保存时间长短命名，而是按**召回范围**区分。短期记忆是 thread-scoped state：它属于一条会话线程，只在同一个 `thread_id` 内被读取和延续。

---

## 2. thread：短期记忆的隔离单位 同一个用户也可能有多个会话。LangGraph 里常用 `thread_id` 标识一条会话线程。

```latex
thread_id = "customer_001_session_a"
```

同一个 `thread_id`：
- 能接上前面的消息。
- 能看到之前工具结果。
- 能恢复当前会话状态。
不同 `thread_id`：
- 状态隔离。
- 不应该互相看到对方上下文。

---

## 3. checkpointer 保存状态

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396379278-a51802cd-a3f1-495f-9ab4-6059bd9c1bfc.png" title="null" crop="0,0,1,1" id="y2hKA" class="ne-image">

checkpointer 短期记忆图：这张图画出两条 thread：`thread_a` 和 `thread_b`。每条 thread 连接到 checkpointer 中不同的 checkpoint 序列，再连接到各自的 `state["messages"]`。图中要强调同一 thread 多轮复用状态，不同 thread 隔离，不能串话。
概念代码：

```python
from langgraph.checkpoint.memory import InMemorySaver checkpointer = InMemorySaver() graph = builder.compile(checkpointer=checkpointer) config = {"configurable": {"thread_id": "customer_001"}} graph.invoke({"messages": [{"role": "user", "content": "我想买降噪耳机"}]}, config) graph.invoke({"messages": [{"role": "user", "content": "这款能明天到吗？"}]}, config)
```

第二次调用可以读取同一 thread 的历史状态。
`messages` 是最常见的短期状态，但短期记忆不只等于消息列表。只要是当前 thread 内需要延续的状态，都可以放在 graph state 里，例如当前任务查到的工具结果、检索结果、上传文件摘要或生成的 artifact。基础课先用 `messages` 理解，因为它最贴近多轮对话。

---

## 4. 短期记忆不是长期记忆 短期记忆适合：
- 当前会话消息。
- 当前任务中查到的工具结果。
- 当前用户刚刚补充的信息。
不适合：
- 长期偏好。
- 跨会话用户画像。
- 永久保存的发票抬头。
- 跨用户共享配置。
这些属于长期记忆或业务数据库。

---

## 5. 管理消息历史 消息历史会越来越长，需要管理。 常见方式：

| 方式 | 适合场景 |
| --- | --- |
| Trim messages | 保留最近消息或重要消息 |
| Delete messages | 删除无用或敏感消息 |
| Summarize messages | 把旧对话压缩成摘要 |

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396392437-ef4e2b55-242b-4692-87dd-4e18f2fc9db0.png" title="null" crop="0,0,1,1" id="RtUo2" class="ne-image">

消息历史管理图：这张图左侧是一长串 messages，分成最近消息、过期工具结果、敏感信息和旧对话。右侧画三种处理：保留最近消息、删除敏感或无关消息、把旧对话压缩为 summary。箭头最终汇入模型上下文。

---

## 6. 可运行 Demo：手写会话记忆 这个 demo 不依赖 LangGraph，只展示短期记忆的基本概念。

```python
# 这里只用内存字典演示短期记忆概念。 # 真实系统要用 LangGraph checkpointer 持久化 thread 状态，而不是普通内存字典。 threads: dict[str, list[dict]] = {} def add_message(thread_id: str, role: str, content: str) -> list[dict]: history = threads.setdefault(thread_id, []) history.append({"role": role, "content": content}) return history add_message("customer_001", "user", "我明天出差，想买降噪耳机。") add_message("customer_001", "assistant", "可以优先看支持快速配送的降噪耳机。") history = add_message("customer_001", "user", "这款能赶上吗？") print(history)
```

观察点：
- 同一个 thread 保留历史。
- 新问题可以和前文一起进入模型。
- 真实系统要用 checkpointer，而不是普通内存字典。

---

## 7. 常见错误

### 错误一：所有用户共享同一个历史 这是严重的隐私和业务错误。thread 必须隔离。

### 错误二：把所有历史永久塞给模型 短期记忆要管理，不能无限增长。

### 错误三：把短期记忆当用户画像 用户本轮说“想买耳机”，不代表永远偏好耳机。

---

## 8. 本节知识框架总结

```latex
短期记忆 -> 同一 thread 内保留状态 -> checkpointer 保存和恢复 state -> messages 是最常见短期状态 -> 也可以包含工具结果、检索结果和当前任务 artifact -> 不同 thread 隔离 -> 历史过长需要 trim / delete / summarize -> 不等于长期记忆
```

## 9. 本节小结 你需要记住：
1. 短期记忆让 Agent 能接住同一会话上下文。
2. `thread_id` 是状态隔离的关键。
3. checkpointer 负责保存和恢复图状态。
4. 消息历史需要裁剪、删除或摘要。
5. 短期/长期按召回范围区分，不按保存时间区分。
6. 短期记忆不能替代长期记忆和业务数据库。
课后练习：
1. 设计两个不同 `thread_id` 的对话例子。
2. 说明为什么客服系统不能串用用户历史。
3. 写出一段旧对话摘要。
4. 判断哪些信息适合短期保存，哪些不适合。
