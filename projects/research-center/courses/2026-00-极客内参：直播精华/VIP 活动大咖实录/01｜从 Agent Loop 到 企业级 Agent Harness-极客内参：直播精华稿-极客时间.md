<video src="https://media001.geekbang.org/305ba31c8f4171f181d24531959c0402/076c56f3dddd4a1cbf1f6cc9ff92028a-17b1a0654bb8e8147589f0228cc360b9-sd.m3u8" controls="">Sorry, your browser doesn't support embedded videos.</video>

## 企业为什么需要 Harness：从"能跑"到"可控地做"

大家好我是姜宁，我带着我一贯的"老开源人"风格——先抛一个问题给现场做调研。"我们现在有用 harness 的吗？不管什么 agent，大家都在用什么样的？Codex、Claude Code、Workbuddy……还是什么。" 现场一片笑声。

顺着调研话题说下去：其实这些 Agent 都差不多，背靠的都是大语言模型。但怎么让大语言模型真正完成工作，里面挑战很大。去年底，模型的能力跨过了一个关键门槛——它能跑长程任务。 所谓长程任务，不是一来一回的简单问答，而是你给它一个目标，它能自己跑下去。Deep Research、Code Agent、数据分析……都属这一类。

但模型能跑长程任务，本质上是在做一个 Loop：给它一个目标，让它做各种各样的尝试，Claude Code、Codex 都这样。这个 Loop 跑起来不算难，但真正能产出我们期望的东西，远不止一个 Loop 那么简单。

举一个最直接的例子：你用 Claude Code 或 Codex 生成一段代码，怎么保证它没问题？现场有人答"让 AI 自己再审核一遍"。我立刻反问："你凭什么相信它的审核？"

"我感觉大家都好像都太放任了，你那江山在哪呢？如果它跑到很远的地方，悄悄给你消耗了很多 token，你可能都不知道。" 现场一片哄笑。然后我指出了关键问题所在："约束才是最主要的。 你得先跟他聊清楚技术方案、数据模型、架构，让他定好目标，然后再去验他的活。光靠 AI 自己审，是审不住的——你必须用测试和验收条件把它卡住。"

这就是 DeerFlow 走过的弯路。项目放到 GitHub 上了 GitHub Trending 之后，一堆人提 PR，认识的不认识的都有，我都不知道对方水平怎么样，怎么敢收？"你可以把他们提的 PR 当成是各大模型厂商生成出来的代码，我可以用 Codex 去 review，但也要消耗我的 token。最核心的是测试——Greenfield 从零开始、Brownfield 在已有代码上做，都得靠测试来验证。 如果最初 100 行、200 行、几千行都还 OK，但要上万行的时候，就是噩梦。如果你对代码也不了解，那就完全被它牵着鼻子走了。"

所以模型能力虽然上来了，让 Agent 跑起来比较简单，但要让它真正能产出期望的成果，会遇到各种工程问题。

