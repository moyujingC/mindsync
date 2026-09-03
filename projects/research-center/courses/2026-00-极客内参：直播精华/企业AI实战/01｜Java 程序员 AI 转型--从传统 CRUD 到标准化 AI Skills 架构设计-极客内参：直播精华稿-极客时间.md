<video src="https://media001.geekbang.org/7006f5263d5671f1bfbb5017f1e90402/b66ae64db88745b6b51d3876198d03bc-ce2ffed90d0847c97d06e346068d8479-sd.m3u8" controls="">Sorry, your browser doesn't support embedded videos.</video>

直播时间：2026 年 4 月 20 日

前言：从 CRUD 到 AI Skills 的进化

Hello 大家好我是 Andy。今天我们要深入探讨一个非常迫切的话题：Java 程序员在 AI 时代该如何完成转型。

现在的技术背景下，传统的 CRUD（增删改查）逻辑正在失去其核心竞争力。我们要聊的，是从传统的逻辑编写，向标准化的 AI Skills（AI 技能） 架构设计进化的过程。通过今天的分享，我希望能帮助大家对未来的学习路径和职业方向产生全新的认识。

本次课程主要分为四个核心板块：

困局与机遇：解析大模型时代下 Java 程序员的真实处境。

趋势与选型：深度对比 Spring AI、LangChain4j 等主流 AI 应用框架。

实战拆解：展示如何将“写死”的 Java 逻辑重构成可被 AI 调用的“封装技能”。

赋能路径：规划未来的职业成长地图。

第一部分：大模型时代下的 Java 程序员“AI 困局”与机遇

1.1 现状：被抹平的经验优势

大家可以观察到，现在的招聘市场发生了巨大变化。以前线下有很多专门主打 Java 培训的机构，Java 程序员的缺口极大。但现在，一方面 AI 已经具备了极强的辅助编码能力，另一方面人工智能的兴起最直接带动的是 Python 的繁荣。

我从 2018 年开始教 AI 相关课程。坦白说，在 2015、2016 年左右，Python 甚至很难找工作，但 2017 年之后，它在各大语言排行榜上迅速蹿升。虽然 Java 在企业级应用、服务器后端领域依然根基深厚，但当前的局势确实给 Java 开发者带来了巨大的“困局”。

核心困局体现在以下几个方面：

传统 CRUD 价值萎缩：以前需要多年经验才能完成的接口封装、模板化后台开发，现在通过 Cursor、通义灵码、Kimi 等 AI 工具，甚至可以秒级生成。低复杂度的编码工作正在被快速标准化。

经验门槛被抹平：如果你只有写传统 Spring Boot、MyBatis 的能力，AI 生成的代码可能已经能达到 5-6 年开发者的水平。这意味着，刚入行的人利用 AI 就能快速抹平与资深开发者在基础编码上的经验差距，这对老牌程序员并不友好。

话语权错位：目前的大模型项目往往由算法、数据工程师和产品经理主导，Java 工程师很容易沦为“做接口的工具人”，对 RAG、Agent、Function Calling 等 AI 工程体系缺乏理解。

全栈化冲击：现在很多大厂，比如某度，正在推行“前后端结对”的人才计划。前端学后端，后端学前端，最后大家都变成了全栈，再加上 AI 的辅助，一个人甚至能干掉以前一个团队的活。我曾接触过一个甲方，原本 70 人的开发团队，裁员后剩 4 个人，配合 AI 竟然把以前 70 人的活儿都干完了。

