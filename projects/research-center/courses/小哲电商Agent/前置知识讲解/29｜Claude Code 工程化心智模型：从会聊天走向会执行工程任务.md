# Claude Code 工程化心智模型：从会聊天走向会执行工程任务

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396400163-3ae7cbf4-2993-4e3a-8049-c99d7a031f4c.png" title="null" crop="0,0,1,1" id="tNpjH" class="ne-image">

本节总览图：这张图从 `用户任务` 开始，进入 `Claude Code agentic loop`。循环内部依次画出 `理解目标 -> 读取项目上下文 -> 制定计划 -> 调用工具 -> 修改或分析 -> 验证结果 -> 汇报总结`。旁边画出 `context window`、`permissions`、`checkpoints`、`session resume / fork` 四个支撑能力。图中要强调 Claude Code 不是单次问答，而是带工具、权限、上下文和验证闭环的工程化 Agent。

## 课程目标

学完这一节，你应该能说清：
- 为什么 Claude Code 更适合作为工程化 Agent 设计参考，而不只是一个 CLI 工具。
- Agentic loop 和前面 LangChain / LangGraph 执行循环的关系。
- Claude Code 中模型、工具、会话、上下文窗口分别承担什么职责。
- checkpoint、resume、fork 为什么是工程任务里的重要能力。
- 为什么复杂任务要先探索再实现。
- 如何把一个业务 Agent 需求拆成可执行、可验证的工程步骤。

---

## 1. 为什么要在基础课最后讲 Claude Code 前面你已经学过：
- 模型与消息。
- Prompt。
- Tool Calling。
- RAG。
- 记忆和运行时上下文。
- LangGraph 编排。
- 可观测性、评估、安全和 MCP。
这些知识回答的是：

```latex
一个 Agent 应该具备哪些基础能力。
```

Claude Code 相关课程要回答的是另一个问题：

```latex
当 Agent 真的进入工程工作流后，这些能力应该如何组织、约束和协作。
```

电商客服 Agent 能跑起来只是第一步。后续你可能还要做运营 Agent、报销 Agent、订票 Agent、质检 Agent。这个时候问题不再只是“怎么调用模型”，而是：
- Agent 如何理解项目规则。
- Agent 如何知道自己能调用哪些工具。
- Agent 如何避免越权操作。
- Agent 如何在长任务中保留关键上下文。
- Agent 如何把改动、测试和结果交代清楚。
Claude Code 的价值就在于：它是一个已经产品化的工程 Agent，可以作为我们设计业务 Agent 的参照。

---

## 2. Claude Code 不是普通聊天窗口 普通聊天窗口通常是：

```latex
用户提问 -> 模型回答
```

Claude Code 更接近：

```latex
用户提出工程任务 -> Agent 读取项目上下文 -> Agent 判断需要哪些工具 -> Agent 执行读取、搜索、修改、运行命令等操作 -> Agent 根据结果继续调整 -> Agent 验证并总结
```

它的重点不是“回答得像不像”，而是“任务有没有被正确推进”。
这和 LangChain / LangGraph 的基础循环是一致的：

```latex
model -> tool call -> observation -> model
```

只是在工程场景中，工具更具体，上下文更长，权限更重要，验证也更严格。

---

## 3. Agentic loop：工程任务的执行循环 官方 Agent SDK 文档把 Agent loop 看成一个持续运行的过程。模型不会只输出最终答案，它可能输出工具调用、继续分析、请求更多信息，直到任务结束。

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396399613-09a051ac-f04e-418b-ba87-ada87b451dfc.png" title="null" crop="0,0,1,1" id="UISMH" class="ne-image">

Agentic loop 对照图：左侧画 LangChain / LangGraph 的抽象循环：`messages -> model -> tool calls -> tool results -> model -> final answer`。右侧画 Claude Code 工程循环：`task -> inspect repo -> plan -> edit/read/bash -> verify -> summarize`。中间用虚线连接 `tool calls` 和 `edit/read/bash`，说明两者底层都是模型提出动作、运行时执行动作、再把 observation 返回给模型。
你可以把 Claude Code 的循环拆成六步：

