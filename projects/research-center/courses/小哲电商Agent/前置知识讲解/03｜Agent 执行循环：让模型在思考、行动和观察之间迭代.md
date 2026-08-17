# Agent 执行循环：让模型在思考、行动和观察之间迭代

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396364417-cdef3370-d6cb-4afc-b428-81acad48d0e6.png" width="1672" title="null" crop="0,0,1,1" id="cfz3k" class="ne-image">

本节总览图：这张图从左到右画出 `用户输入 -> model -> action/tool call -> tools -> observation -> model -> final answer`。`model` 有两个出口：如果信息不足或需要外部事实，箭头进入 `action/tool call`；如果已经可以回答，箭头进入 `final answer`。`tools` 的结果以 `observation` 回到模型，形成可重复循环，直到满足停止条件。

## 课程目标

学完这一节，你应该能说清：
- Agent 为什么不是一次模型调用就结束。
- `input`、`model`、`action`、`tools`、`observation`、`finish` 分别是什么意思。
- 为什么工具结果要回到模型，而不是直接发给用户。
- Agent loop 和普通 Chatbot 的关键区别。
- `create_agent` 为什么底层可以看成一个图运行时。
- Agent 执行循环为什么必须有停止条件、错误处理和人工边界。

---

## 1. 为什么需要执行循环 普通模型调用通常是：

```latex
用户输入 -> 模型 -> 回答
```

这个流程适合回答常识问题、改写文本、总结内容。
但电商客服经常遇到这类问题：

```latex
订单20260001到哪了？我明天出差前能收到吗？
```

模型不能直接回答，因为它不知道实时物流状态。
更合理的流程是：

```latex
用户输入 -> 模型判断这是物流问题 -> 模型提出调用物流工具 -> 程序执行工具 -> 工具返回物流结果 -> 模型结合结果判断是否能回答 -> 给出最终回复
```

这里出现了一个循环：模型不是只生成最终文本，也可能先生成下一步动作。动作执行后得到观察结果，观察结果再回到模型。
这就是 Agent loop。

---

## 2. LangChain 官方对 Agent 循环的描述 LangChain 官方 `agents.md` 说明，Agent 把 language model 和 tools 组合起来，让系统能够围绕任务进行推理、决定使用哪些工具，并迭代地接近目标。 官方流程可以概括为：

```latex
input -> model -> action -> tools -> observation -> model -> finish
```

这几个词不是抽象口号，而是 Agent 执行时真实发生的阶段：

| 阶段 | 含义 | 电商例子 |
| --- | --- | --- |
| input | 用户输入或任务输入 | “订单20260001到哪了？” |
| model | 模型理解任务并决定下一步 | 判断需要查物流 |
| action | 模型提出动作，通常是 tool call | 调用 `get_order_logistics` |
| tools | 应用程序或运行时执行工具 | 查询订单系统或物流接口 |
| observation | 工具执行结果 | “已发货，预计明天送达” |
| finish | 模型给出最终回答 | “订单已发货，预计明天送达” | 注意：`action` 不是模型自己执行代码。模型只是提出动作请求，真正执行工具的是应用程序或 LangChain 运行时。

---

## 3. Agent loop 的核心关系

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396364374-2796491e-d1c3-4a38-9238-da137e5e8cfe.png" title="null" crop="0,0,1,1" id="cpuhV" class="ne-image">

Action Observation 循环图：这张图把 `model` 放在中心，右侧是 `action/tool call`，下方是 `tools`，左侧回流 `observation`。箭头顺序是 `model -> action/tool call -> tools -> observation -> model`。图中要标出 `observation` 不是最终回答，而是下一次模型判断的输入；如果 observation 足够，模型再输出 final answer。
Agent loop 最重要的是这组关系：

```latex
model 负责判断 tools 负责执行 observation 负责把执行结果带回模型 model 再决定继续行动还是结束
```

为什么工具结果不能直接发给用户？
因为工具返回的通常是业务事实，不一定是适合用户阅读的回答。
例如物流工具可能返回：

```json
{
  "order_no": "20260001",
  "status": "IN_TRANSIT",
  "carrier": "SF",
  "latest_event": "Arrived at Shanghai transit center",
  "eta": "2026-05-05"
}
```

用户真正需要的是：

```latex
我查到订单20260001已经发货，目前到达上海转运中心，预计 2026-05-05 送达。
```

所以工具结果要回到模型，由模型转换成符合上下文和用户需求的最终回答。

---

## 4. 一次循环和多次循环 有些问题只需要一次工具调用。

```latex
用户：订单20260001到哪了？ 模型：调用物流工具 工具：返回物流状态 模型：最终回答
```

有些问题需要多次循环。

```latex
用户：我这个订单能退吗？ 模型：需要订单号，先追问 用户：20260001 模型：调用订单详情工具 工具：返回下单时间和商品状态 模型：调用售后政策检索工具 工具：返回退货政策 模型：结合订单和政策回答
```

Agent loop 的价值就在这里：它可以根据中间结果决定下一步，而不是把所有步骤写死。

---

## 5. 停止条件：Agent 什么时候结束

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396364417-9e9f9a34-857c-4c05-9441-48e9ec28b7cb.png" title="null" crop="0,0,1,1" id="DPs6l" class="ne-image">

