# Subagents 与多 Agent 协作：先明确职责，再拆分团队

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396403575-3b3bc855-3892-485e-96e2-5e2fa90ab6e6.png" title="null" crop="0,0,1,1" id="RC6zP" class="ne-image">

本节总览图：这张图中心是 `主 Agent`，它接收用户任务并决定是否委派。周围画 `客服 Agent`、`运营 Agent`、`财务 Agent`、`差旅 Agent`、`审计 Agent`。每个子 Agent 有独立上下文和工具权限。底部画共享治理层：`permissions`、`memory rules`、`trace`、`evals`、`human approval`。图中要强调多 Agent 不是把所有任务随便并行，而是基于职责边界进行委派。

## 课程目标

学完这一节，你应该能说清：
- Subagent 解决什么问题。
- 为什么多 Agent 首先是职责拆分问题。
- 主 Agent 和子 Agent 应该如何分工。
- 上下文隔离和权限隔离为什么重要。
- 什么时候不应该过早使用多 Agent。
- 如何为企业内部多个 Agent 设计治理清单。
- LangGraph Subgraph 和 Claude Code Subagent 的区别。

---

## 1. 为什么需要 Subagents 一个 Agent 可以完成简单任务。但当任务变复杂时，一个 Agent 可能会遇到几个问题：
- 上下文太长。
- 工具太多。
- 职责混乱。
- 权限难控制。
- 输出质量不稳定。
Subagent 的核心价值是：

```latex
把特定任务交给专门 Agent，用独立上下文和工具完成，再把结果交回主流程。
```

例如，客服主 Agent 不一定要自己完成所有工作。它可以把“政策检索”交给知识 Agent，把“退款风险检查”交给审计 Agent，把“运营活动解释”交给运营 Agent。

---

## 2. 多 Agent 不是越多越好 多 Agent 会带来额外复杂度：
- 委派成本。
- 上下文传递成本。
- 结果合并成本。
- 权限管理成本。
- 调试和追踪成本。
所以拆分前要先问：
- 这个任务是否有清晰职责边界。
- 是否需要不同工具权限。
- 是否需要独立上下文。
- 是否能并行处理。
- 子 Agent 的输出是否容易验证。
如果只是一个简单流程，用 LangGraph 节点或普通工具就足够了。
Claude Code 官方 features overview 对几个概念做了区分：

| 概念 | 核心作用 | 适合场景 |
| --- | --- | --- |
| Skill | 可复用说明、知识或工作流 | 质检清单、发布流程、写作规范 |
| Subagent | 独立上下文里的专门 worker | 读取大量文件、并行调查、专项审查 |
| Agent team | 多个独立会话协作 | 复杂研究、多个角色互相讨论和协调 | 不要把它们混在一起：

```latex
需要复用知识 -> Skill 需要隔离上下文完成一项任务 -> Subagent 需要多个独立 Agent 彼此协作 -> Agent team
```

---

## 3. LangGraph Subgraph 和 Claude Code Subagent 的关系 这里需要补一个容易混淆的概念：Subgraph 和 Subagent 不是同一个东西。 LangGraph 官方文档里的 Subgraph 指的是：

```latex
一个 graph 被当作另一个 graph 的 node 使用。
```

Claude Code 里的 Subagent 更强调：

```latex
一个有独立上下文、专门职责和受限工具的 worker。
```

它们关注的层次不同：

| 概念 | 所属层次 | 核心作用 | 你可以怎么理解 |
| --- | --- | --- | --- |
| Node | LangGraph 流程节点 | 执行一步逻辑  |

一个流程步骤 |
| Tool | 外部能力封装 | 查询或执行具体动作  |

一个可调用能力 |
| Subgraph | LangGraph 工作流组合 | 把一段图封装成父图节点  |

一个可复用子流程 |
| Subagent | Agent 工程协作单元 | 用独立上下文和工具完成专门任务  |

一个专门 worker |

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396403650-5d1f7cec-2617-48c6-87bf-96c25177f098.png" title="null" crop="0,0,1,1" id="WD1te" class="ne-image">

Subgraph 与 Subagent 对照图：这张图左右对比。左侧是 `parent graph`，其中一个节点是 `compiled subgraph`，subgraph 内部包含 `node A -> node B -> node C`，强调它是工作流组合。右侧是 `main agent` 委派给 `subagent`，subagent 有独立 `context`、`tools`、`permissions`，完成任务后返回结构化结果，强调它是工程协作单元。中间用虚线标注：复杂 Subagent 的内部实现可以使用 Subgraph，但两者不是同一层概念。
Subgraph 有两种典型通信模式。
第一种：父图和子图使用不同 state schema。
这时不能直接共享状态，需要在父图的某个 node 里调用 subgraph，并手动做输入输出映射：