| 步骤 | 说明 |
| --- | --- |
| 理解目标 | 识别用户真正要完成的工程结果 |
| 收集上下文 | 阅读文件、搜索代码、理解现有约束 |
| 制定计划 | 把任务拆成可执行步骤 |
| 执行工具 | 读取、搜索、编辑、运行命令或调用外部工具 |
| 验证结果 | 运行测试、检查 diff、确认行为 |
| 汇报总结 | 说明改了什么、验证了什么、还有什么风险 | 这也是你设计业务 Agent 时应该借鉴的结构。 官方文档里还可以把这个循环概括成三类动作：

| 阶段 | 含义 | 工程例子 |
| --- | --- | --- |
| gather context | 收集上下文 | 搜索文件、阅读代码、查看测试失败信息 |
| take action | 采取行动 | 编辑文件、创建文件、运行命令、调用外部工具 |
| verify results | 验证结果 | 运行测试、检查类型错误、查看 diff、重新执行失败场景 | 这三个阶段不是严格线性的。真实任务通常是：

```latex
收集上下文 -> 采取一个小动作 -> 验证结果 -> 根据结果继续收集上下文 -> 再采取下一步动作
```

越真实的业务，越需要循环和反馈。不要把 Agent 设计成“一次模型调用解决所有问题”。

---

## 4. 模型、工具、会话和上下文窗口 Claude Code 的运行可以拆成四个基本对象：

| 对象 | 作用 |
| --- | --- |
| Model | 理解任务、生成计划、决定下一步动作 |
| Tools | 读取文件、编辑文件、运行命令、访问外部系统 |
| Session | 保存一次任务过程中的对话和工具结果 |
| Context window | 承载模型当前能看到的信息 | 这几个对象的关系很重要。 模型不会天然知道项目内容，它要通过上下文窗口看到信息。上下文窗口不是无限的，所以 Agent 需要选择哪些文件、规则、历史和工具结果应该进入上下文。 业务 Agent 也是一样。客服 Agent 不能把所有订单、商品和售后政策都塞进 prompt。它需要：

- 用 RAG 检索知识。
- 用工具查询实时数据。
- 用运行时上下文传入用户身份。
- 用短期记忆保留当前对话。
- 用权限系统限制高风险动作。

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396400158-b5a4d889-9bb2-43f1-af16-ca6511e1f130.png" title="null" crop="0,0,1,1" id="gAipO" class="ne-image">

Claude Code 访问范围图：这张图中心是 `Claude Code session`，向外连接 `project files`、`terminal`、`git state`、`CLAUDE.md`、`auto memory`、`MCP servers`、`skills`、`subagents`。每条连线旁边标注访问边界：文件和命令受权限控制，外部服务受 MCP 和认证控制，长期说明进入上下文但不是强制权限。
官方文档说明，当你在一个目录中运行 Claude Code，它通常能访问当前项目、终端、git 状态、CLAUDE.md、auto memory，以及你配置的 MCP、skills、subagents 等扩展。
这里的 auto memory、MCP、skills、subagents 都是 Claude Code 的产品能力，不是所有业务 Agent 框架都会内置的通用 API。具体可用性要以你当前 Claude Code 版本、账号和组织配置为准。
这给业务 Agent 一个直接启发：必须明确访问范围。客服 Agent 可以查当前用户订单，可以检索公开售后政策，但不能查其他用户订单，也不能直接审批退款。

---

## 5. Checkpoint、resume 和 fork 工程任务经常不是一次完成的。你可能会中途打断 Agent，也可能想从某个状态继续，或者尝试另一种实现方案。 Claude Code 文档中提到的 checkpoint、resume、fork 对应三类能力：

| 能力 | 解决的问题 |
| --- | --- |
| Checkpoint | 执行过程中保留可回退点 |
| Resume | 继续之前的会话 |
| Fork | 从已有会话分出另一条探索路径 | 这些能力对业务 Agent 同样有启发。 例如退款流程中：

```latex
识别退款意图 -> 查询订单 -> 判断是否符合政策 -> 生成退款建议 -> 等待人工审批 -> 执行退款
```

如果人工审批前系统重启，流程应该能恢复；如果审批拒绝，应该走另一条分支；如果用户补充了新证据，流程应该能重新判断。
这就是 LangGraph 持久化、interrupt 和 time travel 在业务 Agent 中的价值。
课程不要求你背 Claude Code 命令，但要理解这些能力背后的设计：

