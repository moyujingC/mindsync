# 小哲电商 Agent 生死局课程目录

这里是正式发布版故事课正文。每一课对应 `../../code/agent-course-versions/` 下的一个 Agent 代码快照；调试后台、业务后端和完整 Agent 项目放在 `../../code/`。
如果你是第一次接触 Agent，先按 01 到 46 课连续阅读正文，不急着把每一节代码都跑通。每课先抓三件事：小哲电商出了什么事故、这一课补了哪种 Agent 能力、调试后台里应该看到什么证据。需要动手时，再看对应代码目录的 `README.md` 和统一运行手册。

## 课程主线
这门课按十幕推进。你不是从一堆 Agent 名词开始，而是从小哲电商客服事故开始，一步步把客服 Agent 做到可控、可查、可测、可交付。

|   幕 | 课次    | 主线                                   | Agent 逐步具备的能力                                                             |
| --: | ----- | ------------------------------------ | ------------------------------------------------------------------------- |
| 第一幕 | 01-04 | 先把聊天入口接进业务，再暴露“会说话不等于懂业务”。           | Message、`/chat`、LLM 客服边界、结构化意图。                                           |
| 第二幕 | 05-07 | 用 Prompt 先救火，再看见规则堆叠和 token 成本压力。    | System Prompt、Prompt Template、Prompt Registry、Token 观察。                   |
| 第三幕 | 08-12 | 从全量塞规则转向基础 RAG，让回答开始有依据。             | RAG 思路、文档切片、Embedding、向量检索、Citations、低置信兜底。                               |
| 第四幕 | 13-16 | 让检索从“能召回”升级到“召得准、可更新”。               | 查询改写、Reranker、Hybrid RAG、索引更新、RAG 缓存。                                     |
| 第五幕 | 17-22 | 接入实时业务事实，让订单、物流、库存、价格不再靠模型猜。         | 业务事实接口、Tool Calling、澄清机制、Observation、错误降级、Tool + RAG。                     |
| 第六幕 | 23-25 | 工具变多后，把调用治理、工具复用和任务路由收拢起来。           | Hooks、MCP、TaskPlanner、RoutePlan。                                          |
| 第七幕 | 26-31 | 把退款退货这类高风险动作锁进固定流程，并停在人工审批边界。        | 高风险动作边界、LangGraph Workflow、退款/退货流程、HITL、Resume、Checkpoint、幂等。             |
| 第八幕 | 32-36 | 管住历史消息、运行时事实、上下文拼装和脏指令。              | Session Memory、Runtime Context、Context Builder、上下文压缩、Prompt Injection 防护。 |
| 第九幕 | 37-40 | 让系统能解释、能回归、能归因，也能看见成本路径。             | Trace、Evaluation、失败归因、反馈闭环、成本治理。                                          |
| 第十幕 | 41-46 | 用同一版综合 Agent 做大促前总演习，再收束到上线边界和增强路线图。 | 全链路检查、场景验证、生产交付边界、路线图和项目表达。                                               |

## 代码运行形态

课程正文按 01 到 46 课连续阅读，代码快照按下面的形态使用：
- 第 01 课是本地脚本，重点观察最小 messages 输入输出。
- 第 02-41 课有独立 Agent 后端，从对应 `../code/agent-course-versions/lesson-xx-*/backend/` 启动。
- 第 24 课既有独立快照，也可以在主项目 `../code/agent-backend/` 里配置 `AGENT_TOOL_SOURCE=mcp`，观察生产形态的 MCP 接入链路。
- 第 42-45 课复用第 41 课综合演练后端，再用各自目录里的场景、清单或验收材料观察结果。
- 第 46 课不新增后端，阅读路线图和项目收束材料。
具体环境准备、模型配置和调试后台连接方式，统一看 `../../docs/运行手册.md`。

## 课程列表

