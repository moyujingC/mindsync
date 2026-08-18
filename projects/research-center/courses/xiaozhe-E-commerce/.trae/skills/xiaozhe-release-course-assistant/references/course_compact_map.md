# 精炼课程地图

这是一份给“小哲电商 Agent”学习者使用的精炼导读。它面向从云效/Codeup 拉取的公开代码仓；该代码仓有意不包含完整课程 Markdown。本文不是付费课程正文的替代品，只用于定位知识点、解释课次边界、指向可运行代码和调试台观察信号。回答学习者问题时，不要把这些笔记扩写成完整课程讲稿。

## 回答边界

- 给出精炼导航：课次、能力线、观察信号、代码或材料目录。
- 不复述完整课程正文、长案例、叙事段落、图文讲解、练习或逐步讲稿。
- 如果学习者追问概念，优先用机制层解释，并连接到本地代码仓中的可观察字段，不复制课程段落。
- 公开代码仓中，每课代码在 `agent-course-versions/`，调试台在 `frontend/`。
- `courses/story/`、`courses/basic/` 不随公版代码仓提供是正常现象；环境、模型 Key、服务启动和访问地址使用仓内 `doc/运行手册.md`，课程导读以本精炼课程地图、`common_routes.md`、`lesson_delta_map.json` 和本地代码材料为依据。

## 故事课整体形态

- 01：本地脚本，理解 message 输入输出。
- 02-07：最小 Agent 后端，覆盖 chat API、Prompt 边界、结构化输出、Prompt Registry、token 观察。
- 08-16：RAG 能力线，从粗暴塞知识到切片、embedding、引用、低置信兜底、查询改写、重排、混合检索、索引和缓存。
- 17-24：Tool 能力线，覆盖业务事实、Tool Calling、缺参澄清、Observation 摘要、降级、Tool + RAG、治理和 MCP-style 边界。
- 25-31：路由规划和高风险 Workflow 能力线，覆盖退款/退货流程、HITL、恢复、checkpoint 和幂等。
- 32-36：Memory 与上下文工程能力线，覆盖 Session Memory、Runtime Context、Context Builder、压缩和 Prompt Injection 隔离。
- 37-41：上线前证据能力线，覆盖 Trace、Evaluation、反馈、成本治理和最终总演习。
- 42-44：复用第 41 课运行时的综合场景验证包。
- 45：生产交付边界和上线表达。
- 46：增强路线图和项目收束，不新增后端。

## 故事课课次地图

