# Hooks、Skills、MCP 与扩展分层：不要把所有能力都塞进 Prompt

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396401840-eb41bcaf-2549-42c7-b6a1-63835fed98c1.png" title="null" crop="0,0,1,1" id="CYy4r" class="ne-image">

本节总览图：这张图从下到上画五层：`Prompt / system instruction`、`Project memory / rules`、`Skills`、`MCP tools`、`Hooks`。左侧标注每层解决的问题：角色约束、长期规则、专门任务流程、外部系统能力、生命周期拦截。右侧用电商例子连接：客服口径、售后规则、质检技能、CRM 工具、退款审批 Hook。图中强调能力应该分层，而不是全部写进一个大 Prompt。

## 课程目标

学完这一节，你应该能说清：
- 为什么 Prompt 不能承载所有 Agent 能力。
- Hooks、Skills、MCP 分别解决什么问题。
- Skill 和 MCP 的区别。
- Hook 和 Skill 的区别。
- 哪些内容适合放项目规则，哪些适合做工具或 Hook。
- 如何把 Claude Code 的扩展分层思想迁移到业务 Agent。

---

## 1. Prompt 不是万能容器 刚开始写 Agent 时，很容易把所有东西都写进 Prompt：
- 业务规则。
- 工具使用说明。
- 错误处理。
- 安全要求。
- 输出格式。
- 审批逻辑。
- 外部系统说明。
这样做的问题是：
- Prompt 越来越长。
- 规则难维护。
- 能力难复用。
- 权限无法真正控制。
- 测试和审计困难。
工程化 Agent 要做的是分层：每类能力放到最合适的位置。

---

## 2. Claude Code 的扩展层次 Claude Code 官方 features overview 对 CLAUDE.md、Rules、Skills、MCP、Hooks、Subagents 做了区分。 本节提到的 Rules、Skills、MCP、Hooks 是 Claude Code 当前官方能力。不同客户端、版本、账号和组织配置可能影响具体可用性；基础课重点是理解扩展分层，不要求把所有事件和配置项都背下来。 本节先看四类扩展：

| 机制 | 适合解决的问题 |
| --- | --- |
| Project memory / rules | 项目长期规则和协作约定 |
| Skills | 某类任务的专门流程和参考材料 |
| MCP | 连接外部工具和数据源 |
| Hooks | 在生命周期关键点拦截、补充、审批或自动化 |

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396401340-895a2187-fdf9-446f-972b-80ac64463225.png" title="null" crop="0,0,1,1" id="hj1M7" class="ne-image">

扩展机制选择图：这张图以一个决策树展示选择关系。问题一：这是长期规则吗？是则进入 `Project memory / rules`。问题二：这是可复用任务流程吗？是则进入 `Skill`。问题三：需要访问外部系统吗？是则进入 `MCP tool`。问题四：需要在工具调用前后拦截或审批吗？是则进入 `Hook`。否则保留在 Prompt 或普通代码逻辑中。
官方文档里一个很重要的判断标准是“加载方式”：

| 机制 | 加载方式 | 适合内容 |
| --- | --- | --- |
| CLAUDE.md | 每个会话自动加载 | 总是需要知道的项目规则 |
| `.claude/rules/` | 每个会话或匹配文件时加载 | 目录、语言、文件类型规则 |
| Skills | 按需加载 | 特定任务流程、参考材料、可触发工作流 | 选择原则可以简化为：

```latex
总是要知道 -> CLAUDE.md 只对某类文件生效 -> Rules 只在特定任务中需要 -> Skill
```

电商 Agent 中可以对应为：
- 客服身份和不能编造事实：系统提示词或项目规则。
- 后端工具开发规范：路径规则。
- 售后质检流程：Skill。
- 售后政策原文：RAG 知识库。

---

## 3. Skills：专门任务能力 Skill 适合封装某类可复用任务的步骤、说明和辅助文件。 例如：
- 生成测试报告。
- 做代码评审。
- 生成数据分析图表。
- 编写课程文档。
- 检查 Agent 安全清单。
Skill 不一定直接访问外部业务系统。它更像一个“专门任务包”，告诉 Agent 遇到某类任务时应该怎么做。
在电商 Agent 中，类似 Skill 的设计可以是：

```latex
售后质检技能： 1. 检查回答是否引用政策。 2. 检查是否承诺未审批退款。 3. 检查是否泄露用户隐私。 4. 输出质检结论和修改建议。
```