![](https://static001.geekbang.org/resource/image/d1/b2/d1dcab25fba056930f2e729617d2f1b2.png?wh=2218x1246)

1.2 机遇：Java 在企业级落地中的天然优势

虽然局势严峻，但并不意味着 Java 程序员没有机会。相反，Java 在 AI 的“后半场”——企业级工程化落地中，拥有 Python 无法比拟的天然优势。

为什么这是 Java 程序员的机会？

系统集成能力：企业需要的不是一个单点的模型 Demo，而是能接进 ERP、CRM、权限、数据等复杂业务系统的完整方案。Java 长期深耕企业信息化，这块经验极强。

RAG 系统的构建：虽然 Python 做实验快，但真正的 RAG（检索增强生成）系统涉及知识库构建、文档解析、向量化检索、权限隔离、异步处理等逻辑，这本质上是“AI + 后端架构”的融合。

Agent 平台的稳定性：智能体编排、任务调度、状态管理需要极其成熟的工程能力，而 Java 擅长的正是稳定性、可维护性和高并发处理。

安全与合规：企业担心数据泄露。Java 程序员对企业级安全体系、Token 监控、日志审计等轻车熟路，这在 AI 落地中至关重要。

所以，我们不需要人人去转行学 Python 算法，而是要通过补充 AI 知识，升级为 “AI 工程化开发” 角色。

![](https://static001.geekbang.org/resource/image/da/c5/da21a1acc1275ea184dc03df029232c5.png?wh=2222x1240)

第二部分：Java + AI 的最新趋势与技术选型

2.1 Spring AI：Spring 生态的无缝衔接

如果你是一个习惯了 Spring Boot 开发的程序员，那么 Spring AI 是你的首选。它的核心目标是让 Java 开发者以“Spring 的方式”来构建 AI 应用。

它通过统一的 API 抽象，将模型调用、向量库、RAG、Function Calling 等能力标准化。无论你底层是调 Open AI、通义千问还是 Llama，代码风格都是熟悉的依赖注入和注解配置。 Embeddings Model API:: Spring AI Reference

![](https://static001.geekbang.org/resource/image/11/dd/1107d610facefff0f1f8e8024654b9dd.png?wh=2214x1240)

2.2 LangChain4j：Java 社区的 AI 编排利器

很多同学在招聘需求上看到了“熟悉 LangChain”，在 Java 领域，对应的就是 LangChain4j。

它是一个独立的开源库，不是 Spring 官方项目。它的迭代非常快，几乎复刻了 Python 版 LangChain 的强大生态。它提供了非常丰富的工具箱，涵盖了提示词模板管理、聊天记忆、RAG 管道、Agent 编排等。如果你想构建复杂的 RAG 系统或者自定义 Agent，LangChain4j 提供的底层灵活性会更高。 LangChain4J 官网链接

![](https://static001.geekbang.org/resource/image/24/5a/24de81777aayy9edac8ec080f4f1a35a.png?wh=2216x1240)

2.3 Spring AI Alibaba：国产大模型最佳实践

这里要重点提一下 Spring AI Alibaba。这是阿里基于 Spring AI 之上扩充的一层，更偏向 Agent（智能体）、工作流和多智能体编排。

它深度集成了阿里云的通义百炼（DashScope）生态。

Spring AI 偏向底层的原子能力（调个接口、存个向量）。

Spring AI Alibaba 则偏向 Agent 框架。它的 Graph 设计灵感来自 LangGraph，非常适合在 Java 里做复杂的流程控制。

比如在阿里的“AI 答疑专家”实践中，他们通过百炼数据中心进行向量化，利用 Spring AI Alibaba 对接通义 2.5 和 RAG，最后通过云原生网关 Higress 发布到钉钉或官网。这一整套企业级链路，就是 Java 程序员的舞台。

Spring AI Alibaba

![](https://static001.geekbang.org/resource/image/23/70/23163176f216cccb6edbddb170be1270.png?wh=2220x1246)

2.4 选型逻辑对比

大家在实际项目中该如何选择？

Spring AI：适合快速原型设计。如果你只需要标准化的问答，对 Spring 依赖深，选它。

LangChain4j：适合复杂 RAG 和多源异构知识库。如果你对检索、重排（Rerank）、文档切分有极高精度要求，选它。

Spring AI Alibaba：适合多步 Agent 与流程自动化。尤其是如果你打算使用阿里云的生态、需要高阶的 Graph 流程编排，它是最佳选择。

![](https://static001.geekbang.org/resource/image/d2/36/d2b88e7b8252f1c6b59d2f10ee0d0b36.png?wh=3656x1625)

第三部分：实战拆解——项目从“写死逻辑”到“封装技能”

我们来看一个具体的转型案例：订单处理。

3.1 传统写法：全是写死的逻辑

在传统的 Java 代码中，我们处理一个订单流程往往是 if-else 的堆砌：先校验库存，再校验信用，计算价格，应用折扣，保存订单。 这种写法最大的问题是：

逻辑写死：想加个风控校验，必须改原方法。

无法自动化：AI 根本不知道你这些方法在干嘛，也无法根据不同场景自动编排。

![](https://static001.geekbang.org/resource/image/c4/2f/c42c318711d2a4c594a44489d5d8302f.png?wh=2132x1140)

3.2 进化：封装成 Skill（AI 技能）

在 AI 时代，我们要把这些逻辑解耦成独立的 Skill。

定义 Skill 接口：声明输入输出 Schema（JSON 格式）。

拆分逻辑：每个 Skill（如 StockCheckSkill）只负责一个功能。

技能编排器（Pipeline）：通过编排器组合这些 Skill。

为什么要这么做？ 这是为了 Function Calling。当你把逻辑封装成 Skill 并声明了它的作用，AI Agent 就能“听懂”这个函数的功能。比如用户说：“帮我算一下订单风险”，AI 就会自动调用你挂载的 RiskCheckSkill。

这就把原本的硬编码变成了“AI 可感知的技能集”。

![](https://static001.geekbang.org/resource/image/b4/0f/b4ea573feebae44b8aa41a8289316c0f.png?wh=2136x1206)

第四部分：AI 时代的 Java 程序员职业赋能路径

最后，我们来看看职业路径该怎么走。

4.1 核心能力维度的变化

以前，手写业务代码占 100%；AI 时代，AI 可能会完成 60-90% 的基础代码。

代码能力：从“手写者”转向“审查者”。

系统设计能力：这会成为你的核心护城河。AI 很难独立设计出一套稳定、可扩展的分布式系统。

AI 协作能力：必须学会 Prompt 工程、RAG 原理和 Agent 编排。

业务理解能力：AI 越强，能准确定义需求的人就越贵。

![](https://static001.geekbang.org/resource/image/70/48/70c5b6a15082a5641c798b485bee4148.png?wh=3495x1211)

4.2 典型转型岗位

Java + AI 应用工程师：最主流的方向，负责将 AI 引入现有系统。

智能架构师：负责 AI 平台的搭建、分布式推理优化。

AI 平台工程师 （MLOps）：侧重于模型部署、GPU 调度、性能压测，这块 Java 也有很大空间。

AI 协作型全栈：利用 AI 辅助快速搞定前端和后端，适合追求极致交付效率的人。

![](https://static001.geekbang.org/resource/image/aa/53/aabae955e9a83999d0fc8d9541da8053.png?wh=2134x1232)

结语与互动

虽然 Java 在 AI 初期似乎没有 Python 那么火，但随着 AI 进入企业生产力深水区，Java 程序员凭借深厚的工程底蕴、高并发经验和安全治理意识，正在迎来第二次增长曲线。

如果你想尝试，我强烈建议你先从跑通一个基于 Spring AI Alibaba 的“智能机票助手”或者“合同问答系统” Demo 开始。你会发现，一旦你跨过了“AI 基础知识”这道坎，你多年的 Java 功底将是你最大的杀手锏。

今天的分享就到这里，谢谢大家。

\> 完整课件 /PPT 请戳此领取

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

馨冉

Command + Enter 发表

0/2000字符

提交留言