| 课次 | 精炼标题 | 主要能力 | 代码/调试台观察 |
|---:|---|---|---|
| 01 | Message 输入输出 | 模型消息和第一个本地脚本 | `lesson-01-model-messages/`，终端 assistant message |
| 02 | Chat 服务 | FastAPI `/chat` 入口和调试台连接 | `lesson-02-chat-service/backend/`，`answer` |
| 03 | 客服边界 | 小哲电商公司客服身份和业务回答边界 | `lesson-03-llm-customer-boundary/backend/`，回答范围更受控 |
| 04 | 意图结构化 | 用结构化结果表达意图和风险 | `lesson-04-intent-structured-output/backend/`，路由字段 |
| 05 | Prompt 边界 | System/Human 边界和高风险承诺控制 | `lesson-05-prompt-boundary/backend/`，拒答或有限承诺 |
| 06 | Prompt Registry | Prompt 片段、优先级和注册表组合 | `lesson-06-prompt-registry/backend/`，选中的 fragments |
| 07 | Token 观察 | 早期成本可见性 | `lesson-07-token-cost-observation/backend/`，`cost_summary` |
| 08 | RAG 思路 | 稳定 SOP 知识从 Prompt 移到检索 | `lesson-08-rag-thinking/backend/`，RAG 路径开始出现 |
| 09 | 切片与元数据 | 文档切片并附带 metadata | `lesson-09-document-chunking/backend/`，chunk/source metadata |
| 10 | Embedding 检索 | 第一版向量召回 | `lesson-10-embedding-retrieval/backend/`，retrieved chunks |
| 11 | 引用来源 | 让回答依据可追溯 | `lesson-11-rag-citations/backend/`，`citations` |
| 12 | 质量兜底 | 低置信和无证据边界 | `lesson-12-rag-quality-fallback/backend/`，fallback reason |
| 13 | 查询改写 | 检索 query 不一定等于用户原话 | `lesson-13-query-rewrite/backend/`，rewritten query |
| 14 | Reranker | 对相似候选重新排序 | `lesson-14-reranker/backend/`，rerank score/reason |
| 15 | Hybrid RAG | 组合向量、关键词和场景路由 | `lesson-15-hybrid-rag/backend/`，hybrid retrieval evidence |
| 16 | 索引和缓存 | 知识增长、索引更新和缓存压力 | `lesson-16-index-cache/backend/`，index/cache 字段 |
| 17 | 实时事实 | 订单/物流事实来自业务后端 | `lesson-17-realtime-business-facts/backend/`，tool/API fact |
| 18 | Tool Calling | Tool schema、参数和身份边界 | `lesson-18-tool-calling/backend/`，`tool_calls` |
| 19 | 澄清机制 | 缺订单号时先问清，不猜 | `lesson-19-tool-clarification/backend/`，clarification response |
| 20 | Tool Observation | 工具结果进模型上下文前先摘要和脱敏 | `lesson-20-tool-result-observation/backend/`，observation summary |
| 21 | 降级 | 模型/工具失败分类和安全兜底 | `lesson-21-error-degradation/backend/`，degradation reason |
| 22 | Tool + RAG | 商品回答同时看库存价格和知识 | `lesson-22-tool-rag-product-answer/backend/`，tool plus citations |
| 23 | Tool 治理 | 用 Hooks 收拢重复工具控制 | `lesson-23-hooks-governance/backend/`，hook/governance path |
| 24 | MCP 边界 | Tool/Resource/Prompt 超出单个 Agent 的边界 | `lesson-24-mcp-tool-use/backend/`，MCP-style 目录 |
| 25 | RoutePlan | 判断走 RAG、Tool、Workflow 或混合路径 | `lesson-25-task-planner-route-plan/backend/`，`RoutePlan` |
| 26 | 高风险动作 | 退款不是自由聊天决策 | `lesson-26-high-risk-action-boundary/backend/`，risk boundary |
| 27 | Workflow | 用固定流程约束退款/退货 | `lesson-27-langgraph-workflow/backend/`，workflow state |
| 28 | 未发货退款 | 先查订单，再查政策，再判断退款路径 | `lesson-28-unshipped-refund-workflow/backend/`，workflow nodes |
| 29 | 已签收退货 | 看时间、商品、原因和政策门槛 | `lesson-29-received-return-workflow/backend/`，return decision |
| 30 | HITL 审批 | Agent 提交申请，人工审批 | `lesson-30-hitl-approval/backend/`，`resume_token` |
| 31 | 恢复和幂等 | 安全恢复审批，避免重复提交 | `lesson-31-resume-checkpoint-idempotency/backend/`，checkpoint/idempotency |
| 32 | Session Memory | 只记有用的短期引用 | `lesson-32-session-memory/backend/`，session memory 字段 |
| 33 | Runtime Context | 可信运行时事实高于用户自称 | `lesson-33-runtime-context/backend/`，runtime context |
| 34 | Context Builder | 分层组织历史、RAG、Tool 和 Runtime Context | `lesson-34-context-builder/backend/`，context summary |
| 35 | 上下文压缩 | 处理长上下文和 Sliding Window | `lesson-35-context-compression/backend/`，compression summary |
| 36 | Prompt Injection 防护 | 隔离用户/工具/RAG 带来的脏指令 | `lesson-36-prompt-injection-defense/backend/`，safety decision |
| 37 | Trace | 证明 Agent 为什么这样回答 | `lesson-37-trace-observability/backend/`，`trace_event_v1` |
| 38 | Evaluation | Prompt/代码变更后的回归检查 | `lesson-38-evaluation-regression/backend/`，`eval_report_v1` |
| 39 | 反馈闭环 | 失败归因和改进证据 | `lesson-39-failure-attribution-feedback/backend/`，feedback records |
| 40 | 成本治理 | 区分轻重路径并记录成本 | `lesson-40-cost-governance/backend/`，`cost_summary` |
| 41 | 最终总演习 | 模型优先路由、真实 Embedding、Tool/RAG/HITL 与安全护栏综合演练 | `lesson-41-final-rehearsal/backend/`，model/embedding/route/tool/workflow/trace/eval/cost |
| 42 | Tool/RAG 场景 | 当前商品事实与平台通用规则分层 | `lesson-42-tool-rag-scenario/`，Tool fact + RAG citation + 适用边界 |
| 43 | 退款 HITL 场景 | 退款请求必须停下来等人工审批 | `lesson-43-refund-hitl-scenario/`，场景 JSON + resume 信号 |
| 44 | 降级/安全场景 | 显式故障注入、越权追问和知识没命中 | `lesson-44-degradation-security-scenario/`，fault-injection source + 安全兜底 |
| 45 | 交付边界 | 说明哪些能上线、哪些不能承诺 | `lesson-45-production-delivery-boundary/`，交付清单/材料 |
| 46 | 路线图 | 后续生产增强和项目表达 | `lesson-46-advanced-roadmap/`，路线图材料 |