这类能力不适合塞进每个客服 Prompt，而应该做成可复用模块。

---

## 4. MCP：连接外部工具和数据源 MCP 适合把外部系统能力标准化暴露给 Agent。 例如：
- CRM。
- 工单系统。
- 订单系统。
- 物流系统。
- 知识库。
- 监控平台。
Skill 和 MCP 的区别：

| 对比项 | Skill | MCP |
| --- | --- | --- |
| 核心作用 | 任务流程和说明 | 外部工具和数据连接 |
| 是否一定访问外部系统 | 不一定 | 通常是 |
| 典型内容 | Markdown、脚本、参考资料 | tools、resources、prompts |
| 电商例子 | 售后质检流程 | 查询 CRM 用户标签 | 如果你只是想告诉 Agent “如何写售后质检报告”，更像 Skill。 如果你要让 Agent “查询 CRM 里的用户等级”，更像 MCP tool。 MCP 和 Skill 也可以组合。

```latex
CRM MCP server：提供 get_customer_profile 工具。 客服质检 Skill：说明如何解读用户等级、投诉历史和风险标签。
```

MCP 提供能力，Skill 提供使用这些能力的方法。这样比把 CRM 接口说明写进 Prompt 更清晰，也比让工具自己承载业务判断更可维护。

---

## 5. Hooks：生命周期拦截和自动化 Hook 适合在关键事件发生时自动执行逻辑。 例如：
- 用户提交 prompt 前补充上下文。
- 工具调用前检查权限。
- 工具调用后记录审计。
- 修改文件后自动运行测试。
- 会话结束时保存总结。
在业务 Agent 中，Hook 思想可以迁移为 middleware、guardrail 或流程节点：

```latex
Agent 准备调用 refund_tool -> PreToolUse hook 检查订单金额、用户权限、审批状态 -> 不满足条件则阻断 -> 满足条件才执行工具 -> PostToolUse hook 写入审计日志
```

Hook 的关键是：它不是让模型“记得要做”，而是在系统生命周期里自动发生。
Claude Code 官方文档把这些生命周期点称为 hook events。课程里统一使用官方事件名。
常见事件可以先记住下面这些：

| 官方事件名 | 触发时机 | 适合做什么 |
| --- | --- | --- |
| `UserPromptSubmit` | 用户提交 prompt 后，Claude 处理前 | 输入检查、补充上下文、拦截明显危险请求 |
| `PreToolUse` | 工具调用执行前 | 工具调用前审批、权限检查、阻断危险命令 |
| `PostToolUse` | 工具调用成功后 | 结果后处理、格式化、审计日志、自动测试 |
| `Stop`  |

一轮响应完成后 | 完成后的审计日志、质量检查、通知 |
| `SessionStart` / `SessionEnd` | 会话开始或结束时 | 初始化环境、加载上下文、保存会话总结 | 进阶事件还包括工具失败、停止失败、子 Agent 停止等场景，例如 `PostToolUseFailure`、`StopFailure`、`SubagentStop`。这些适合在需要细粒度审计和自动化时再查官方文档确认当前版本支持情况。 有些系统或文章会把这些模式叫作：

```latex
pre-tool-call post-tool-call on-error on-completion
```

这些叫法有助于理解，但在 Claude Code 课程里要以官方事件名为准。例如：

| 口语化叫法 | Claude Code 官方事件 |
| --- | --- |
| pre-tool-call | `PreToolUse` |
| post-tool-call | `PostToolUse` |
| on-error | `PostToolUseFailure` 或 `StopFailure` |
| on-completion | `Stop` 或 `SessionEnd` |

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396402402-8795f62c-52ac-4569-be50-c0ab13a8d9d8.png" title="null" crop="0,0,1,1" id="hrwuR" class="ne-image">

Hooks 事件类型图：这张图按时间顺序画出一次 Claude Code 会话：`SessionStart -> UserPromptSubmit -> agentic loop`。在 agentic loop 内部画 `PreToolUse -> tool execution -> PostToolUse`，失败分支进入 `PostToolUseFailure`。一轮回答结束进入 `Stop`，整个会话结束进入 `SessionEnd`。图中要标注每个事件适合的动作：输入检查、工具前审批、结果后处理、错误拦截、完成审计、会话总结。
Hook 和 Skill 的区别要特别清楚：

