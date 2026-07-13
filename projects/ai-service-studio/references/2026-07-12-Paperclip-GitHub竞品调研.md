# Paperclip GitHub 竞品调研

> 调研日期：2026-07-12
> 调研范围：GitHub 上与 Paperclip 相邻的开源项目和客户替代方案
> 调研目的：判断 Paperclip 在企业 AI 服务交付场景里真正面对谁竞争，以及应如何定位。

## 1. 一句话结论

Paperclip 在 GitHub 上没有很多完全同构的竞品。它最接近的定位是“AI agent 控制平面”：管理 agent、任务、审批、工作区、运行记录和交付过程。

真正会抢 Paperclip 使用场景的，不只是一类工具，而是四类替代方案：

1. agent 平台：AutoGPT、SuperAGI。
2. 多 agent 框架：MetaGPT、CrewAI、LangGraph、AutoGen、CAMEL。
3. AI 工作流平台：Dify、Flowise、Langflow、n8n、Activepieces。
4. coding agent 控制台：OpenHands、Open Interpreter，以及客户手动使用 Codex / Claude Code / Cursor。

对 `知行AI服务` 来说，Paperclip 不应该正面竞争“谁更会搭 agent”或“谁集成更多工具”。它的机会在交付侧：把一条业务流程的责任、状态、AI 使用、人工审核、异常处理和复盘记录固定下来。

## 2. Paperclip 的基准位置

GitHub 当前可见数据：