| 能力 | 常见形式 | 设计思想 |
| --- | --- | --- |
| resume | `--continue` / `--resume` | 继续同一任务历史 |
| fork | `--fork-session` / `/branch` | 从已有上下文开一条新探索路径 |
| context inspection | `/context` | 查看上下文窗口被什么占用 |
| compact | `/compact` | 压缩长会话，保留关键事实 |
| model switch | `/model` | 在成本、速度、推理能力之间取舍 | 这些是 Claude Code 当前官方能力的教学口径，具体命令是否可用会受 CLI 版本、客户端形态和账号环境影响。基础课的重点不是背命令，而是理解 resume、fork、context inspection、compact 这些工程能力对应的设计思想。 业务 Agent 不一定有这些命令，但应该有类似能力：流程可以恢复，判断可以重新走另一条分支，长对话可以摘要，复杂审批可以转给更强模型或人工处理。

---

## 6. Explore before implement Claude Code 官方文档强调，处理复杂任务时应该先探索上下文，再实施改动。 这条原则非常适合 Agent 工程：

```latex
不要让 Agent 还没理解业务规则，就直接调用高风险工具。
```

在电商场景中，如果用户说：

```latex
这个订单帮我退了吧。
```

Agent 不应该立刻退款，而应该先探索：
- 用户是谁。
- 订单是否属于当前用户。
- 订单状态是什么。
- 是否超过售后期限。
- 商品是否属于不可退品类。
- 是否需要人工审批。
探索完成后，再决定下一步。

---

## 7. 小 demo：拆解一个工程任务 任务：

```latex
修改电商客服 Agent 的退款判断逻辑：签收 7 天内支持无理由退货，生鲜和定制商品除外。
```

不要直接让 Agent “改一下代码”。更好的工程化拆解是：

```latex
1. 阅读售后政策文档，确认规则描述。 2. 搜索退款判断相关代码和测试。 3. 找出规则入口、工具调用和 RAG 知识来源。 4. 制定修改计划。 5. 修改最小必要代码或知识文件。 6. 增加或更新测试用例。 7. 运行相关测试。 8. 总结修改内容、验证结果和剩余风险。
```

这个 demo 不依赖具体 Claude Code 命令，重点是训练工程化思路。
观察点：
- 是否先阅读政策和现有代码，而不是直接写新规则。
- 是否把“生鲜和定制商品除外”作为边界条件。
- 是否增加了失败场景测试。
- 是否说明了哪些内容无法自动验证。
- 是否区分了代码修改和业务规则确认。

---

## 8. 常见错误

### 错误一：把 Claude Code 当成更强的聊天窗口 如果只问“这段代码怎么改”，你没有利用它的工程 Agent 能力。更好的方式是让它阅读、计划、修改、验证并总结。

### 错误二：跳过上下文探索 复杂系统里，缺少上下文会导致错误修改。Agent 需要先理解现有项目结构和约束。

### 错误三：没有验证闭环 工程 Agent 的输出不能只看文字总结。需要测试、运行结果、diff 检查或人工验收。

### 错误四：把 checkpoint 当成业务回滚 Checkpoint 可以回退文件修改，不能撤销已经发生的真实业务动作。退款、发券、通知用户等动作必须在执行前审批。

---

## 9. 本节知识框架总结

```latex
Claude Code 工程化心智模型 -> 不是普通聊天窗口 -> 核心是 agentic loop -> 模型负责判断和规划 -> 工具负责读取、修改和执行 -> 会话承载任务过程 -> 上下文窗口决定模型当前能看到什么 -> checkpoint / resume / fork 支持长任务恢复和分支探索 -> explore before implement 降低错误修改风险 -> 验证闭环决定工程任务是否完成
```

## 10. 本节小结 你需要记住：
1. Claude Code 的课程价值是工程化 Agent 设计思想，不是命令大全。
2. 工程 Agent 的核心是循环执行、工具调用、上下文管理和验证闭环。
3. 复杂任务应该先探索再实现。
4. checkpoint、resume、fork 对业务流程恢复也有启发。
5. 业务 Agent 也需要从“能回答”走向“能执行、可审计、可恢复”。
课后练习：
1. 选择一个电商客服需求，把它拆成“探索、计划、执行、验证、总结”五步。
2. 写出这个需求中需要读取的上下文。
3. 标出哪些步骤可以自动执行，哪些步骤需要人工确认。