## 基础课地图

| 基础课范围 | 主题 | 对应故事课 |
|---|---|---|
| 01-04 | Agent、模型消息、执行循环、电商场景地图 | 01-04 |
| 05-08 | Prompt、上下文基础、结构化输出、Streaming 用户体验 | 05-07 |
| 09-12 | Tool Calling、工具错误、ToolRuntime/ToolNode、第一个 `create_agent` | 17-24 |
| 13-16 | RAG 需求、切片、引用、Agentic RAG | 08-16 |
| 17-19 | 短期记忆、长期记忆隐私、Runtime Context | 32-33 |
| 20-24 | LangGraph、状态/节点/边、持久化、函数式工作流、HITL | 26-31 和 43 |
| 25-28 | 错误处理、Trace、Evaluation、MCP 安全 | 21、24、37-38、44 |
| 29-33 | 工程心智、上下文记忆、沙箱/安全、Hooks/Skills/MCP、Subagents | 23-24、34-36、41-46 |

## 常见路线回答

- Tool/工具调用：先看基础课 09-11，再看故事课 17-24。想理解业务事实从故事课 17 开始；想看 schema/参数边界看故事课 18；想看工具结果怎么进入上下文看故事课 20。
- RAG/知识库：先看基础课 13-16，再看故事课 08-16。为什么需要 RAG 看故事课 08；向量检索看 10；引用看 11；低置信兜底看 12；混合检索看 15。
- Prompt：基础课 05，故事课 05-07。Prompt 片段和注册表重点看故事课 06；成本压力看故事课 07 和 40。
- Runtime Context：基础课 19，故事课 33。如果问题转向上下文组装、压缩或注入防护，再看故事课 34-36。
- Workflow/HITL：基础课 20-24，故事课 26-31 和 43。人工审批从故事课 30 进入；恢复、checkpoint、幂等看故事课 31。
- Trace/Eval/Cost：基础课 26-27，故事课 37-40 和 41。第 41 课是综合观察点。
- 第 41 课模型与规则边界：普通商品、订单、FAQ、活动路由看真实模型；退款、退货、安全和降级看确定性业务护栏。RAG 默认看真实 Embedding，只有显式离线模式才看本地 token embedding。
- 生产交付/项目表达：故事课 41-46。重点说明课程项目是“生产形态演示”，不是完整企业系统上线包。

## 代码阅读捷径

- 相邻课对比：优先使用 `lesson_delta_map.json` 中的 `delta`、`focus`、`observe`，再结合 `lesson_delta.py` 的本地代码 diff。
- `/chat` 请求/响应和调试字段：看每课后端的 `api/` 模块；如果需要前端字段，再看 `frontend` 里的 API 类型。
- Prompt 和回答组装：看每课后端的 `agents/`。
- RAG 检索和引用：看每课后端的 `rag/`、`knowledge/`、响应里的 `citations`。
- Tool schema 和执行：看每课后端的 `tools/` 和 `integrations/`。
- Tool 结果进入模型上下文前的治理：重点看故事课 20，尤其是 `tools/` 或 `agents/` 下的 observation/summary 路径。
- 路由规划：看故事课 25 的 `RoutePlan` 和 planner 路径。
- 退款/退货 Workflow：看故事课 26-31 的 `workflows/`、checkpoint 和 state 模块。
- Memory/上下文：看故事课 32-36 的 `state/`、`memory`、`context_builder` 或压缩模块。
- Trace/Eval/Cost：看故事课 37-40 的 `observability/`、`evals/`、`feedback/` 和 `cost/`。