```latex
parent state -> wrapper node 转成 subgraph input -> subgraph.invoke(...) -> subgraph output 转回 parent state update
```

适合场景：
- 子流程有自己的内部状态。
- 不希望子流程直接看到父图全部 state。
- 多 Agent 或专门流程需要隔离上下文。
第二种：父图和子图共享 state keys。
这时可以把 compiled subgraph 直接作为 node 加入父图：

```latex
parent graph.add_node("policy_flow", compiled_subgraph)
```

适合场景：
- 父图和子图本来就共享某些 state key。
- 子图只是父流程中一段可复用流程。
- 你希望减少 wrapper 映射代码。
选择时可以用一个简单判断：

| 需求 | 更适合 |
| --- | --- |
| 只是执行一个外部查询或动作 | Tool |
| 只是流程中的一个步骤 | Node |
| 一段流程要复用、组合、持久化、可观察 | Subgraph |
| 需要独立上下文、专门职责和权限隔离 | Subagent | 不要因为名字相似就把 Subgraph 和 Subagent 混用。Subgraph 是工作流结构，Subagent 是协作角色。一个 Subagent 的内部可以用 Subgraph 实现，但课程里先把两层概念分清。

---

## 4. 主 Agent 和子 Agent 的分工 常见结构是：

| 角色 | 职责 |
| --- | --- |
| 主 Agent | 理解用户目标、决定是否委派、整合结果、对用户负责 |
| 子 Agent | 完成特定任务，返回结构化结果或建议 |
| 工具 | 执行具体外部能力 |
| 审计层 | 记录过程、检查权限、评估质量 |

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396402658-31194f81-5f4c-4333-abb1-ae72534a108d.png" title="null" crop="0,0,1,1" id="HSe2F" class="ne-image">

主从 Agent 分工图：这张图从 `user request` 指向 `main agent`。主 Agent 根据 intent 分发到 `policy subagent`、`order subagent`、`risk review subagent`。每个子 Agent 只访问自己的工具和知识。结果回到主 Agent，由主 Agent 生成最终答复。图中标注子 Agent 不直接对用户承诺高风险结果。
主 Agent 不应该把责任完全丢给子 Agent。它仍然要：
- 判断是否需要委派。
- 限制委派范围。
- 检查子 Agent 输出。
- 整合成一致回答。

---

## 5. 上下文隔离 Subagent 的一个重要价值是上下文隔离。 例如：
- 政策 Agent 只需要售后政策和用户问题。
- 订单 Agent 只需要订单号和当前用户身份。
- 审计 Agent 只需要计划动作、风险字段和审批状态。
不要把所有上下文都传给所有子 Agent。
这样做有三个好处：
- 减少上下文窗口占用。
- 降低敏感信息泄露风险。
- 让子 Agent 更专注。

---

## 6. 权限隔离 不同 Agent 应该有不同工具权限。

| Agent | 可用工具 | 禁止工具 |
| --- | --- | --- |
| 客服 Agent | 查询订单、检索政策、创建售后单 | 直接审批退款 |
| 运营 Agent | 查询活动、生成文案、分析商品数据 | 修改财务数据 |
| 财务 Agent | 查询报销单、生成付款建议 | 未审批付款 |
| 审计 Agent | 读取 trace、检查权限、生成风险报告 | 修改订单 | 权限隔离的原则是最小权限：

```latex
每个 Agent 只拿完成职责所必需的工具。
```

---

## 7. 子 Agent 的输入输出要结构化 子 Agent 不应该随便返回一大段散文。主 Agent 需要能检查和整合结果，所以子 Agent 输出最好结构化。 例如退款风险审查子 Agent 可以返回：

```json
{
  "risk_level": "high",
  "reasons": [
    "订单金额超过自动处理阈值",
    "商品属于定制品类"
  ],
  "recommended_action": "human_review",
  "missing_information": []
}
```

这样主 Agent 才能稳定处理：
- 高风险则转人工。
- 缺信息则追问。
- 低风险则继续流程。
如果子 Agent 输出不可预测，多 Agent 系统会很难测试。

---