![](https://static001.geekbang.org/infoq/39/390158a6d516457713f0e1c6844aa239.png)

第一个是状态恢复。 跑了一半坏了，怎么办？DeerFlow 里有 checkpoint 机制，LangChain 也有类似的东西，但和真正的工程级 trace point 还有段距离。

第二个是权限控制。 到了企业级，哪些系统能用？MCP 涉及认证，登录用户和调用 MCP 的到底有什么区别？

第三个是资源治理，也就是 token。 前几个月，五六月份的时候，各大厂还在鼓励大家烧 token，但后面烧不动了。DeerFlow 自己也在烧自己的 token，我说"很心疼的"。

第四个是追踪审计。 每次升级都有人反馈，"我以前跑得好好的 Scale，怎么一下原来十几分钟就跑完了，现在半个小时还跑不完？token 都消耗在哪了？" 如果不对流程清楚，根本答不上来。Hugging Face 之前被黑客攻击，后来发现是 OpenAI 干的事——Claude Code 也存在类似问题，agent 太执着于完成任务，没有审计的话根本不知道发生了什么。

第五个是部署运维。 包括 Dockerfile、Compose、Helm，覆盖开发与生产模式。

第六个是核心判断。 这些工程问题都发生在 Loop 之外。

把这些问题放在一起看，Loop 负责"想与做"，但要让它长期、可靠地运行，并对企业负责，就需要 Harness。 我拿出一张三栏图把 Harness 的职责拆开：Runtime 负责 Gateway 与 Run 生命周期，Governance 负责上下文、工具与沙箱，Evolution 负责 Memory、Skills 与可观测性。

![](https://static001.geekbang.org/infoq/94/94c58ca353ebaf7e99858ea274602ebd.png)

## DeerFlow 2.0：源码的四个发力点

DeerFlow 2.0 是一次从零重写，2.0 与 1.x 不共享代码。 1.0 主要做 Deep Research，2.0 则基于 Harness 理念做成了 Super Agent。春节那阵子正好 OpenClaw 很火，社区也受了不少启发。开源仓库在 github.com/bytedance/deer-flow。

![](https://static001.geekbang.org/infoq/28/281f3d36e664889aaf5c24c7431e9627.png)

从 2 月发布到现在差不多四个月，我把 DeerFlow 2.0 源码里最核心的四个模块过了一遍。在我看来，看 DeerFlow 这种"总装现场"的项目，能把一整套 Agent 工程串起来：Runtime（Tool Calling、Agent Loop、状态与恢复）、Context（中间件、压缩、持久化与记忆）、Governance（权限、沙箱、预算与审计）、Delivery（Skill、MCP、Docker、Helm 与运维）。

### 入口与上下文：Gateway 与中间件

先说 Gateway。DeerFlow 基于 LangChain 的 LangGraph 和 Deep Agent 搭起来的，我拿 Codex 举个例子帮大家理解："如果你用 Codex，想想它怎么跑起来的？本地安装一个进程，下一个指令，这个进程就跟大语言模型交互。" 但如果用网页版的 ChatGPT 或 Codex，那就是 client-server 结构——前端是 web，后端跑的是和本地一样的 agent loop 进程。如果要支持多用户，就得有服务器，服务器负责和客户端的交互。"这个服务器就是 Gateway。"

为什么 DeerFlow 要自己写 Gateway？因为 LangGraph 的运行时只允许本地单实例跑。我们当时为了快速实现没注意这事，等真要上生产才发现，不得不改造 Gateway。另外还有个场景：飞书龙虾 IM 也能跟后面的 Agent 交互，channel 这个概念就定义在这里，可以外接更多一来一回的问答交互。这些都封装在 Gateway 里面。

具体看 Gateway 的内部，它把一次请求变成可恢复的 Run，分三步：接入——请求进入 Gateway，绑定用户和会话，加载运行配置；运行——记录 running、interrupted、completed 等状态，持续保存事件；沉淀——上下文、事件与结果可查询、可恢复、也可追踪审计。我特别强调："Gateway 把一次调用，变成可恢复、可追踪的 Run。"

![](https://static001.geekbang.org/infoq/5e/5eb75c07be59d3a41482736596cc7000.png)

接着说上下文中间件。我用 DeepSeek 举个例子：你想让 DeepSeek 给你出详细一点的内容，得来回来去地聊。这些聊的信息要存起来，但每次交互一来一回，过程中如果你想"玩点花"——不是简单的一问一答，而是让它在问的过程中去查数据库、查其他东西——在 DeepSeek 的 APP 或网页上都没办法，但在 DeerFlow 上可以做。

"因为我们有中间件的概念。来去的消息我们都能感知到，对这些消息可以做各种各样的处理——上传文件交给大模型、返回的数据额外处理——都可以。" 这个中间件给了企业二开一个很重要的窗口：在 context 这里接入业务逻辑。

具体看中间件在模型调用前后做了哪些事：调用前装配——注入任务状态、Skill、记忆与检索结果；调用后裁决——规范工具结果、压缩超限内容；企业扩展上插拔——加入权限、脱敏、预算与业务规则；核心价值是无侵入——扩展业务逻辑而不改核心 Loop。

![](https://static001.geekbang.org/infoq/1f/1fb01d1ecfe021ca3af4f85c79358de1.png)

"上下文中间件，把业务规则接入 Agent Loop 的关键位置。"

### 工具与沙箱：让能力安全运行

"MCP 大家应该听得比较多，我们可以接各种各样的系统。但实际上现在也有 CLI，比如你有台机器、有 share、有 bash，把 CLI 装上就能做各种事。" 但前提是你要有台机器。如果要给企业内部提供一个 Agent 服务，需要的不是本地的机器，而是云端的沙箱机器。

我指出了关键区别："工具能调用是能力，工具能安全运行，才是工程。"

![](https://static001.geekbang.org/infoq/d2/d230af997232a7a1f915fa3c3f209f08.png)

工具治理这一侧，包括注册与 Schema 校验、延迟加载与 MCP 接入、Token 预算、结果外置。沙箱与文件系统这一侧，包括隔离 Shell 与文件、用户数据隔离、持久工作区、危险边界。DeerFlow 2.0 已经支持不少沙箱，2.1 里社区又贡献了四个新的 sandbox 提供商。

### Memory：让 Agent 从"完成"走向"积累"

我问了一个有意思的问题："大家有带过实习生吗？有秘书吗？" 现场又是一阵笑。然后我点出本质："如果你秘书要懂你的话，你们要磨合很长时间。教实习生要教很多很多东西。" 大模型也一样，它不了解你——你是谁、你的背景、你要写 PPT、听众是什么样的、你说话的口吻是什么样的——这些你都得告诉它。一旦你跟它多弄过几次，下次你说"我们要到极客时间做 VIP 交流"，它就把上下文都补足了。

"但这些上下文是跟你密切相关的，你要让它懂你，就要喂它这些信息。"

![](https://static001.geekbang.org/infoq/89/8987e42b17b7cce9e358d99fe7096030.png)

我强烈建议大家"自己有一个中性的记忆库"。原因很现实："之前 Claude Code 不是封了一些事情吗？一旦封了，你那些东西就导不出来了，那多可惜，你这得多少年的心血？" 外接知识库还有个好处：任何模型都能让它及时了解你这块的内容。如果做 OPC（One Person Company），"这是你公司最重要的资产"。

Memory 在 DeerFlow 里分三层：任务内（Working Memory，保存当前目标、步骤与结果以及未解决问题）、跨会话（Long-term Memory，沉淀项目约定、用户偏好与历史经验）、持续演进（Agent Evolution，通过可审查的记忆更新沉淀方法与策略）。 "Memory 把单次完成变成可复用的经验——越用越好用，越用越懂你。"

## 2.1.0 演进方向：让长任务能续跑，把能力纳入治理

从本地体验到企业部署，DeerFlow 的路径分三步：本地体验（make setup、make doctor，配置模型、搜索与沙箱）、容器化（Dockerfile、Compose）、集群运维（账号体系、维护脚本、Helm）。 "部署路径：本地体验 → 容器化 → 集群运维。" 我还现场演示了 5 分钟跑通深度研究，从启动环境、输入任务、观察执行、查看报告与产物，让现场看到了完整的部署—执行—产出链路。

![](https://static001.geekbang.org/infoq/fb/fb679b54fa75c50c53db5c25f1e50cd7.png) ![](https://static001.geekbang.org/infoq/f4/f4f25197dfbd0a2b67f594df6fe2565d.png)

2.0 的目标是提供一个可以执行的基座，2.1 则重点解决长任务与治理。 两个礼拜前 DeerFlow 的 GitHub Star 又增加了 1500 多个，仓库的 Commits 总量 2,666——每个 PR 合的时候只有一个 commit（squash merge），可以想象迭代速度。

![](https://static001.geekbang.org/infoq/01/0107fd56fff36381aa69a92950f676ec.png)

社区规划的主线分四段：2.0 基座（Sub-agents、Sandbox、Skills、Memory）→ 长任务运行时（Goal continuation、Durable context、Tool progress）→ 能力治理（Token/delegation caps、SkillScan、OIDC、Guardrails）→ 2.1.0 方向（Memory consolidation、Staleness、Pluggable backend）。"演进主线：执行闭环 → 长程自治 → 组织治理 → 受控进化。"

![](https://static001.geekbang.org/infoq/08/083e0545146488d59d416a98647d8c83.png)

### 长任务机制

2.1.0 在长任务侧引入了五个新机制。

Goal Continuations——跨多个 Agent turn 继续同一目标，记录并限制 continuation\_count。Durable Context——摘要压缩后仍保留 system、memory 与 tool state 等关键运行上下文。Delegation Ledger——避免对子任务重复委派，总委派上限约束 fan-out。Token Budget——Lead Agent 与 Sub-agents 共享每次 run 的累加预算。Tool Progress——结构化 tool-result metadata，状态机跟踪多步工具流程。

![](https://static001.geekbang.org/infoq/3f/3f51125a565441c0cb02ddabe7212666.png)

我特意点了一下研究含义："长程 Agent 评测要从'单轮回答'转向'目标级完成'。"

### 治理体系

治理侧的工作分四大块。

Memory——可插拔 manager\_class 与 backend\_config；middleware 与 tool 两种模式；整合、时效审查与纠错事实注入。Skills——SKILL.md 定义运行时包边界；SkillScan 静态分析与按需发现；用户级 Skill 隔离与沙箱挂载。Auth & Guardrails——通用 OIDC、SSO 与 Keycloak；GuardrailRequest 携带认证上下文；安全干预持久化为 run events。Sandbox & Ops——E2B 与 BoxLite micro-VM provider；BoxLite warm pool；ClusterIP 默认；Trace、成本与分布式事件流。

![](https://static001.geekbang.org/infoq/5a/5af51cce1ac79c96b5a8ace165c2f11e.png)

"自主性越强，越需要把能力、身份、资源与风险统一建模。"

## 真实落地：保险金融企业从验证到试生产

到 2.0 发布前，我还在社区里说"千万别上生产、千万别上生产"。结果还是有金融企业上了，问为什么，"功能太好了，演示完大家都流口水，赶紧就上了"。实际上他们在上的过程中做了大量工作：第一步是开发业务 Skill，把领域方法封装起来，加载核心流程、规则与输出标准；第二步是内部系统做 MCP 化改造，让模型可以直接调，把调用方法的接口都暴露出来；第三步才是试生产。 "企业落地的关键，是把 Harness 接入真实业务边界。"

![](https://static001.geekbang.org/infoq/e7/e778f2b76ee18ae0bb03d63cec0ff00d.png)

讲到社区故事的时候，我提了一个让我特别自豪的例子：今年 3 月有位南洋理工读研的同学（一位女生）想进字节新加坡实习，误打误撞进了 DeerFlow 项目，做了不少贡献，有次直播还拉她一起来。她做的一件很重要的事是把论文格式抽象成 Skill 集成进来——后来她拿到了 TikTok 的实习机会。

我感叹，DeerFlow 社区现在活跃的 20 多个核心贡献者，有一半都是刚毕业的学生或者还在上大学的。"现在 Agent 的能力很强，不管是写代码还是其他能力，对他们来说只要早点用、已经会用，和 5 年、10 年工作经验的人差别已经不大了。唯一缺乏的可能就是一些具体的实践。这些实践怎么来？开项目其实是最好的窗口。"

"我之前也面过很多人，我会问很细节的问题——简单举个例子，Java 里你怎么去改 Thread 名字？如果你做过就轻松答出来，没做过的话背八股都不一定能背到那块。所以大家如果想丰富自己开发的经历，开源项目是非常好的窗口。" 我自己就是从红帽到华为、到字节开源办、再到 Apache 基金会 20 年，我坦白讲"我之前也没做过 Agent，一年前真的开始做，现在能出来给大家讲，很大程度上就是靠开源项目不断给我刷经验值"。

最后我留了一句话："读懂、跑通、贡献——真实开源贡献，可以成为能力证明。"

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

下载

02-姜宁-DeerFlow\_2.0\_Agent\_Harness.pdf

1.43MB

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

企业为什么需要 Harness：从"能跑"到"可控地做"

DeerFlow 2.0：源码的四个发力点

入口与上下文：Gateway 与中间件

工具与沙箱：让能力安全运行

Memory：让 Agent 从"完成"走向"积累"

2.1.0 演进方向：让长任务能续跑，把能力纳入治理

长任务机制

治理体系

真实落地：保险金融企业从验证到试生产