| 对比项 | Hook | Skill |
| --- | --- | --- |
| 触发方式 | 生命周期事件自动触发 | 用户调用或模型判断相关时加载 |
| 执行方式 | 命令、HTTP、模型或子 Agent | 作为说明和材料进入上下文 |
| 确定性 | 更强，事件发生就执行 | 依赖模型理解和执行 |
| 适合场景 | 阻断危险命令、自动测试、日志审计 | 发布流程、代码规范、质检清单 |
| 上下文成本 | 默认几乎不占上下文 | 描述会加载，内容按需加载 | 一句话：

```latex
必须稳定发生的，用 Hook。 需要模型理解后灵活执行的，用 Skill。
```

例如“退款前必须审批”更像 Hook 或 guardrail；“如何写退款质检报告”更像 Skill。

---

## 6. 分层设计示例 同样是“售后退款”，不要写成一个巨大的 Prompt。 更好的分层：

| 层 | 放什么 |
| --- | --- |
| System Prompt | 你是电商客服助手，不能编造订单和政策 |
| Project memory | 退款、发券、改地址是高风险动作 |
| RAG knowledge | 售后政策、退换货期限、不可退品类 |
| Tools / MCP | 查询订单、查询物流、创建售后单 |
| Hooks / Guardrails | 退款前审批、审计日志、PII 脱敏 |
| LangGraph | 多步售后流程和人工确认 |

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396402395-fd7e9257-3c3a-4ccf-b51d-dcd0b0af8026.png" title="null" crop="0,0,1,1" id="DHeQn" class="ne-image">

售后退款分层图：这张图以 `退款请求` 为入口，先进入 `System Prompt` 约束角色，再分别调用 `RAG policy` 查询政策、`Order tool` 查询订单、`Guardrail / Hook` 检查权限，最后进入 `Human approval` 或 `Create ticket`。图中要用不同层级框展示每个能力所在位置，强调不是所有逻辑都放在 Prompt。

---

## 7. 常见错误

### 错误一：用 Prompt 代替工具 实时订单状态必须查工具，不应该让模型凭规则猜。

### 错误二：用 Skill 代替权限 Skill 可以告诉 Agent 怎么做，但不能强制阻断高风险动作。权限要在系统层实现。

### 错误三：用 MCP 代替业务流程 MCP 只提供工具连接。多步流程、审批和状态管理仍然需要应用层或 LangGraph 编排。

### 错误四：把必须执行的安全规则写成 Skill Skill 是模型会读的说明，不是强制拦截。必须稳定执行的安全规则要放到 Hook、guardrail、权限系统或后端代码里。

### 错误五：只记口语化 Hook 名称，不看官方事件名 `pre-tool-call`、`post-tool-call`、`on-error`、`on-completion` 这些叫法可以帮助理解，但真实配置应该使用 Claude Code 官方事件名。基础阶段先记住 `PreToolUse`、`PostToolUse`、`Stop`；失败类事件例如 `PostToolUseFailure`、`StopFailure`，需要用到时再查当前官方文档确认。

---

## 8. 本节知识框架总结

```latex
扩展分层 -> Prompt 负责角色和基本约束 -> Project memory / rules 负责长期项目规则 -> Skills 负责可复用任务流程 -> MCP 负责外部工具和数据连接 -> Hooks 负责生命周期拦截、审批和自动化 -> UserPromptSubmit 在模型处理前触发 -> PreToolUse 在工具执行前触发 -> PostToolUse 在工具成功后触发 -> Stop 在一轮响应结束后触发 -> 失败和子 Agent 相关事件属于进阶 Hook 场景 -> LangGraph 负责复杂流程编排
```

## 9. 本节小结 你需要记住：
1. Prompt 不能承载所有 Agent 能力。
2. Skill 更偏任务流程，MCP 更偏外部连接。
3. Hook 适合做工具前后拦截、审批、审计和自动化。
4. MCP 不是流程编排，也不是权限系统。
5. Claude Code Hook 事件名要以官方名称为准。
6. 工程化 Agent 要按职责分层设计。
课后练习：
1. 把“客服回答售后问题”拆成 Prompt、知识库、工具、Hook 四层。
2. 说明“查询 CRM 用户等级”为什么更适合 MCP，而不是 Skill。
3. 为“退款前审批”设计一个 Hook 或 guardrail 触发点。
