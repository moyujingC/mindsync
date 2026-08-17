# Interrupt：在高风险动作前暂停，让人确认后再继续

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396396275-b11abe4f-9c8b-45cd-be6f-961af8b8d3dc.png" title="null" crop="0,0,1,1" id="UbFlb" class="ne-image">

本节总览图：这张图从 `Agent 流程` 进入 `risk_check`，低风险直接到 `draft_reply`，高风险进入 `interrupt()` 暂停。暂停后状态保存到 checkpointer，人工在外部界面审批；审批结果通过 `Command(resume=...)` 回到暂停节点继续执行。图中要强调 interrupt 不是报错，而是有意暂停。

## 课程目标

学完这一节，你应该能说清：
- human-in-the-loop 解决什么问题。
- `interrupt()` 如何让图暂停。
- `Command(resume=...)` 如何恢复执行。
- resume 后节点重新执行的范围。
- 为什么 interrupt 需要持久化。
- 哪些电商动作必须人工确认。
- interrupt 和普通异常的区别。

---

## 1. 为什么需要人工确认 有些动作不能让 Agent 自动决定：
- 承诺退款。
- 承诺赔付金额。
- 修改订单地址。
- 取消订单。
- 给出规则例外。
- 处理投诉升级。
这些不是模型能力问题，而是业务风险问题。正确做法是：

```latex
Agent 识别高风险动作 -> 暂停 -> 人工查看上下文 -> 人工批准、拒绝或修改 -> Agent 继续
```

---

## 2. interrupt 的基本概念 `interrupt()` 会让图在节点内部暂停，并把需要人工处理的信息返回给外部。 恢复时，外部调用：

```python
Command(resume=...)
```

这个 resume 值会成为 `interrupt()` 的返回值。

---

## 3. 最小示例

```python
from typing import TypedDict from langgraph.graph import StateGraph, START, END from langgraph.types import interrupt, Command from langgraph.checkpoint.memory import InMemorySaver class State(TypedDict): request: str approved: bool answer: str def human_review(state: State) -> dict: approved = interrupt({ "question": "是否批准这个高风险售后处理？", "request": state["request"], }) return {"approved": bool(approved)} def finish(state: State) -> dict: if state["approved"]: return {"answer": "人工已批准，可以继续处理。"} return {"answer": "人工未批准，不能继续处理。"} builder = StateGraph(State) builder.add_node("human_review", human_review) builder.add_node("finish", finish) builder.add_edge(START, "human_review") builder.add_edge("human_review", "finish") builder.add_edge("finish", END) graph = builder.compile(checkpointer=InMemorySaver()) config = {"configurable": {"thread_id": "review_001"}} graph.invoke({"request": "用户要求全额退款", "approved": False, "answer": ""}, config) graph.invoke(Command(resume=True), config)
```

观察点：
- 第一次执行会暂停。
- 恢复时必须使用同一个 config。
- `resume=True` 会作为 `interrupt()` 的返回值。
- 恢复时不是从 `interrupt()` 那一行后面原地继续，而是重新执行发生 `interrupt()` 的整个节点；再次执行到同一个 `interrupt()` 时，才会拿到 resume 值继续往下走。

---

## 4. resume 后节点会从头重新执行 这是 `interrupt()` 最容易写错的地方。 官方文档明确说明：恢复执行时，LangGraph 会从发生 `interrupt()` 的节点开头重新执行，而不是从 `interrupt()` 调用那一行后面继续。 也就是说：

```latex
第一次执行节点 -> 执行 interrupt 前的代码 -> 调用 interrupt()，图暂停 -> 外部传入 Command(resume=...) -> 重新从这个节点开头执行 -> interrupt 前的代码再次执行 -> 再次遇到同一个 interrupt() -> interrupt() 返回 resume 值 -> 继续执行 interrupt 后面的代码
```

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396397145-b9ea9e06-2e01-4f71-b802-5fd88f9f6a07.png" title="null" crop="0,0,1,1" id="C5DLj" class="ne-image">

resume 后节点重执行图：这张图画出一个 `human_review` 节点，节点内部依次是 `before_interrupt_code -> interrupt() -> after_interrupt_code`。第一次运行时箭头停在 `interrupt()` 并保存 checkpoint；外部传入 `Command(resume=True)` 后，箭头不是从 `after_interrupt_code` 开始，而是回到 `human_review` 节点开头，重新经过 `before_interrupt_code`，再次到达 `interrupt()` 时返回 resume 值，然后继续执行 `after_interrupt_code`。图中要用警示标注：`before_interrupt_code` 会再次执行。
所以，`interrupt()` 前面的代码必须谨慎。
错误示例：

```python
def human_review(state: State) -> dict: create_audit_log({ "request": state["request"], "status": "pending", }) approved = interrupt({ "question": "是否批准这个高风险售后处理？", "request": state["request"], }) return {"approved": bool(approved)}
```

