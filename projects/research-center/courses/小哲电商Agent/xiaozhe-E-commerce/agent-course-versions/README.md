# 小哲电商 Agent 生死局代码快照目录

本目录保存“小哲电商 Agent 生死局”课程里的每个 Agent 版本快照。发布后，本目录位于发布包根目录的 `code/agent-course-versions/`。代码快照只放当前 lesson 的 Agent 本地脚本或 Agent 后端；小哲电商客服 Agent 调试后台、商城、管理后台和电商客服网关都是外部调用方，不复制进每节课目录。

从课程交付结构上看，`code/agent-course-versions/lesson-xx-*/` 只保留你需要阅读和运行的课程代码、场景材料和说明。运行命令以发布包根目录为参照，统一使用运行手册配置好的 `python` 和共享 `code/frontend/`。

从第 02 课开始，`backend/main.py` 保留为启动入口，但不会一路堆成巨大的单文件。课程快照会随着课次推进逐步长出 `api/`、`config/`、`models/`、`prompts/`、`agents/`、`cost/` 等模块。你看到的不只是每一课“能跑”，还会看到 Agent 后端怎样从一个入口服务逐渐长成接近生产项目的结构。

## 当前快照

| 课次 | 目录 | 类型 | 说明 |
|---:|---|---|---|
| 01 | `lesson-01-model-messages/` | 本地模型调用 | 先立客服危机和项目目标，再在终端里构造 `system -> user` messages，并取出模型返回的 assistant message。 |
| 02 | `lesson-02-chat-service/backend/` | 可运行后端 | 提供第一版 `/chat` Agent 后端服务。 |
| 03 | `lesson-03-llm-customer-boundary/backend/` | 可运行后端 | 让第一版 LLM 客服回答业务问题，同时暴露没有业务事实依据的边界。 |
| 04 | `lesson-04-intent-structured-output/backend/` | 可运行后端 | 在响应里加入第一版结构化意图。 |
| 05 | `lesson-05-prompt-boundary/backend/` | 可运行后端 | 在粗意图之后加入客服身份、事实优先级和回答边界，再把规则文档全量塞进 Prompt，暴露长上下文与规则冲突。 |
| 06 | `lesson-06-prompt-registry/backend/` | 可运行后端 | 用 Prompt Template 和 Prompt Registry 管理片段、优先级和启用状态。 |
| 07 | `lesson-07-token-cost-observation/backend/` | 可运行后端 | 在 Prompt Registry 基础上观察 token 和估算成本，并返回 `cost_summary`。 |
| 08 | `lesson-08-rag-thinking/backend/` | 可运行后端 | 从全量 Prompt 转向基础 RAG，只把相关知识交给模型。 |
| 09 | `lesson-09-document-chunking/backend/` | 可运行后端 | 把 Markdown 知识切成带 metadata 的 chunk。 |
| 10 | `lesson-10-embedding-retrieval/backend/` | 可运行后端 | 调用硅基流动 embedding 模型，并用向量相似度完成 top_k 检索。 |
| 11 | `lesson-11-rag-citations/backend/` | 可运行后端 | 返回知识引用来源，证明回答依据可追溯。 |
| 12 | `lesson-12-rag-quality-fallback/backend/` | 可运行后端 | 增加固定问题集质量检查和低置信兜底。 |
| 13 | `lesson-13-query-rewrite/backend/` | 可运行后端 | 在基础 RAG 前增加查询改写，处理口语化和含糊问题。 |
| 14 | `lesson-14-reranker/backend/` | 可运行后端 | 对初步召回的相似规则做轻量 reranker 重排。 |
| 15 | `lesson-15-hybrid-rag/backend/` | 可运行后端 | 组合 pre-retrieval、关键词召回、场景过滤和向量召回。 |
| 16 | `lesson-16-index-cache/backend/` | 可运行后端 | 增加索引版本、重建和稳定知识检索缓存边界。 |
| 17 | `lesson-17-realtime-business-facts/backend/` | 可运行后端 | 接入订单、物流和商品库存的业务事实服务，明确这类问题不能靠 RAG 猜。 |
| 18 | `lesson-18-tool-calling/backend/` | 可运行后端 | 把业务事实服务包装成只读工具箱，返回 Action / Observation 和 `tool_calls`。 |
| 19 | `lesson-19-tool-clarification/backend/` | 可运行后端 | 让 LLM 产出澄清规划，再由后端校验缺参和多候选。 |
| 20 | `lesson-20-tool-result-observation/backend/` | 可运行后端 | 把内部 ToolResult 压缩成 Observation，并返回 `next_action`。 |
| 21 | `lesson-21-error-degradation/backend/` | 可运行后端 | 增加错误分类、只读工具重试、模板降级和高风险动作边界。 |
| 22 | `lesson-22-tool-rag-product-answer/backend/` | 可运行后端 | 联合商品库存价格工具和商品知识 RAG 回答商品咨询。 |
| 23 | `lesson-23-hooks-governance/backend/` | 可运行后端 | 把工具调用前校验、工具调用后安全摘要、错误降级和完成摘要收拢到 Hooks。 |
| 24 | `lesson-24-mcp-tool-use/backend/` | 可运行后端 | 课程快照可独立运行，用来观察 MCP-style Tool Use、资源/Prompt 绑定和 Hooks 摘要。 |
| 25 | `lesson-25-task-planner-route-plan/backend/` | 可运行后端 | 加入 TaskPlanner，返回 RoutePlan；高置信规则直出，低置信真实调用分类模型，最终把请求分到 RAG、Tool、Tool + RAG 或高风险售后路径，并收窄候选工具。 |
| 26 | `lesson-26-high-risk-action-boundary/backend/` | 可运行后端 | 高风险退款诉求只做订单、物流和政策资格判断，不执行退款、取消或补偿。 |
| 27 | `lesson-27-langgraph-workflow/backend/` | 可运行后端 | 用 LangGraph StateGraph 固定售后节点顺序，公开 workflow 状态和节点历史。 |
| 28 | `lesson-28-unshipped-refund-workflow/backend/` | 可运行后端 | 拆出未发货退款流程，判断是否可准备退款申请。 |
| 29 | `lesson-29-received-return-workflow/backend/` | 可运行后端 | 加入签收后退货流程，判断签收时间、商品可退属性、原因和政策依据。 |
| 30 | `lesson-30-hitl-approval/backend/` | 可运行后端 | 资格通过后创建待人工审批申请，普通聊天不能作为审批结果。 |
| 31 | `lesson-31-resume-checkpoint-idempotency/backend/` | 可运行后端 | 开放 `/chat/resume`，用 workflow_id、resume_token、checkpoint、冻结字段复核和幂等键保护审批恢复。 |
| 32 | `lesson-32-session-memory/backend/` | 可运行后端 | 加入短期 Session Memory，记最近订单、最近商品、最近意图和低风险偏好，并排除隐私和高风险审批文本。 |
| 33 | `lesson-33-runtime-context/backend/` | 可运行后端 | 引入可信 Runtime Context，把会员等级、风险等级、页面上下文和系统权限拆成双通道。 |
| 34 | `lesson-34-context-builder/backend/` | 可运行后端 | 用 Context Builder 管理用户消息、Runtime Context、Session Memory、工具 Observation、RAG 片段和 Workflow State 的来源、可信度与冲突。 |
| 35 | `lesson-35-context-compression/backend/` | 可运行后端 | 增加上下文压缩、Sliding Window 和相关性选择，防止旧历史挤掉当前事实和 workflow 边界。 |
| 36 | `lesson-36-prompt-injection-defense/backend/` | 可运行后端 | 扫描用户、工具和 RAG 外部文本，标记污染、脱敏隐私、隔离脏指令并保护系统信息与 hidden reasoning。 |
| 37 | `lesson-37-trace-observability/backend/` | 可运行后端 | 把 Runtime Context、Context、Tool、RAG、Workflow/HITL、Hooks 和 Cost 记录成公开 `trace_event_v1`，不暴露 hidden CoT。 |
| 38 | `lesson-38-evaluation-regression/backend/` | 可运行后端 | 增加 `/eval/run` 和固定 `cases.yml`，检查 answer、tool_calls、citations、trace、session_state 和 workflow 回归。 |
| 39 | `lesson-39-failure-attribution-feedback/backend/` | 可运行后端 | 把用户反馈绑定到 trace/eval，归因到具体模块，并把事故回填成新的 eval case。 |
| 40 | `lesson-40-cost-governance/backend/` | 可运行后端 | 返回 `cost_summary_v1`，区分轻路径、重路径、常见命中缓存、Prompt 片段和 Observation 压缩。 |
| 41 | `lesson-41-final-rehearsal/backend/` | 可运行后端 | 第十幕综合演练版，串联 Tool、RAG、Workflow/HITL、Resume、Trace、Eval、反馈归因、成本治理、降级和安全拒绝。 |
| 42 | `lesson-42-tool-rag-scenario/` | 验证场景 | 复用第 41 课后端，验证物流走 Tool、活动/会员规则走 RAG，并检查引用和工具调用信号。 |
| 43 | `lesson-43-refund-hitl-scenario/` | 验证场景 | 复用第 41 课后端，验证未发货退款 workflow、HITL、审批恢复、checkpoint 和幂等边界。 |
| 44 | `lesson-44-degradation-security-scenario/` | 验证场景 | 复用第 41 课后端，验证服务降级、低置信兜底、安全拒绝和公开 trace 边界。 |
| 45 | `lesson-45-production-delivery-boundary/` | 交付材料 | 复用第 41 课后端，补生产交付清单、灰度上线、回滚、转人工和验收证据测试。 |
| 46 | `lesson-46-advanced-roadmap/` | 路线图与收束材料 | 不新增后端，整理知识运营、RAG Fusion、多知识库、BM25/ES、ANN、缓存、RLHF 边界、Subagents、简历表达、完整工程能力、项目亮点、成长路线和全课总结。 |