| 项目 | Stars | Forks | 最近推送 | GitHub 描述 |
|---|---:|---:|---|---|
| [paperclipai/paperclip](https://github.com/paperclipai/paperclip) | 73,415 | 13,679 | 2026-07-12 | The open-source app everyone uses to manage agents at work |

Paperclip 的特殊点：

- 用 company / org chart / agent / issue / routine / approval / workspace 来组织 AI 工作。
- 更像“AI 员工公司的任务与治理后台”，不是单纯 SDK。
- 支持把 Codex、Claude Code、Cursor、OpenClaw、HTTP webhook、process 等不同执行方式接进来。
- 强调任务、审批、预算、活动记录、执行工作区和人工治理。

它的竞争边界不是“能不能写 agent”，而是“谁来承载 agent 和人共同工作的交付过程”。

## 3. 第一类：直接相邻的 agent 平台

### AutoGPT

| 项目 | Stars | Forks | 最近推送 | 定位 |
|---|---:|---:|---|---|
| [Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | 185,486 | 46,106 | 2026-07-11 | Build, deploy, and run AI agents |

AutoGPT 当前 README 定位是“创建、部署和管理 continuous AI agents，用于自动化复杂工作流”。它有平台化方向、自托管和云端 beta 路径。

对 Paperclip 的威胁：

- 知名度和社区资产极强。
- 更容易被用户理解为“开源 agent 平台”。
- 对开发者来说，AutoGPT 的心智比 Paperclip 更早建立。

Paperclip 的差异：

- Paperclip 更强调组织、任务、审批和交付治理。
- AutoGPT 更像“agent 运行和构建平台”；Paperclip 更像“agent 工作管理和控制平面”。
- 企业咨询场景里，客户要解决的是流程交付，不一定是搭一个强 agent。

判断：AutoGPT 是强相邻竞品，但不是完全同类。若客户问题是“我要搭 autonomous agent”，AutoGPT 更容易进入候选；若客户问题是“我的团队怎么让 AI 参与业务流程且留痕”，Paperclip 更贴近。

### SuperAGI

| 项目 | Stars | Forks | 最近推送 | 定位 |
|---|---:|---:|---|---|
| [TransformerOptimus/SuperAGI](https://github.com/TransformerOptimus/SuperAGI) | 17,615 | 2,222 | 2025-01-22 | Build, manage and run autonomous AI agents |

SuperAGI 的 README 明确说它是开源框架，用来 build、manage、run autonomous AI agents。

对 Paperclip 的威胁：

- 名字和叙事直接覆盖 autonomous agent 管理。
- 有 marketplace、API、cloud 等平台化表达。

Paperclip 的差异：

- SuperAGI 的开源仓库最近推送较旧，GitHub 活跃度弱于 Paperclip 当前状态。
- Paperclip 当前更贴近“多 agent 工作的 task / approval / workspace / audit”。

判断：SuperAGI 是历史上更直接的 agent 平台竞品，但从 GitHub 活跃度看，当前对 Paperclip 的即时威胁低于 AutoGPT、Dify、OpenHands。

## 4. 第二类：多 agent 框架

这些项目通常不是 Paperclip 的直接替代品，而是被开发者用来“构建 agent 系统”的底层或中间层。

| 项目 | Stars | Forks | 最近推送 | 定位 |
|---|---:|---:|---|---|
| [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | 69,319 | 8,841 | 2026-01-21 | First AI Software Company / Multi-Agent Framework |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | 55,376 | 7,808 | 2026-07-11 | Production-ready multi-agent workflows |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | 37,086 | 6,225 | 2026-07-12 | Low-level orchestration framework for stateful agents |
| [microsoft/autogen](https://github.com/microsoft/autogen) | 59,671 | 8,983 | 2026-04-15 | Programming framework for agentic AI |
| [camel-ai/camel](https://github.com/camel-ai/camel) | 17,365 | 1,993 | 2026-07-10 | Multi-agent framework |

### MetaGPT

MetaGPT 的核心叙事是“把软件公司 SOP 编码进多 agent 系统”。它能从一句需求生成 user stories、competitive analysis、requirements、data structures、APIs、documents 等。

对 Paperclip 的威胁：

- “AI 软件公司”叙事和 Paperclip 的 autonomous AI company 心智接近。
- 对开发者来说，它给出了明确的 SOP 化多 agent 协作模式。

Paperclip 的差异：

- MetaGPT 偏向“软件开发团队自动产出”的框架。
- Paperclip 偏向“管理不同 agent 和任务执行过程”的控制平面。
- MetaGPT 更像执行逻辑，Paperclip 更像组织和交付载体。

### CrewAI

CrewAI 的 README 强调 Python framework、高层抽象和低层 API，支持 Crews（角色型 agent 协作）和 Flows（事件驱动流程）。其企业版 AMP Suite 提供部署、观测、治理、安全和企业支持。

对 Paperclip 的威胁：

- CrewAI 已明确往企业 control plane 延展。
- 开发者生态强，文档和课程体系成熟。
- 如果客户已有工程团队，CrewAI 更容易被作为技术栈选型。

Paperclip 的差异：

- CrewAI 更像“写 agent workflow 的框架”。
- Paperclip 更像“业务任务、审批、交付记录和 agent 执行状态的系统”。

判断：CrewAI 是 Paperclip 在“企业 agent 编排”方向的重要相邻竞品，但如果服务对象是非技术业务团队，Paperclip 的任务系统更容易解释。

### LangGraph

LangGraph 定位是构建 stateful agents 的低层 orchestration framework（编排框架）。它强调 durable execution（持久执行）、human-in-the-loop（人在回路中）、memory、debugging、deployment。

对 Paperclip 的威胁：

- 它的工程基础强，适合构建长期运行、可恢复、可观测的 agent 应用。
- LangChain / LangSmith 生态带来企业信任。

Paperclip 的差异：

- LangGraph 是开发框架，不是业务交付 UI。
- Paperclip 可以使用类似 LangGraph 的系统作为底层 agent 逻辑，但自身负责工作对象和交付过程。

判断：LangGraph 不是同层竞品，更像下层基础设施。Paperclip 若做产品化，应避免和它比 framework 能力。

## 5. 第三类：AI 工作流平台

这一类对企业 AI 服务更危险，因为客户已经能理解“可视化工作流”“RAG”“知识库”“自动化”“连接器”。

| 项目 | Stars | Forks | 最近推送 | 定位 |
|---|---:|---:|---|---|
| [langgenius/dify](https://github.com/langgenius/dify) | 148,559 | 23,425 | 2026-07-12 | Production-ready platform for agentic workflow development |
| [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) | 54,541 | 24,711 | 2026-07-06 | Build AI Agents, Visually |
| [langflow-ai/langflow](https://github.com/langflow-ai/langflow) | 151,732 | 9,661 | 2026-07-12 | Build and deploy AI agents and workflows |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | 196,133 | 59,267 | 2026-07-12 | AI agents and workflow automation |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | 23,232 | 3,917 | 2026-07-12 | AI workflow automation / MCP / agents |

### Dify

Dify 的 README 定位是开源 LLM app development platform，组合 AI workflow、RAG pipeline、agent capabilities、model management、observability。

对 Paperclip 的威胁：

- 对企业客户非常容易理解：做 AI 应用、知识库、RAG、工作流。
- 产品成熟度、社区规模、部署心智都强。
- 如果客户需求是“搭一个 AI 应用或知识库问答”，Dify 比 Paperclip 更直接。

Paperclip 的差异：

- Dify 更偏 AI 应用开发和工作流执行。
- Paperclip 更偏“人和 agent 共同完成任务”的交付过程管理。

判断：在企业 AI 服务里，Dify 是强竞品。Paperclip 不适合和 Dify 比“RAG/应用搭建”，应站在“流程交付、任务责任和人工审核”侧。

### Flowise / Langflow

Flowise 和 Langflow 都强调 visual builder（可视化构建器）。Langflow 还强调可以部署为 API / MCP server，并提供 observability。

对 Paperclip 的威胁：

- 可视化界面对非技术客户更直观。
- 更适合演示“我把 AI 节点连起来了”。
- 适合做 chatbot、agent flow、RAG demo。

Paperclip 的差异：

- Paperclip 不是节点画布；它的核心不是“连一个 AI flow”。
- Paperclip 的优势是任务状态、责任、审批、交付记录。

判断：如果客户要的是“搭一个可见 AI 工作流”，Flowise/Langflow 更自然；如果客户要的是“这条业务流程怎么被员工持续执行并复盘”，Paperclip 更自然。

### n8n / Activepieces

n8n 当前 README 已经明确称自己是 AI agents and workflow automation platform，强调 1500+ integrations、human approvals、observability、prototype to production。

对 Paperclip 的威胁：

- n8n 在企业自动化场景里非常强，连接器和模板是明显优势。
- 客户原本就会把“AI + 自动化”理解为 n8n 这种工具。
- 如果流程需要大量系统集成，n8n/Activepieces 比 Paperclip 更适合。

Paperclip 的差异：

- n8n 管的是系统之间的自动化流程。
- Paperclip 管的是 agent、人、任务、审批和交付过程。
- Paperclip 可以和 n8n 互补：n8n 触发外部系统动作，Paperclip 承载任务和审核记录。

判断：n8n 是“客户实际会买单”的强替代方案。Paperclip 不应承诺连接器能力，而应把 n8n 当成可集成对象。

## 6. 第四类：coding agent 控制台

| 项目 | Stars | Forks | 最近推送 | 定位 |
|---|---:|---:|---|---|
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | 80,520 | 10,273 | 2026-07-12 | AI-Driven Development / developer control center |
| [openinterpreter/openinterpreter](https://github.com/openinterpreter/openinterpreter) | 64,344 | 5,609 | 2026-07-07 | Lightweight coding agent |

OpenHands 当前 README 明确说 Agent Canvas 是 self-hosted developer control center for coding agents and automations，可以运行 OpenHands、Claude Code、Codex、Gemini 或 ACP-compatible agent，支持 local、remote、cloud backends，也支持 Slack、GitHub、Linear 等触发的 automations。

这对 Paperclip 很关键。OpenHands 和 Paperclip 都在争夺“多个 coding agents 如何被管理和触发”的位置。

对 Paperclip 的威胁：

- OpenHands 在 coding agent 场景更直接。
- 它的“developer control center”叙事清楚。
- 对工程团队来说，OpenHands 比 Paperclip 更像日常开发入口。

Paperclip 的差异：

- Paperclip 不只面向代码任务，还面向组织、项目、routine、审批和业务任务。
- Paperclip 的 company / org chart / issue / approval 更适合解释业务协作。

判断：在“管理 Codex/Claude Code 做开发任务”这件事上，OpenHands 是强竞品；在“企业 AI 服务交付载体”这件事上，Paperclip 仍有差异。

## 7. GitHub 上的直接 control-plane 小项目

搜索 `AI agent control plane` 会出现大量 0-2 stars 的新项目，例如：

- `AI-Agent-Control-Plane`
- `Secure-AI-Agent-Control-Plane`
- `agenthelm`
- `agentbucket`
- `hive`
- `aeryn`
- `kestrel-control-platform`
- `dotPilot`
- `Invoker`

这些项目说明一个趋势：很多人都在尝试“agent control plane”这个方向。但大部分项目目前缺少社区规模和稳定证据。

对 Paperclip 的意义：

- “control plane for agents” 是一个真实方向，不是 Paperclip 独有幻想。
- 但 Paperclip 目前在 GitHub 可见度和功能完整度上明显领先这些同名小项目。
- 未来风险不是某个小项目立刻超越，而是 Dify/n8n/OpenHands/CrewAI 这种成熟项目向 control plane 上层扩展。

## 8. 最大竞品其实是现状

对企业 AI 服务来说，最常见替代方案不是 GitHub 项目，而是客户现状：

- 飞书/企业微信/钉钉群 + 表格。
- Notion / Confluence / Jira / Linear。
- 人手动打开 ChatGPT / Claude / Codex / Cursor。
- 项目负责人靠会议和消息追进度。
- 自动化部分用 n8n、Zapier、Make。
- 文档知识库用 Dify、Coze、FastGPT、内部知识库。

这才是 Paperclip 第一阶段需要打败的东西。

如果客户已经用飞书表格记录任务，用 Codex 手动处理文档，用微信群提醒审核，那么 Paperclip 的卖点不是“我有更强 agent”，而是：

```text
把已经发生的人机协作，变成有责任、有状态、有审批、有交付记录的流程。
```

## 9. 对知行AI服务的定位建议

不要把 Paperclip 放在“AI 应用开发平台”位置。这个位置会撞上 Dify、Flowise、Langflow。

不要把 Paperclip 放在“自动化集成平台”位置。这个位置会撞上 n8n、Activepieces、Zapier、Make。

不要把 Paperclip 放在“多 agent 编程框架”位置。这个位置会撞上 LangGraph、CrewAI、AutoGen、CAMEL。

不要把 Paperclip 放在“coding agent IDE”位置。这个位置会撞上 OpenHands、Cursor、Claude Code、Codex。

Paperclip 更适合作为：

```text
AI 协作交付台：承载一条业务流程中的任务、责任、AI 使用、人工审核、异常处理和交付复盘。
```

这个定位对咨询更有利，因为你卖的不是工具本身，而是“交付机制”。

## 10. 竞品矩阵

| 类别 | 代表项目 | 客户为什么会选它 | Paperclip 应如何避开正面竞争 |
|---|---|---|---|
| Agent 平台 | AutoGPT、SuperAGI | 想创建和运行 autonomous agents | 不卖“搭 agent”，卖“agent 和人怎么交付” |
| 多 agent 框架 | MetaGPT、CrewAI、LangGraph、AutoGen、CAMEL | 工程团队要开发 agent 系统 | 不比 SDK，强调任务/审批/交付记录 |
| AI 工作流平台 | Dify、Flowise、Langflow | 想快速做 AI 应用、RAG、可视化流程 | 不比 RAG/画布，强调业务流程落地 |
| 自动化平台 | n8n、Activepieces | 想连接很多系统和触发器 | 把它们当集成层，Paperclip 管交付过程 |
| Coding agent 控制台 | OpenHands、Open Interpreter | 想管理代码 agent 和开发自动化 | Paperclip 覆盖更宽的业务任务和治理 |
| 客户现状 | 飞书/表格/Jira/Notion + 人手动用 AI | 零迁移成本，员工已习惯 | 从一条流程试点切入，证明少返工、留痕、可复盘 |

## 11. 对 Paperclip 的机会判断

Paperclip 的机会不在“最强 agent 能力”，而在“AI 工作进入组织后的管理对象”。

当企业员工已经开始手动使用 Codex、Claude、ChatGPT、Cursor 时，会出现这些问题：

- 任务是谁发起的？
- AI 处理的是哪一步？
- 输入材料在哪里？
- 输出物是否被审核？
- 哪些地方返工？
- 哪些任务卡住？
- 谁批准进入下一步？
- 员工下次如何复用？

Dify、n8n、CrewAI、LangGraph 能解决一部分“怎么构建/自动化”的问题，但未必天然解决“这条业务流程如何被交付和管理”的问题。

这就是 Paperclip 可以切入的位置。

## 12. 对第一单服务的建议

如果用 Paperclip 参与 `知行AI服务` 的第一单，不要从“平台部署”开始。

推荐服务名：

```text
一条业务工作流的 AI 协作交付试点
```

对外解释：

```text
我们不替换你们现有工具，也不要求员工放弃手动使用 ChatGPT/Codex/Claude。
我们先选一条高频流程，把任务、责任、AI 使用步骤、人工审核和交付记录放进一个可运行的协作台里。
试点目标是看它能不能减少交接混乱、返工和不可复盘。
```

第一轮只验证：

- 一条流程能不能跑完。
- 任务责任是否清楚。
- AI 使用点是否明确。
- 人工审核是否留痕。
- 交付物是否可找回。
- 返工原因是否可复盘。

## 13. 官方来源

- Paperclip：<https://github.com/paperclipai/paperclip>
- AutoGPT：<https://github.com/Significant-Gravitas/AutoGPT>
- SuperAGI：<https://github.com/TransformerOptimus/SuperAGI>
- MetaGPT：<https://github.com/FoundationAgents/MetaGPT>
- CrewAI：<https://github.com/crewAIInc/crewAI>
- LangGraph：<https://github.com/langchain-ai/langgraph>
- AutoGen：<https://github.com/microsoft/autogen>
- CAMEL：<https://github.com/camel-ai/camel>
- Dify：<https://github.com/langgenius/dify>
- Flowise：<https://github.com/FlowiseAI/Flowise>
- Langflow：<https://github.com/langflow-ai/langflow>
- n8n：<https://github.com/n8n-io/n8n>
- Activepieces：<https://github.com/activepieces/activepieces>
- OpenHands：<https://github.com/OpenHands/OpenHands>
- Open Interpreter：<https://github.com/openinterpreter/openinterpreter>