Agent 停止条件图：这张图从 `model` 节点分出四条结束路径：`final answer` 表示模型已经能回答；`iteration limit` 表示达到最大循环次数；`tool error fallback` 表示工具失败后进入兜底；`human handoff` 表示触发人工处理。图中要强调停止条件控制循环边界，避免 Agent 无限调用工具。
Agent 不能无限循环。必须有停止条件。
常见停止条件包括：
- 模型已经给出最终回答。
- 达到最大迭代次数。
- 工具连续失败。
- 用户信息不足，需要追问。
- 涉及高风险动作，需要人工确认。
电商例子：

```latex
用户：帮我退款
```

系统不能无限尝试工具，也不能直接自动退款。合理停止方式是：

```latex
需要先确认订单号、退款原因和政策边界；涉及实际退款动作时转人工或请求明确确认。
```

---

## 6. `create_agent` 和图运行时 LangChain 官方文档说明，`create_agent` 提供 production-ready agent implementation，并且会构建基于 LangGraph 的 graph runtime。 你可以先把它理解成：

```latex
create_agent -> model node -> tools node -> 条件路由 -> 循环直到 finish
```

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396368111-dd8e9fde-feb9-4368-a498-669bb26bd8c0.png" title="null" crop="0,0,1,1" id="kODYy" class="ne-image">

create_agent 运行时结构图：这张图展示 `create_agent(model, tools, system_prompt)` 如何形成一个包含 `model node`、`tools node` 和条件边的运行结构。`model node` 输出 tool calls 时进入 `tools node`，工具结果作为 messages 回到 `model node`；没有 tool calls 时进入 `final answer`。
这就是为什么你不手写 LangGraph，也能得到一个有工具循环能力的 Agent。
但要注意：
- 简单 Agent 可以直接用 `create_agent`。
- 复杂审批、暂停恢复、人工确认、状态持久化，更适合显式使用 LangGraph。
- `create_agent` 隐藏了很多图细节，但不代表这些细节不存在。

---

## 7. 手写一个极简 Agent loop 下面的 demo 不调用真实模型，用普通 Python 模拟 Agent loop。

```python
def get_order_logistics(order_no: str) -> str: """模拟物流工具。""" orders = { "20260001": "已发货，预计明天送达", "20260002": "待发货，仓库正在拣货", } return orders.get(order_no, "未找到订单") def fake_model_step(user_input: str, observation: str | None = None) -> dict: """模拟模型的下一步决策。""" if observation is not None: return { "type": "finish", "content": f"根据查询结果：{observation}", } if "20260001" in user_input: return { "type": "action", "tool": "get_order_logistics", "args": {"order_no": "20260001"}, } return { "type": "finish", "content": "请提供订单号，我再帮你查询。", } def run_agent(user_input: str) -> str: observation = None for _ in range(3): step = fake_model_step(user_input, observation) if step["type"] == "finish": return step["content"] if step["type"] == "action" and step["tool"] == "get_order_logistics": observation = get_order_logistics(**step["args"]) continue return "当前问题暂时无法自动完成，请转人工处理。" print(run_agent("帮我查一下订单20260001到哪了")) print(run_agent("我的订单到哪了？"))
```

观察点：
- 第一次输入包含订单号，模型步骤输出 action。
- 工具执行后得到 observation。
- observation 回到模型，模型再输出 finish。
- 如果没有订单号，模型直接 finish，要求补充信息。
- `for _ in range(3)` 是简化的迭代上限，防止无限循环。

---

## 8. Agent loop 和 Chatbot 的区别 Chatbot 的主要结构是：

```latex
history + user input -> model -> reply
```

Agent loop 的主要结构是：

```latex
history + user input -> model -> action -> tools -> observation -> model -> reply
```

区别不在于界面是不是聊天，而在于模型是否可以通过 action 调用外部能力。
如果客服系统只能根据历史消息聊天，它是 Chatbot。
如果它能判断需要订单事实、调用订单工具、再基于结果回答，它才进入 Agent 范畴。

---

## 9. 常见错误

### 错误 1：把工具结果直接当最终回答 工具结果是 observation，不一定适合直接给用户。 应该让模型把 observation 转换成自然、准确、有边界的回答。

### 错误 2：没有迭代上限 如果没有最大迭代次数，Agent 可能在工具失败或信息不足时反复调用工具。

### 错误 3：所有问题都强制调用工具 用户问“你是谁？”不需要查订单工具。 Tool Calling 应该由模型根据上下文判断，而不是每轮都调用。

### 错误 4：高风险动作没有人工边界 查询物流可以自动执行。 退款、赔付、改地址、发券等动作需要确认、权限和审计。

---

## 10. 本节知识框架总结

```latex
Agent loop -> input 进入模型 -> model 判断下一步 -> action 表示模型提出工具调用 -> tools 由运行时执行 -> observation 回到模型 -> model 决定继续调用工具还是 finish -> stop condition 控制循环边界 -> create_agent 内部可以理解成图运行时
```

## 11. 本节小结 你需要记住：
1. Agent 不是一次模型调用，而是可能多次循环。
2. `action` 是模型提出动作，不是模型执行代码。
3. `observation` 是工具结果，要回到模型再生成最终回答。
4. 停止条件是 Agent 设计的一部分，不是可选项。
5. `create_agent` 能快速得到 Agent loop，但复杂流程仍需要 LangGraph。
6. 工具调用、错误处理、人工确认和权限边界必须一起考虑。
课后练习：
1. 画出“查询订单物流”的 Agent loop。
2. 说明为什么工具返回 JSON 后，还需要模型生成最终回答。
3. 修改 demo，让订单不存在时返回“请确认订单号或转人工”。
4. 列出三个不应该自动执行的高风险动作，并说明停止条件是什么。