## 运行原则

- 第 01 课是本地脚本，从发布包根目录进入 `code/agent-course-versions/lesson-01-model-messages/` 后直接运行 `main.py`。
- 第 02-41 课有独立后端，从发布包根目录进入对应 `code/agent-course-versions/lesson-xx-*/backend/`，再用 `python main.py` 运行。第 24 课在本课快照里观察 MCP-style Tool Use、资源/Prompt 绑定和 Hooks 摘要。
- 第 42-45 课复用第 41 课后端：先启动 `code/agent-course-versions/lesson-41-final-rehearsal/backend/`，再按对应课程目录里的场景、清单或验收材料观察结果。
- 第 46 课不新增后端，阅读课程目录里的路线图和收束材料即可。
- 具体环境准备、模型配置和调试后台连接方式，统一看发布包根目录下的 `docs/运行手册.md`。
- 每节课只暴露当前已经讲清楚的能力，不为了调试后台展示而提前返回后续字段。
- 如果下一课推翻上一课设计，旧版本要保留，作为事故复现证据。

## 快照目录标准

每个 lesson 目录只放本课需要运行、观察或交付的材料，不复制共享调试后台、商城、管理后台、电商业务后端，也不在单课目录里创建独立模型配置或依赖文件。

- 第 01 课保留本地 `main.py` 和 README，用来证明 messages 如何进出模型，不创建 `backend/`。
- 第 02-41 课必须有 `backend/main.py`、`backend/agent_capabilities.json` 和 lesson README；`main.py` 只做启动入口，业务编排、路由、模型、RAG、Tool、Workflow、Trace、Eval、Cost 等能力按课次逐步拆到对应模块。
- 第 02-41 课的 `/capabilities` 能力声明要和当前课已讲内容一致，调试后台根据它点亮或置灰区域；不能为了前端展示提前暴露后续能力。
- 第 38-41 课如果出现回归验证，固定场景放在 `backend/cases.yml`，由 `/eval/run` 或对应测试读取。
- 第 42-44 课只能放场景验证材料、截图和 README，例如 `scenario_*.json`；它们复用第 41 课后端，不再复制一套 `backend/`。
- 第 45 课放生产交付、上线边界、验收证据和检查清单；它复用第 41 课后端，不新增主线 Agent 能力。
- 第 46 课放增强路线图和项目收束材料，不新增后端、不新增生产承诺。

最终可运行 Agent 以 `lesson-41-final-rehearsal/backend/` 为课程快照终点。后续如果需要补充课程材料，优先补 README、场景 JSON、测试或清单；只有 02-41 课的能力确实发生变化时，才修改对应 lesson 后端。