| 课次 | 课程 |
| ---: | --- |
| 01 | [第 01 课：客服全跑了，老板让你下楼接电话｜Message 输入输出](https://www.yuque.com/u28128023/erro2f/story-01) |
| 02 | [第 02 课：你搭好 ](https://www.yuque.com/u28128023/erro2f/story-02)`/chat`[ 服务，让聊天框先能接进来｜Agent 对话接口](https://www.yuque.com/u28128023/erro2f/story-02) |
| 03 | [第 03 课：第一版 AI 很会聊天，却一句业务都答不准｜LLM 客服边界](https://www.yuque.com/u28128023/erro2f/story-03) |
| 04 | [第 04 课：AI 说“我帮你处理”，售后却没收到退货请求｜结构化输出与意图识别](https://www.yuque.com/u28128023/erro2f/story-04) |
| 05 | [第 05 课：AI 乱承诺赔钱了，你把规则全塞进 Prompt｜Prompt 边界与长上下文冲突](https://www.yuque.com/u28128023/erro2f/story-05) |
| 06 | [第 06 课：Prompt 越写越像一堵墙，改一处就怕塌一片｜Prompt 模板与注册表](https://www.yuque.com/u28128023/erro2f/story-06) |
| 07 | [第 07 课：月底账单来了：先看见每轮都烧了多少 token｜Token 观察](https://www.yuque.com/u28128023/erro2f/story-07) |
| 08 | [第 08 课：你发现问题不是模型笨，是你喂得太粗暴｜RAG 思路](https://www.yuque.com/u28128023/erro2f/story-08) |
| 09 | [第 09 课：售后规则要先切开，再给每段贴标签｜文档切片与 Metadata](https://www.yuque.com/u28128023/erro2f/story-09) |
| 10 | [第 10 课：第一次向量检索：用户问什么，就找最像的规则｜Embedding 与向量检索](https://www.yuque.com/u28128023/erro2f/story-10) |
| 11 | [第 11 课：老板终于看到回答来源｜RAG Citations](https://www.yuque.com/u28128023/erro2f/story-11) |
| 12 | [第 12 课：命中了不代表命对了，找不到依据也不能硬编｜RAG 质量评测与低置信兜底](https://www.yuque.com/u28128023/erro2f/story-12) |
| 13 | [第 13 课：用户问“那个耳机活动”，向量检索找错了规则｜查询改写](https://www.yuque.com/u28128023/erro2f/story-13) |
| 14 | [第 14 课：相似规则太多，top-k 第一名不一定真对｜Reranker 重排](https://www.yuque.com/u28128023/erro2f/story-14) |
| 15 | [第 15 课：只靠向量不行，关键词和规则路由也要上｜Hybrid RAG](https://www.yuque.com/u28128023/erro2f/story-15) |
| 16 | [第 16 课：大促前规则暴涨，知识库检索也开始扛不住｜索引更新与 RAG 缓存](https://www.yuque.com/u28128023/erro2f/story-16) |
| 17 | [第 17 课：用户问订单物流，AI 又开始编快递状态｜实时事实与业务接口](https://www.yuque.com/u28128023/erro2f/story-17) |
| 18 | [第 18 课：给 Agent 一套工具箱，但参数和身份不能乱来｜Tool Calling](https://www.yuque.com/u28128023/erro2f/story-18) |
| 19 | [第 19 课：用户没说订单号，AI 别装懂｜澄清机制](https://www.yuque.com/u28128023/erro2f/story-19) |
| 20 | [第 20 课：工具结果不能原样塞回模型，不然上下文又爆了｜ToolResult 与 Observation](https://www.yuque.com/u28128023/erro2f/story-20) |
| 21 | [第 21 课：模型服务抽风、工具超时，客服不能一起瘫｜错误分类与降级](https://www.yuque.com/u28128023/erro2f/story-21) |
| 22 | [第 22 课：商品推荐终于靠谱了：库存、价格、知识一起看｜Tool + RAG 联合回答](https://www.yuque.com/u28128023/erro2f/story-22) |
| 23 | [第 23 课：工具越来越多，重复治理代码开始漏风｜Hooks 治理](https://www.yuque.com/u28128023/erro2f/story-23) |
| 24 | [第 24 课：工具不该只服务你这一版 Agent｜MCP 与 Tool Use](https://www.yuque.com/u28128023/erro2f/story-24) |
| 25 | [第 25 课：工具、知识库、流程都有了，用户一句话到底走哪条路｜TaskPlanner 与 RoutePlan](https://www.yuque.com/u28128023/erro2f/story-25) |
| 26 | [第 26 课：用户一句“直接给我退”，退款不是一句话｜高风险动作边界](https://www.yuque.com/u28128023/erro2f/story-26) |
| 27 | [第 27 课：自由 Agent 不适合跑售后流程，你把流程画死｜LangGraph 工作流](https://www.yuque.com/u28128023/erro2f/story-27) |
| 28 | [第 28 课：未发货退款：能不能退，先查订单再查规则｜未发货退款流程](https://www.yuque.com/u28128023/erro2f/story-28) |
| 29 | [第 29 课：已签收退货：要看时间、商品、原因、政策｜签收后退货流程](https://www.yuque.com/u28128023/erro2f/story-29) |
| 30 | [第 30 课：AI 只能提交申请，不能自己批准｜HITL 人工审批](https://www.yuque.com/u28128023/erro2f/story-30) |
| 31 | [第 31 课：审批恢复不能乱接，更不能重复提交｜Resume、Checkpoint 与幂等](https://www.yuque.com/u28128023/erro2f/story-31) |
| 32 | [第 32 课：用户问“刚才那个订单”，但不是每句话都值得记｜Session Memory](https://www.yuque.com/u28128023/erro2f/story-32) |
| 33 | [第 33 课：用户自称是 VIP，不代表他真是 VIP｜Runtime Context](https://www.yuque.com/u28128023/erro2f/story-33) |
| 34 | [第 34 课：历史消息、工具结果、RAG 片段全挤在一起，模型开始串台｜Context Builder](https://www.yuque.com/u28128023/erro2f/story-34) |
| 35 | [第 35 课：上下文太长，模型开始把中间内容忘掉｜上下文压缩与 Sliding Window](https://www.yuque.com/u28128023/erro2f/story-35) |
| 36 | [第 36 课：用户、工具和知识库都可能把脏指令带进来｜Prompt Injection 防护](https://www.yuque.com/u28128023/erro2f/story-36) |
| 37 | [第 37 课：老板问：它为什么这么回答？你不能只说“大模型觉得”｜Trace 可观测](https://www.yuque.com/u28128023/erro2f/story-37) |
| 38 | [第 38 课：改 Prompt 后，物流好了，退款炸了｜Evaluation 回归评测](https://www.yuque.com/u28128023/erro2f/story-38) |
| 39 | [第 39 课：失败了先别乱改，用户差评也不是白挨骂｜失败归因与反馈闭环](https://www.yuque.com/u28128023/erro2f/story-39) |
| 40 | [第 40 课：老板又看账单，你开始做成本分层｜成本治理](https://www.yuque.com/u28128023/erro2f/story-40) |
| 41 | [第 41 课：大促前夜，小哲电商客服 Agent 总演习｜全链路检查与项目总览](https://www.yuque.com/u28128023/erro2f/story-41) |
| 42 | [第 42 课：大促第一波：物流和活动规则必须走对路｜Tool 与 RAG 场景验证](https://www.yuque.com/u28128023/erro2f/story-42) |
| 43 | [第 43 课：大促第二波：用户要退款，AI 必须停下来等人批｜退款工作流与 HITL 验证](https://www.yuque.com/u28128023/erro2f/story-43) |
| 44 | [第 44 课：大促第三波：服务抽风、越权追问和知识没命中一起打过来｜综合降级与安全验证](https://www.yuque.com/u28128023/erro2f/story-44) |
| 45 | [第 45 课：老板问能不能上线，你先把边界写清楚｜生产交付与上线边界](https://www.yuque.com/u28128023/erro2f/story-45) |
| 46 | [第 46 课：老板问还能不能更强，你把路线图和项目表达一起讲清楚｜生产增强路线图与项目收束](https://www.yuque.com/u28128023/erro2f/story-46) |

## 代码对应关系 + 每课快照：`../../code/agent-course-versions/` + 共享调试后台：`../../code/frontend/` + 完整 Agent 后端：`../../code/agent-backend/` + 小哲电商业务后端：`../../code/ecommerce-backend/`