问题在于：`create_audit_log()` 在 `interrupt()` 前面。恢复时整个节点会从头执行，这条审计日志可能被重复创建。
更推荐：

```python
def human_review(state: State) -> dict: approved = interrupt({ "question": "是否批准这个高风险售后处理？", "request": state["request"], }) return {"approved": bool(approved)} def write_review_audit(state: State) -> dict: create_audit_log({ "request": state["request"], "approved": state["approved"], }) return {}
```

也就是把真正有副作用的动作放到 `interrupt()` 之后，或者拆到后续节点。
如果确实必须在 `interrupt()` 前写入外部系统，也要保证它是幂等的。例如使用 upsert，而不是每次 create 一条新记录。

---

## 5. Interrupt 不是异常

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396397354-59ca76a2-8d58-4652-880c-d374dc2748c4.png" title="null" crop="0,0,1,1" id="zV5oo" class="ne-image">

Interrupt 与异常对比图：这张图左右对比。左侧异常路径是节点执行失败，进入错误处理；右侧 interrupt 路径是节点主动暂停，保存状态，等待外部输入，再恢复执行。图中强调 interrupt 是业务流程的一部分，不表示系统失败。
异常表示程序出错。Interrupt 表示流程需要等待人或外部输入。
不要用异常来表达审批等待，也不要用 interrupt 来掩盖系统错误。

---

## 6. 动态 interrupt 和静态 interrupt 前面讲的 `interrupt()` 是动态 interrupt：它写在节点代码里，可以根据业务条件决定是否暂停，适合 human-in-the-loop。 LangGraph 还有静态 interrupt，也就是调试断点。它不写在节点内部，而是在编译或运行图时指定：

| 类型 | 常见写法 | 适合用途 |
| --- | --- | --- |
| 动态 interrupt | `interrupt({...})` | 业务流程里等待人工输入 |
| 静态 interrupt | `interrupt_before=[...]` / `interrupt_after=[...]` | 调试时在节点前后暂停 | 静态 interrupt 更像“在某个节点前后打断点”。它适合排查图的执行过程，不推荐用来实现退款审批、人工确认这类业务流程。 基础课先记住：

```latex
业务 HITL -> 用 interrupt() 调试断点 -> 用 interrupt_before / interrupt_after
```

---

## 7. 设计审批内容 人工审批时不能只给一句话。应该提供：
- 用户原始请求。
- Agent 准备执行的动作。
- 相关订单或政策依据。
- 风险原因。
- 可选操作：批准、拒绝、修改。
审批界面或外部系统返回的内容应该结构化，方便后续节点处理。

---

## 8. 常见错误

### 错误一：没有 checkpointer Interrupt 需要状态持久化。没有 checkpointer，暂停后很难恢复。

### 错误二：把审批结果当自然语言随便解析 推荐使用结构化结果，例如 `{"approved": true, "comment": "同意一次性补偿"}`。

### 错误三：高风险动作先执行再审批 审批应该在动作执行前发生。

### 错误四：在 `interrupt()` 前执行非幂等副作用 恢复执行会从发生 `interrupt()` 的节点开头重新执行。`interrupt()` 前的代码会再次运行，所以不要在它前面创建审批单、追加日志、发通知、调用退款接口等非幂等动作。 推荐做法：
- 把副作用放到 `interrupt()` 后面。
- 或者拆成后续节点。
- 或者确保前置操作是幂等的，例如 upsert。

---

## 9. 本节知识框架总结

```latex
Human-in-the-loop -> 高风险动作前暂停 -> interrupt() 返回审批请求 -> checkpointer 保存状态 -> Command(resume=...) 恢复 -> resume 值成为 interrupt 返回值 -> resume 会从发生 interrupt 的节点开头重新执行 -> interrupt 前的副作用必须幂等 -> interrupt_before / interrupt_after 是调试断点 -> 审批内容要结构化
```

## 10. 本节小结 你需要记住：
1. 人工确认是业务边界，不是模型能力不足。
2. `interrupt()` 是主动暂停，不是异常。
3. 恢复执行使用 `Command(resume=...)`。
4. resume 后会从发生 `interrupt()` 的节点开头重新执行，`interrupt()` 前的代码会再次运行。
5. 高风险动作必须先审批再执行。
6. `interrupt()` 前不要放非幂等副作用。
7. 静态 interrupt 用于调试断点，不推荐作为业务审批机制。
课后练习：
1. 列出 5 个电商客服必须人工确认的动作。
2. 设计一个退款审批 payload。
3. 解释为什么 interrupt 需要 checkpointer。
4. 写出批准和拒绝后的不同后续节点。
5. 说明为什么 `interrupt()` 前创建审批单可能导致重复记录。
