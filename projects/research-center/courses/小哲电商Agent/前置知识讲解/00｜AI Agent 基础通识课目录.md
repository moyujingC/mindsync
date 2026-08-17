# AI Agent 基础通识课目录

这里是发布包内的基础通识课，用来解释 AI Agent、LangChain、LangGraph、RAG、Tool Calling、Memory、Runtime Context、Trace、Evaluation 等概念本身。故事课负责展示这些知识点如何在小哲电商客服 Agent 中落地。
建议先按需要阅读基础课，再回到 `../story/` 找对应故事课观察代码和调试后台证据。

## 课程列表
| 课次 | 课程 |
| ---: | --- |
| 01 | [AI Agent：让模型从回答问题走向执行任务](https://www.yuque.com/u28128023/erro2f/basic-01) |
| 02 | [模型与消息：把对话变成模型能理解的结构化上下文](https://www.yuque.com/u28128023/erro2f/basic-02) |
| 03 | [Agent 执行循环：让模型在思考、行动和观察之间迭代](https://www.yuque.com/u28128023/erro2f/basic-03) |
| 04 | [Agent 场景地图：先判断任务边界，再决定是否使用 Agent](https://www.yuque.com/u28128023/erro2f/basic-04) |
| 05 | [Prompt 角色边界：让模型按业务规则回答，而不是顺着用户乱承诺](https://www.yuque.com/u28128023/erro2f/basic-05) |
| 06 | [上下文工程：把正确的信息放进模型当前能看到的位置](https://www.yuque.com/u28128023/erro2f/basic-06) |
| 07 | [结构化输出：让模型返回可校验、可处理的数据](https://www.yuque.com/u28128023/erro2f/basic-07) |
| 08 | [Streaming：让用户看到回复和执行过程正在发生](https://www.yuque.com/u28128023/erro2f/basic-08) |
| 09 | [Tool Calling：让模型使用工具，而不是凭空回答](https://www.yuque.com/u28128023/erro2f/basic-09) |
| 10 | [工具参数和错误处理：让工具调用从“能跑”变成“可靠”](https://www.yuque.com/u28128023/erro2f/basic-10) |
| 11 | [ToolRuntime 与 ToolNode：让工具进入可控的 LangGraph 流程](https://www.yuque.com/u28128023/erro2f/basic-11) |
| 12 | [create_agent：组装第一个能判断、调用工具并回答的 Agent](https://www.yuque.com/u28128023/erro2f/basic-12) |
| 13 | [RAG：让模型基于外部知识回答，而不是背诵过期记忆](https://www.yuque.com/u28128023/erro2f/basic-13) |
| 14 | [文档切片与元数据：让知识库既能搜到，也能追溯](https://www.yuque.com/u28128023/erro2f/basic-14) |
| 15 | [引用与防幻觉：让 RAG 回答有依据，也知道何时说不确定](https://www.yuque.com/u28128023/erro2f/basic-15) |
| 16 | [Agentic RAG：让 Agent 决定何时检索、如何继续](https://www.yuque.com/u28128023/erro2f/basic-16) |
| 17 | [短期记忆：让 Agent 在同一会话里接住上下文](https://www.yuque.com/u28128023/erro2f/basic-17) |
| 18 | [长期记忆：保存跨会话信息之前，先划清隐私边界](https://www.yuque.com/u28128023/erro2f/basic-18) |
| 19 | [Runtime 上下文：把用户、渠道和配置安全地传给工具](https://www.yuque.com/u28128023/erro2f/basic-19) |
| 20 | [LangGraph：用状态机表达可控、可恢复的 Agent 流程](https://www.yuque.com/u28128023/erro2f/basic-20) |
| 21 | [状态、节点和边：LangGraph 的最小表达单元](https://www.yuque.com/u28128023/erro2f/basic-21) |
| 22 | [Functional API：用 ](https://www.yuque.com/u28128023/erro2f/basic-22)`@entrypoint`[ 和 ](https://www.yuque.com/u28128023/erro2f/basic-22)`@task`[ 构建函数式工作流](https://www.yuque.com/u28128023/erro2f/basic-22) |
| 23 | [持久化与时间旅行：让 Agent 流程可以暂停、恢复和回看](https://www.yuque.com/u28128023/erro2f/basic-23) |
| 24 | [Interrupt：在高风险动作前暂停，让人确认后再继续](https://www.yuque.com/u28128023/erro2f/basic-24) |
| 25 | [错误处理与容错：让 Agent 在失败时可恢复、可降级](https://www.yuque.com/u28128023/erro2f/basic-25) |
| 26 | [Trace：看清 Agent 每一步为什么这样做](https://www.yuque.com/u28128023/erro2f/basic-26) |
| 27 | [评估与测试：用数据判断 Agent 有没有变好](https://www.yuque.com/u28128023/erro2f/basic-27) |
| 28 | [MCP 与安全边界：接入外部工具前先定义权限和审计](https://www.yuque.com/u28128023/erro2f/basic-28) |
| 29 | [Claude Code 工程化心智模型：从会聊天走向会执行工程任务](https://www.yuque.com/u28128023/erro2f/basic-29) |
| 30 | [上下文工程与项目记忆：让 Agent 长期理解项目规则](https://www.yuque.com/u28128023/erro2f/basic-30) |
| 31 | [工具、权限、沙箱与安全边界：让 Agent 能做事但不能越界](https://www.yuque.com/u28128023/erro2f/basic-31) |
| 32 | [Hooks、Skills、MCP 与扩展分层：不要把所有能力都塞进 Prompt](https://www.yuque.com/u28128023/erro2f/basic-32) |
| 33 | [Subagents 与多 Agent 协作：先明确职责，再拆分团队](https://www.yuque.com/u28128023/erro2f/basic-33) |
