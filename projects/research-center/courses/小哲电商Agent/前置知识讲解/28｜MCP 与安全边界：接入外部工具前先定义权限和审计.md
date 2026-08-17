# MCP 与安全边界：接入外部工具前先定义权限和审计

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396399017-99e65968-c4ec-4970-bff1-f7f100b476b7.png" title="null" crop="0,0,1,1" id="tSsvV" class="ne-image">

本节总览图：这张图从 `Agent` 连接到 `MCP client`，再连接多个 `MCP server`，每个 server 暴露 tools、resources 或 prompts。中间画认证、授权、参数校验、审计日志和脱敏层。高风险工具旁标注 human approval。图中强调 MCP 是工具接入协议，不是自动获得安全边界。

## 课程目标

学完这一节，你应该能说清：
- MCP 是什么，解决什么连接问题。
- MCP server 可以暴露哪些能力。
- 为什么外部工具接入必须有认证、授权和审计。
- LangChain guardrails 能做什么。
- PII detection、human-in-the-loop、before/after guardrails 的基本作用。
- 电商系统中哪些工具不能无审批开放给 Agent。

---

## 1. MCP 解决什么问题 MCP，即 Model Context Protocol，是一种让模型应用以统一方式发现和使用外部工具、资源和数据源的协议。 先看没有 MCP 时的痛点。 如果一个 Agent 要接入 CRM、订单系统、知识库、数据分析平台和内部审批系统，通常会遇到几类问题：
- 每接一个系统都要写一套专用适配代码，工具定义、认证方式、调用方式和错误格式都不一样。
- 工具能力很难被不同客户端复用。今天给 Claude Code 写一套，明天给另一个 Agent 应用又要重新接。
- 工具描述和参数 schema 分散在代码、Prompt 或文档里，模型应用很难稳定发现“有哪些工具、参数怎么填、返回什么”。
- 外部数据和工具接入后，权限、审计、脱敏和人工确认经常被后补，容易把连接能力误当成安全边界。
- 多团队协作时，工具提供方和 Agent 应用方缺少统一接口约定，沟通成本高，升级也容易互相影响。
MCP 解决的核心痛点不是“让模型更聪明”，而是把外部能力接入 Agent 的方式标准化：工具提供方按统一协议暴露能力，Agent 客户端按统一方式发现、理解和调用这些能力。
你可以把它理解成：

```latex
让不同工具系统用标准接口暴露给 Agent 或 AI 客户端。
```

例如：
- 查询 LangSmith traces。
- 读取数据集。
- 调用内部订单工具。
- 暴露某个 Agent 作为 MCP tool。
所以 MCP 主要解决三件事：
1. 工具发现：客户端能知道 server 暴露了哪些 tools、resources 或 prompts。
2. 调用约定：工具名称、参数 schema、返回结果和错误处理有统一协议。
3. 生态复用：同一个 MCP server 可以被不同兼容客户端接入，减少重复适配。
但要注意，MCP 解决连接标准化，不自动解决权限和安全。

---

## 2. MCP 能暴露什么 以 LangSmith MCP Server 为例，它可以让兼容 MCP 的客户端读取：
- conversation history + prompts + runs and traces + datasets + experiments + billing usage Agent Server 的 MCP endpoint 也可以把已部署的 LangGraph agents 暴露为 MCP tools。
这说明 MCP 的能力很强，也意味着权限边界必须清晰。

---

## 3. 安全边界图

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396398832-b0c5226a-7014-4be4-adcc-1c18af4a55e5.png" title="null" crop="0,0,1,1" id="OmJFD" class="ne-image">

MCP 权限边界图：这张图分三层：客户端层、Agent 层、MCP server 层。客户端请求进入认证，认证后得到 user scope；Agent 调用 MCP tool 前经过授权检查；MCP server 再次校验 token 和工具权限；工具执行后写审计日志再返回。图中要强调客户端、Agent 和 server 都不能单独被信任。
接入外部工具前至少要问：
- 谁在调用？
- 调用哪个工具？
- 参数是什么？
- 是否有权限？
- 是否需要人工确认？
- 调用结果是否包含敏感信息？
- 是否记录审计日志？

---

## 4. Guardrails LangChain guardrails 文档强调，可以在 Agent 执行前、执行后、模型调用前后或工具调用前后加入防护。 常见类型：

| 类型 | 作用 |
| --- | --- |
| Deterministic guardrails | 用规则检测和阻断 |
| Model-based guardrails | 用模型判断复杂语义风险 |
| PII middleware | 检测和处理个人敏感信息 |
| Human-in-the-loop | 高风险工具执行前人工批准 |
| Custom middleware | 自定义认证、限流、内容过滤 | ---

## 5. PII 处理 PII 包括邮箱、电话、地址、银行卡等个人信息。LangChain 提供 PII middleware，可以采用：
- `redact` + `mask` + `hash` + `block` 电商场景里，地址、手机号、发票信息都可能敏感。日志、trace、模型上下文和 MCP 调用都要考虑脱敏。

---

## 6. 高风险工具要审批 不能直接开放给 Agent 自动执行的工具：
- 退款。
- 发券。
- 改地址。
- 取消订单。
- 创建赔付单。
- 修改用户资料。
- 查询非当前用户订单。
这些工具即使通过 MCP 暴露，也必须有权限、审计和人工确认。

---

## 7. 最小安全清单

```latex
工具接入前： 1. 定义工具用途和参数 schema。 2. 定义调用者身份和权限。 3. 定义哪些参数由 runtime 提供，不能由模型填写。 4. 定义是否需要人工确认。 5. 定义日志和 trace 脱敏规则。 6. 定义错误返回和审计字段。
```

---

## 8. 常见错误

### 错误一：把 MCP 当成内部可信通道 协议标准化不等于安全可信。每次调用仍要认证和授权。

### 错误二：让模型填写身份和权限字段 user_id、tenant_id、scope 必须来自认证上下文。

### 错误三：只做 prompt 约束 安全边界不能只靠提示词。必须有代码级权限和工具级校验。

---

## 9. 本节知识框架总结

```latex
MCP 与安全 -> MCP 标准化连接工具和资源 -> 能暴露 tools / resources / prompts / agents -> 认证、授权、参数校验、审计缺一不可 -> Guardrails 可在执行前后拦截 -> PII 要脱敏或阻断 -> 高风险工具需要 human-in-the-loop
```

## 10. 本节小结 你需要记住：
1. MCP 解决连接问题，不自动解决安全问题。
2. 外部工具接入前必须定义权限边界。
3. 身份和权限不能由模型填写。
4. Guardrails、PII 处理和人工确认是 Agent 安全的重要组成。
5. 高风险业务动作必须有审批和审计。
课后练习：
1. 为“查询订单”设计 MCP 工具权限边界。
2. 为“退款”设计人工审批流程。
3. 列出 trace 中需要脱敏的字段。
4. 说明为什么 prompt 不能替代权限系统。