## 8. 自动评审和例行任务 Claude Code 官方文档中还包含 code review、routines、scheduled tasks 等自动化能力。这些内容对业务 Agent 的启发是：
- Agent 可以不只响应用户，也可以执行例行检查。
- Agent 可以作为审计者，而不只是执行者。
- Agent 输出需要被评估、追踪和回归测试。
例如：

```latex
每天抽检 100 条客服对话 -> 质检 Agent 检查是否引用政策 -> 审计 Agent 检查是否越权承诺退款 -> 生成问题清单 -> 人工复核高风险样例
```

这类任务更适合用自动化流程，不一定由在线客服 Agent 实时完成。

---

## 9. 小 demo：企业 Agent 能力地图

```markdown
| Agent | 主要职责 | 关键工具 | 高风险边界 | |---|---|---|---| | 客服 Agent | 回答商品、订单、售后问题 | 订单查询、物流查询、RAG | 不直接退款 | | 运营 Agent | 活动解释、商品文案、数据分析 | 商品库、活动系统 | 不修改价格 | | 报销 Agent | 报销材料检查、流程问答 | 报销系统、政策库 | 不直接付款 | | 订票 Agent | 差旅查询、行程建议 | 航班/酒店工具 | 不自动支付 | | 审计 Agent | 检查越权、敏感信息、质量 | trace、日志、评估集 | 只读审计 |
```

这个表能帮助你判断：哪些能力应该共用，哪些权限必须隔离。

---

## 10. 多 Agent 治理清单 设计多个 Agent 前，至少回答这些问题：

```latex
1. 每个 Agent 的职责是否一句话能说清？ 2. 每个 Agent 的输入输出是否结构化？ 3. 每个 Agent 需要哪些工具？ 4. 每个 Agent 禁止哪些工具？ 5. 子 Agent 是否能访问敏感数据？ 6. 主 Agent 是否会验证子 Agent 输出？ 7. trace 是否能记录委派链路？ 8. 评估集是否覆盖委派失败和越权场景？
```

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396403221-fda442f5-9728-4992-9625-2f57542b9678.png" title="null" crop="0,0,1,1" id="FRnMX" class="ne-image">

多 Agent 治理清单图：这张图以 `new subagent proposal` 为入口，依次经过 `responsibility clear?`、`structured I/O?`、`tool permissions defined?`、`context boundary defined?`、`trace and eval ready?` 五个检查节点。任一节点为否都回到“不要拆分，先用普通工具或 LangGraph 节点”。全部为是才进入 `create subagent`。

---

## 11. 常见错误

### 错误一：为了显得高级而拆多 Agent 如果任务边界不清晰，多 Agent 只会增加调试难度。

### 错误二：所有子 Agent 共享同一套工具 这会破坏最小权限原则。

### 错误三：子 Agent 输出不验证 主 Agent 必须检查和整合子 Agent 输出，不能直接把高风险建议交给用户。

### 错误四：用多 Agent 掩盖流程不清晰 如果业务流程本身没有定义清楚，多 Agent 只会把混乱放大。先把流程、状态和权限设计清楚，再考虑拆分。

### 错误五：把 Subgraph 和 Subagent 当成同一个概念 Subgraph 是 LangGraph 的工作流组合方式，Subagent 是 Agent 工程中的协作角色。不要因为都带 `sub` 就把它们混在一起。

---

## 12. 本节知识框架总结

```latex
Subagents 与多 Agent -> 解决职责复杂、上下文过长、工具过多的问题 -> Subgraph 是 LangGraph 子流程组合 -> Subagent 是独立上下文和权限的专门 worker -> 主 Agent 负责理解目标、委派和整合 -> 子 Agent 负责专门任务 -> 上下文要隔离 -> 权限要隔离 -> 自动评审和例行任务是 Agent 治理的一部分 -> 不要过早多 Agent 化
```

## 13. 本节小结 你需要记住：
1. 多 Agent 首先是职责设计，不是数量设计。
2. Subgraph 是工作流组合方式，Subagent 是工程协作角色。
3. Subagent 适合有清晰边界、独立上下文和独立工具权限的任务。
4. 主 Agent 仍然要对最终结果负责。
5. 权限隔离比能力堆叠更重要。
6. 企业 Agent 体系需要 trace、评估、审批和审计共同治理。
课后练习：
1. 判断“售后政策问答”是否需要单独子 Agent，并说明理由。
2. 为客服 Agent 和审计 Agent 分别设计工具权限。
3. 画一张你自己的企业 Agent 能力地图。
