> 状态：reference
> 版本：0.1.0
> source_of_truth：自动补齐

# 心理疗愈 AI 产品观察室：4 个重点产品 AI 技术架构核验表

> 日期：2026-06-06  
> 范围：Ash / Slingshot AI、Rosebud、Rocky.ai、Eleos Health  
> 用途：为观察室网站产品详情页、技术方法文章、Aimandala 内部反哺提供事实底稿。  
> 方法：本地归档文档 + 公开网页核验 + agent 分工核验。  

## 1. 使用原则

这份表只把公开资料能支撑的内容写为事实。

所有技术信息分为三类：

| 类型       | 含义                                 | 公开使用方式            |
| -------- | ---------------------------------- | ----------------- |
| 已核验事实    | 官网、帮助中心、隐私政策、官方发布、工程博客、论文或可信报道明确披露 | 可以进入产品详情页         |
| 技术推断     | 由功能和行业常见实现推导，公开资料没有确认              | 只能写成“可能需要 / 可能采用” |
| 不应公开写成事实 | 本地旧稿、营销词或行业猜测中出现，但没有核验依据           | 不进入公开结论           |

公开站点建议用这个顺序表达：

```text
证据等级
  -> 已核验事实
  -> 技术架构判断
  -> 可能实现路径
  -> 技术风险
  -> 待核验问题
```

## 2. 总览表

| 产品 | 技术原型 | 证据等级 | 可公开写的技术判断 | 主要禁写点 |
| --- | --- | --- | --- | --- |
| Ash / Slingshot AI | 聊天陪伴型 + 垂直心理模型叙事 | A/B/C 混合 | 官方披露 psychology foundation model、三阶段训练、长期记忆、语音/文字交互、双层安全系统和安全研究 | 不写具体底层模型、RAG、向量库、云厂商、50,000 小时训练数据、临床疗效已证 |
| Rosebud | AI 日记 + 长期记忆 + 个性化反思 | A/B/C 混合 | 官方披露 AI analysis、long-term memory、Learned Preferences、Persona、语音日记、图片/手写输入、Firestore、OpenAI/Anthropic/Groq 处理链路 | 不写 GPT-4/Pinecone/pgvector/端到端加密/HIPAA 认证/完整临床安全体系 |
| Rocky.ai | AI 教练平台 + RAG + 模块化 agent + 白标工作流 | A/B/C 混合 | 官方披露 Knowledge-Driven AI Architecture、RAG、modular AI agents、AMGS、Google Cloud Frankfurt、OpenAI/Gemini/Claude 微服务 | 不写 LangChain/Pinecone/完整自主多智能体系统/SOC2/治疗场景可用 |
| Eleos Health | 临床机构工作流 AI + Polaris AI + EHR 嵌入 + 合规治理 | A/B/C 混合 | 官方披露 Polaris AI、行为健康会话数据、浏览器扩展嵌入 EHR、HIPAA/SOC2/HITRUST/ISO、安全页、RAG/VectorDB 工程博客 | 不写单一 Gemini/Vertex 架构、全站 Google Cloud、完全不存储音频、幻觉已解决 |

## 3. Ash / Slingshot AI

### 3.1 已核验事实

| 事实 | 来源 |
| --- | --- |
| Slingshot AI 从 2024 年 1 月开始建设 foundation model for psychology。 | [Slingshot AI 官网](https://slingshotai.com/) |
| Ash 被官方描述为 first AI designed for therapy / mental health，并已上线 iOS 和 Android。 | [Business Wire 发布稿](https://www.businesswire.com/news/home/20250722566346/en/Slingshot-Launches-Ash-the-First-AI-Designed-for-Therapy)、[Ash 官方发布文](https://www.talktoash.com/posts/introducing-ash) |
| 发布时官方披露 Ash 经历 18 个月开发，有 50,000 beta users，总融资 9300 万美元。 | [Business Wire 发布稿](https://www.businesswire.com/news/home/20250722566346/en/Slingshot-Launches-Ash-the-First-AI-Designed-for-Therapy)、[Ash 官方发布文](https://www.talktoash.com/posts/introducing-ash) |
| Ash 支持文字和语音交互，官方称其会记住用户历史并识别跨对话模式。 | [Ash 官方发布文](https://www.talktoash.com/posts/introducing-ash) |
| 官方披露模型训练路径包含 behavioral health data 预训练、临床团队 fine-tuning、reinforcement learning。 | [Business Wire 发布稿](https://www.businesswire.com/news/home/20250722566346/en/Slingshot-Launches-Ash-the-First-AI-Designed-for-Therapy)、[Ash 官方发布文](https://www.talktoash.com/posts/introducing-ash) |
| 官方称训练数据覆盖 CBT、DBT、ACT、psychodynamic therapy、motivational interviewing 等治疗风格和方法。 | [Business Wire 发布稿](https://www.businesswire.com/news/home/20250722566346/en/Slingshot-Launches-Ash-the-First-AI-Designed-for-Therapy)、[Ash 官方发布文](https://www.talktoash.com/posts/introducing-ash) |
| Ash 可能会 challenge / push back，不被设计成单纯顺从用户的通用助手。 | [Our Approach To Safety](https://www.talktoash.com/posts/our-approach-to-safety) |
| 官方承认 Ash 可能 hallucinate、忘记重要信息或给出不好的建议，也明确说 Ash 不能替代临床医生。 | [Our Approach To Safety](https://www.talktoash.com/posts/our-approach-to-safety) |
| 官方披露 layered / dual-layered safety system，用于自杀风险和非自杀性自伤相关场景。 | [Ash safety paper blog](https://www.talktoash.com/posts/safety-paper)、[arXiv 论文](https://arxiv.org/abs/2601.17003) |
| Slingshot AI 发布安全研究预印本，基于 20,000 条真实对话做生态审计，并比较 Ash 与通用模型在多个高风险测试集上的表现。 | [arXiv 论文](https://arxiv.org/abs/2601.17003)、[Ash safety paper blog](https://www.talktoash.com/posts/safety-paper) |
| 隐私政策披露 Ash 收集文本与语音转文字数据；语音数据不存储；用户选择分享 transcript 后，文本会去除个人信息并用于改进 Ash。 | [Ash Privacy Policy](https://www.talktoash.com/privacy) |
| 官方称对话数据在服务器加密存储，正常运营情况下工程、产品、客服团队不能访问用户对话数据。 | [Ash Privacy Policy](https://www.talktoash.com/privacy) |
| 官方称 Ash 不是 mandated reporter；用户提到自伤时会鼓励访问危机资源，但不会代表用户联系外部人员或机构。 | [Our Approach to Privacy](https://www.talktoash.com/posts/our-approach-to-privacy) |
| EULA 声明 Slingshot 不提供医疗建议、诊断或医疗服务。 | [Ash Terms](https://www.talktoash.com/terms) |

### 3.2 技术架构判断

Ash 更接近“垂直领域模型 + 产品化对话系统”。

可以公开写：

- Ash 的公开技术叙事明显重于普通聊天应用，官方直接使用 psychology foundation model、behavioral health data、clinical fine-tuning、reinforcement learning 等表述。
- 它至少包含三类能力层：模型层、跨会话记忆与模式识别层、安全护栏层。
- Ash 的安全系统公开披露为 layered / dual-layered safety system，并有安全研究预印本支撑，不能简化成提示词安全。
- Ash 的公开资料仍未披露底层模型基座、RAG / 向量库方案、推理服务架构、云厂商和完整评估流水线。

### 3.3 可能实现路径

以下只能写成推断：

```text
文字 / 语音输入
  -> 意图与风险分类
  -> 用户历史记忆召回
  -> 主对话模型生成
  -> 双层安全审查
  -> 文本 / 语音输出
  -> 周期性模式洞察
```

推断点：

- 长期记忆可能由结构化摘要、语义检索、用户状态或画像共同支撑。
- weekly insights / pattern detection 可能由后台异步任务聚合一段时间内的对话。
- reinforcement learning 的信号可能来自用户反馈、会话状态、人工/临床标注或其他 conversation signals。
- 安全层可能优先降低危机漏检，容忍一定误报。

### 3.4 技术风险

- 长期记忆越强，误记、错误模式归因和依赖风险越高。
- 官方产品叙事靠近 therapy，但法律条款声明不提供医疗服务，用户理解边界需要持续观察。
- reinforcement learning 的优化目标未公开，如果过度依赖满意度或互动时长，可能偏离真实心理改善。
- 用户选择分享 transcript 后可用于改进 Ash，心理对话数据即使去标识化，也仍有重识别和撤回困难。
- Ash 不会代表用户联系外部人员，危机场景责任边界可能引发争议。

### 3.5 待核验问题

- 底层模型是从头训练、基于开源模型继续训练，还是混合使用第三方 frontier model？
- behavioral health dataset 的来源、规模、授权方式、匿名化流程和文化覆盖情况是什么？
- reinforcement learning 使用什么反馈信号？
- 长期记忆是否使用向量数据库、摘要记忆、知识图谱或状态机？
- 双层安全系统的两层分别是什么？
- 是否符合 HIPAA、SOC 2、GDPR、UK GDPR 等标准？
- 语音能力使用哪家 ASR / TTS 服务？

### 3.6 不应公开写成事实

- Ash 使用 GPT-4o、Claude、Llama、Mistral 或某个具体底层模型。
- Ash 使用 RAG、向量数据库或知识图谱。
- Ash 使用 OpenAI API、Anthropic API、自建 GPU 集群或某云服务。
- Ash 有 50,000 小时匿名治疗对话数据。本轮只核验到 50,000 beta users 与 behavioral health dataset。
- Ash 危机识别 100% 准确。更准确写法是其公开安全研究中的特定审计结果。
- Ash 已被临床证明有效治疗心理疾病。
- Ash 是医疗器械、数字疗法或合规心理治疗服务。
- Ash 不存储对话。

## 4. Rosebud

### 4.1 已核验事实

| 事实 | 来源 |
| --- | --- |
| Rosebud 是 AI 驱动的 journaling 产品，帮助用户处理情绪、识别模式、获得洞察。 | [Rosebud 官网](https://www.rosebud.app/) |
| AI analysis 会从日记条目中提取 moods、topics、relationships 和 patterns。 | [Rosebud Help: AI Analysis](https://help.rosebud.app/ai-analysis) |
| Rosebud 有 long-term memory，用户写新条目时会记录重要内容并逐渐理解生活上下文。 | [Rosebud Help: Long-term memory](https://help.rosebud.app/ai-analysis/long-term-memory) |
| 官方承认记忆对主题更擅长，对具体日期和时间较弱，并提供 mobile app 的 memory precision experiment。 | [Rosebud Help: Long-term memory](https://help.rosebud.app/ai-analysis/long-term-memory) |
| Rosebud 支持 AI personalization，用户可提供 bio、设置 Personas，并调整 AI 行为方式、使用的 AI model 和 voice settings。 | [Rosebud Help: AI Personalization](https://help.rosebud.app/ai-analysis/ai-personalization) |
| Learned Preferences 会保存用户反馈形成的偏好，用户可管理或关闭。 | [Rosebud Help: Learned Preferences](https://help.rosebud.app/ai-analysis/learned-preferences) |
| 支持 voice journaling、advanced voice transcription 和 hands-free mode。 | [Rosebud Help: Voice journaling](https://help.rosebud.app/tools-for-growth/voice-journaling) |
| 支持向 entry 添加照片，Rosebud 在 dig deeper 时可解释照片；每次最多 5 张，每个 entry 最多 10 张。 | [Rosebud Help: Add photos](https://help.rosebud.app/tools-for-growth/add-photos) |
| 支持扫描并上传手写日记。 | [Rosebud Help: Scan handwritten journal](https://help.rosebud.app/tools-for-growth/scan-handwritten-journal) |
| 隐私政策披露使用 Google Firestore 存储数据，传输中和静态存储中加密，并称与 Google 有 BAA。 | [Rosebud Privacy Policy](https://help.rosebud.app/about-us/privacy-policy) |
| 隐私政策披露使用 OpenAI、Anthropic、Groq 处理 AI operations 和 language processing；称传给这些服务的数据匿名化，且有 BAA 与 ZDR 协议。 | [Rosebud Privacy Policy](https://help.rosebud.app/about-us/privacy-policy) |
| Rosebud 称 journal entries 不会发送给 Mixpanel、LogRocket、Sentry，也不会发送给 Meta、Google、Apple 广告像素。 | [Rosebud Privacy Policy](https://help.rosebud.app/about-us/privacy-policy) |
| Rosebud 承认尚未进行 professional security risk assessments，当前没有 formal incident response plan，但称正在制定。 | [Rosebud Privacy Policy](https://help.rosebud.app/about-us/privacy-policy) |
| Rosebud 声明不能替代专业心理健康护理、治疗或医疗建议，不能处理心理危机，不能诊断或治疗心理健康状况。 | [Rosebud Help: Limitations](https://help.rosebud.app/getting-started/rosebud%27s-limitations) |
| Rosebud 承认 AI hallucinations，尤其当用户询问外部研究、新闻、事实资料时；它不能访问外部数据库或实时信息。 | [Rosebud Help: Limitations](https://help.rosebud.app/getting-started/rosebud%27s-limitations) |
| TechCrunch 报道 Rosebud 2025 年 6 月获得 600 万美元种子轮融资，并计划继续投入 proprietary memory technology。 | [TechCrunch](https://techcrunch.com/2025/06/04/rosebud-lands-6m-to-scale-its-interactive-ai-journaling-app/) |

### 4.2 技术架构判断

Rosebud 更接近“AI 日记 + 长期记忆 + 个性化反思”的组合型架构。

可以公开写：

- Rosebud 的公开功能已经超出单轮聊天，围绕日记条目、长期记忆、偏好学习、Persona 和周期性洞察形成一套自我反思系统。
- 可核验底层组件包括 Firestore、OpenAI / Anthropic / Groq、Mixpanel / LogRocket / Sentry、广告像素。
- 长期记忆公开可确认的是重要内容提取、组织、召回和跨条目关联；RAG、向量数据库、知识图谱或自研模型都不能确认。
- HIPAA 相关表述应写成 HIPAA-aligned / 有 BAA / ZDR 的处理链路，不能写成 HIPAA 认证。

### 4.3 可能实现路径

以下只能写成推断：

```text
文本 / 语音 / 图片 / 手写日记输入
  -> 转写 / OCR / 图片解释
  -> Firestore 存储
  -> 单条日记 AI analysis
  -> 情绪、主题、关系、模式抽取
  -> 长期记忆与偏好更新
  -> 个性化追问 / 周报 / 反思提示
```

推断点：

- 单条 reflection 可能由当前条目、用户偏好、Persona 设置和部分历史上下文共同进入 LLM。
- weekly report 可能通过后台任务聚合一周条目，抽取主题、情绪趋势、人物关系和关键洞察。
- long-term memory 可能同时包含结构化用户记忆和按语义或主题检索的历史条目，但官方未披露具体实现。
- OpenAI、Anthropic、Groq 可能承担不同任务，但路由规则未公开。

### 4.4 技术风险

- 云端保存日记内容提升跨设备体验，也提高敏感数据治理要求。
- BAA 与 ZDR 降低第三方处理风险，但日记内容仍会经过外部 AI 服务。
- 官方承认长期记忆对具体时间不强，心理场景下容易影响用户对历史事件的理解。
- 官方承认 AI 幻觉，外部事实和研究类问题尤其容易出错。
- Rosebud 声明不能处理危机，但强情绪用户可能把它当替代性支持。
- 隐私政策披露尚未完成专业安全风险评估和正式事件响应计划。

### 4.5 待核验问题

- 长期记忆到底是向量检索、结构化记忆、摘要链、知识图谱，还是组合方案？
- Firestore 是否保存 memory objects、embedding、摘要和标签？
- OpenAI、Anthropic、Groq 分别承担哪些任务？
- Persona 中的 AI model used 有哪些模型可选？
- 是否使用 fine-tuning？
- 语音转写、图片解释、手写扫描分别使用哪些供应商或模型？
- 是否有危机识别分类器、人工升级机制或热线提示触发规则？
- 是否有第三方安全审计、SOC 2、ISO 27001、DPA 或 HIPAA 法律文件？

### 4.6 不应公开写成事实

- Rosebud 使用 GPT-4、GPT-4o、Claude 3.5 或 o1 作为核心模型。
- Rosebud 使用 Pinecone、pgvector、Supabase、PostgreSQL、React Native 或 Expo。
- Rosebud 已通过 HIPAA 认证。
- Rosebud 端到端加密。公开政策只支持“传输中和静态存储中加密”。
- Rosebud 有完整临床级安全体系。
- Rosebud 的技术护城河就是 RAG 长期记忆。

## 5. Rocky.ai

### 5.1 已核验事实

| 事实 | 来源 |
| --- | --- |
| Rocky.ai 定位为企业级 AI Coach / Mentor / Roleplay Platform，支持组织和专业教练构建、部署白标 AI coaching app。 | [Rocky.ai 官网](https://www.rocky.ai/) |
| 支持把组织内部知识、最佳实践、教练框架转成可持续使用的 AI coach。 | [Rocky.ai 官网](https://www.rocky.ai/) |
| 官网公开宣称 Multi-Agent Coaching Ecosystem、Smart Knowledge Sharing、weighted retrieval、Memory & Progression、Role-Play Simulations、Self-Assessment Builder、Immediate Feedback。 | [Rocky.ai 官网](https://www.rocky.ai/) |
| 帮助中心明确提出 Knowledge-Driven AI Architecture 和 RAG，用于定制和扩展 coaching content。 | [The AI Models and Agentic Technology of Rocky.ai](https://help.rocky.ai/app-features/proprietary-ai-models-and-agentic-technology-of-rocky-ai) |
| coaching content 会被组织成 modular knowledge graph，并可基于用户 profile、当前需要、用户组、角色、子品牌或知识组合定向应用。 | [The AI Models and Agentic Technology of Rocky.ai](https://help.rocky.ai/app-features/proprietary-ai-models-and-agentic-technology-of-rocky-ai) |
| 帮助中心称其使用 modular AI agents，不同 conversation components 由专门 AI agent 处理；每个模块可定义角色、目标、方法论和问题库。 | [The AI Models and Agentic Technology of Rocky.ai](https://help.rocky.ai/app-features/proprietary-ai-models-and-agentic-technology-of-rocky-ai) |
| 白标 Creator 工具允许为每个 Quest 配置 AI Agent。 | [How to Set the AI Agents](https://help.rocky.ai/rocky-for-creators/how-to-set-the-ai-agents) |
| 预设 Agent 类型包括 Solution-focused Coach、Growth Mindset Coach、Positive Psychology Coach、GROW Coach、Role-Play Conversation 等。 | [How to Set the AI Agents](https://help.rocky.ai/rocky-for-creators/how-to-set-the-ai-agents) |
| 支持内容导入和结构化：White-label Program -> Programs -> Quests -> Content -> Bot Questions。 | [Import content from PDF, Text](https://help.rocky.ai/rocky-for-creators/import-content-from-pdf-text-or-video) |
| 帮助中心称其有 Automated Memory and Goal Generation System，会把用户对话和洞察解析成个性化知识片段，并把口头意图转为可追踪目标。 | [The AI Models and Agentic Technology of Rocky.ai](https://help.rocky.ai/app-features/proprietary-ai-models-and-agentic-technology-of-rocky-ai) |
| Rocky.ai 称核心系统是 proprietary，但会把 OpenAI ChatGPT、Google Gemini、Anthropic Claude 作为 LLM micro-services，用于 text summarization and analysis。 | [The AI Models and Agentic Technology of Rocky.ai](https://help.rocky.ai/app-features/proprietary-ai-models-and-agentic-technology-of-rocky-ai) |
| Rocky.ai 称业务与白标账户数据不用于训练 AI 模型；知识、数据和 IP 存储在 EU-based servers；系统和数据库托管在 Google Cloud，服务器位于德国法兰克福。 | [Intellectual Property for Business and White Label Solutions](https://help.rocky.ai/rocky-for-creators/intellectual-property-for-business-and-white-label-solutions) |
| 官网和帮助中心宣称 GDPR-safe、PII filtering、SSO、anonymization / pseudonymization、SSL encryption、MFA、role-based permissions、activity logging、security audits。 | [Rocky.ai 官网](https://www.rocky.ai/)、[IP and White Label Solutions](https://help.rocky.ai/rocky-for-creators/intellectual-property-for-business-and-white-label-solutions) |

### 5.2 技术架构判断

Rocky.ai 更像“企业 / 教练方法论封装平台”。

可以公开写：

- 它公开披露的架构中心是白标应用、内容知识层、对话编排、自动记忆与目标生成、模块化 Agent、外部 LLM 微服务和企业安全部署。
- Rocky.ai 明确披露 RAG、modular knowledge graph、modular AI agents、AMGS，这部分可以比其他产品写得更具体。
- 它使用 OpenAI / Gemini / Claude 的公开口径是 LLM micro-services，用于 text summarization and analysis；不能写成主模型。
- multi-agent 可以写成产品和配置层面的 modular AI agents，不能直接上升为复杂自主多智能体系统。

### 5.3 可能实现路径

以下只能写成推断：

```text
组织 / 教练上传内容
  -> Program / Quest / Content / Bot Questions 结构化
  -> 内容索引与知识图谱组织
  -> RAG 检索
  -> Quest 级 Agent 配置
  -> 对话编排
  -> 目标 / 记忆生成
  -> 角色扮演 / 反馈 / 进度跟踪
```

推断点：

- 可能使用配置驱动的 Agent 编排，每个 Quest 绑定角色、方法论、结果目标、问题库和兜底问题。
- RAG 可能由内容索引、metadata filtering、role / group targeting 组成。
- Memory & Progression 可能包含用户画像、目标、会话摘要和练习记录等结构化数据。
- Role-play 可能由场景脚本、对话 Agent、评分规则和即时反馈组合支撑。
- 安全护栏可能包含规则、权限、PII 过滤、数据隔离、对话流程和 prompt 多层机制。

### 5.4 技术风险

- proprietary AI models 与外部 LLM micro-services 的边界不透明。
- multi-agent 的营销表达和真实工程复杂度可能存在差距。
- 长期记忆若摘要或目标识别错误，会持续影响后续 coaching。
- 企业知识接入带来幻觉、权限泄露和跨客户数据隔离风险。
- coaching 与 therapy 边界需要明确，公开资料没有完整披露危机场景机制。
- GDPR、PII、MFA、审计等声明仍需要独立审计材料支撑。

### 5.5 待核验问题

- proprietary AI models 是独立训练模型、微调模型、规则/编排系统，还是特定任务模型？
- 外部 LLM 的具体使用范围是什么？
- RAG 是否使用向量数据库、metadata filtering、hybrid search、reranking 和权限过滤？
- modular knowledge graph 是真实图数据库，还是内容层级结构加 metadata？
- AMGS 的用户记忆能否查看、编辑、删除和纠错？
- PII filtering 在输入前、检索前、LLM 调用前还是日志写入前发生？
- 高风险心理内容如何处理？
- 企业客户是否有 DPA、subprocessor list、SOC 2 / ISO 27001、数据保留期限等材料？

### 5.6 不应公开写成事实

- Rocky.ai 使用 GPT-4、Claude 或 Gemini 作为主模型。
- Rocky.ai 基于 LangChain、LlamaIndex、Pinecone、Weaviate 或 pgvector。
- Rocky.ai 使用 React Native 或 Flutter。
- Rocky.ai 有完整自主多智能体协作系统。
- Rocky.ai 的 modular knowledge graph 就是图数据库。
- Rocky.ai 完全不接触第三方 AI。
- Rocky.ai 已通过 SOC 2 或 ISO 27001。
- Rocky.ai 可以安全用于心理治疗或医疗场景。

## 6. Eleos Health

### 6.1 已核验事实

| 事实 | 来源 |
| --- | --- |
| Eleos 面向 behavioral health / post-acute care，定位从 AI scribe 扩展到 system of action for community-based care，由 Polaris AI 驱动，覆盖 documentation、clinical insights、compliance、revenue cycle 等工作流。 | [Eleos 官网首页](https://eleos.health/)、[AI agents 发布稿](https://eleos.health/press-releases/eleos-expands-ai-agents-across-the-full-care-journey/) |
| Eleos Documentation 支持实时环境音频捕获和简短文本摘要输入，输出 progress note 建议，服务者需要 review / edit 后提交。 | [Eleos Documentation](https://eleos.health/documentation/) |
| 官方称可处理 150+ 语言，并转换成英文临床文档。 | [Eleos Documentation](https://eleos.health/documentation/) |
| Eleos 通过 browser extension 嵌入 web-based EHR 工作流，是 lightweight technical embedding。 | [Eleos AI FAQ](https://eleos.health/ai-frequently-asked-questions/) |
| 移动端支持离线工作，恢复连接后同步到 EHR。 | [Eleos Documentation](https://eleos.health/documentation/) |
| Polaris AI 于 2025 年 10 月发布，官方称 built in collaboration with Google Cloud technology，enabled by Google Cloud’s family of multimodal models，并结合 Eleos 自有行为健康真实会话数据集。 | [Eleos Polaris AI 发布稿](https://eleos.health/press-releases/eleos-launches-polaris-ai-built-with-google-cloud/) |
| Polaris AI 发布稿称可处理 abuse、assault、self-harm 等敏感披露，触发 mandated-reporting workflows，并处理长会话、多参与者会话、个人与团体治疗语境。 | [Eleos Polaris AI 发布稿](https://eleos.health/press-releases/eleos-launches-polaris-ai-built-with-google-cloud/) |
| 安全页公开 HIPAA compliant、SOC 2 Type II、HITRUST、ISO 27001、ISO 27799、ISO 42001，并提到系统监控、内外部审计、2FA、PHI 加密处理。 | [Eleos Security](https://eleos.health/security/)、[Eleos 首页](https://eleos.health/) |
| 安全页写明 PHI 流程为 captured -> encrypted -> analyzed -> populated back into clinician dashboard；之后可按法律和请求进行 de-identified / deleted。 | [Eleos Security](https://eleos.health/security/) |
| FAQ 写到多数 session audio 和 transcripts 会实时处理并在会话后短时间删除，但保留 AI-generated note suggestions、user engagement data 和最小会话识别信息。 | [Eleos AI FAQ](https://eleos.health/ai-frequently-asked-questions/) |
| FAQ 仍写到其 AI technology 基于 AWS 开发的 NLP engine，并在此基础上定制到 behavioral health；customer data hosted on HIPAA/PHI compliant AWS servers in continental US。 | [Eleos AI FAQ](https://eleos.health/ai-frequently-asked-questions/) |
| 工程博客披露 lakehouse 架构，涉及 PostgreSQL、MySQL、Apache Superset、AWS Athena、AWS Glue Catalog、AWS Lake Formation，并用 LF-Tags 做权限治理。 | [Eleos Medium: Lakehouse Platform](https://medium.com/eleos-health/navigating-the-data-deluge-a-journey-to-crafting-a-sophisticated-lakehouse-platform-7a1d7a147149) |
| 工程博客披露 RAG + VectorDB 实践：将 de-identified notes 做 embedding，使用 Pinecone serverless，并按 healthcare organization 建 namespace 隔离；Airflow DAG 负责 extraction、mapping、de-identification、embedding、loading。 | [Eleos Medium: RAG and VectorDB](https://medium.com/eleos-health/baking-the-future-of-ai-with-rag-and-vectordb-a29bf741530d) |

### 6.2 技术架构判断

Eleos Health 是临床机构工作流型 AI 系统。

可以公开写：

- Eleos 的 AI 位置在机构工作流里，覆盖记录、合规、质量、收入周期和临床洞察。
- 它至少有五层：输入层、AI 理解与生成层、知识与个性化层、合规与质量层、EHR 工作流嵌入层。
- 它的壁垒更可能来自领域数据、工作流嵌入、合规规则、机构级治理和临床审核闭环。
- Eleos 的公开资料同时出现 AWS 与 Google Cloud，写作时应保留时间线与混合可能性，避免单一云架构断言。

### 6.3 可能实现路径

以下只能写成推断：

```text
临床会话音频 / 文本摘要 / EHR 上下文
  -> ASR 或多模态音频理解
  -> 临床要点抽取
  -> note 建议生成
  -> 合规模板 / 规则校验
  -> 治疗师 review / edit
  -> 浏览器扩展写入 EHR
  -> 合规、质量、收入周期分析
```

推断点：

- 音频可能先经过 ASR，也可能部分由 audio-native / multimodal 模型处理。
- note 生成更可能是模型生成、合规模板/规则校验和人工 review 组合。
- Clinical Insights Agent 可能使用 client journey、历史 note、治疗目标、指南和研究资料做检索增强。
- Compliance Agent 可能结合规则引擎、分类模型和 LLM 审核。
- browser extension 可能通过 DOM overlay、form assist 或 copy-insertion 等方式与 web-based EHR 交互。
- AWS 与 Google Cloud 可能形成混合架构，但这只是对公开资料差异的合理解释。

### 6.4 技术风险

- 行为健康会话中的停顿、语气、隐喻、创伤叙事和多参与者对话容易被错误理解。
- note 生成若遗漏 intervention、client response、progress、action plan、Golden Thread 等要素，可能带来拒付和审计风险。
- Eleos 公开把 hallucination、prompt injection、system prompt leakage、model poisoning、PHI/PII exposure 列为 AI-specific risks。
- browser extension 降低集成门槛，也会面对 EHR 页面结构变化、权限、浏览器环境和可审计性问题。
- RAG / VectorDB 与 de-identified notes 能提升个性化，也带来跨客户隔离、PHI 去标识化充分性、embedding 泄露和误召回风险。
- 云架构公开口径存在时间线差异，写作时要避免过度简化。

### 6.5 待核验问题

- Polaris AI 到底是基于 Gemini family 做 fine-tuning、RAG、prompting，还是更深层 model adaptation？
- Polaris 是否替代原 AWS NLP engine，还是只用于新产品 / 新能力？
- raw audio / transcripts 的短期删除与可能保留去标识化 audio 之间如何区分？
- browser extension 如何写回 EHR？是否自动填充、人工复制或受控写入？是否有审计日志？
- Compliance Agent 的规则由 Eleos 维护、客户配置，还是二者结合？
- RAG + Pinecone 架构是否仍是当前生产架构？
- Clinical Insights Agent 使用哪些 expert-vetted guidelines 和 peer-reviewed research？

### 6.6 不应公开写成事实

- Eleos 使用 Gemini / Vertex AI 作为唯一底层模型。
- Eleos 全站部署在 Google Cloud。
- Eleos 的技术壁垒就是自研大模型。
- Eleos 不存储任何音频或转录。
- Eleos 已完全解决幻觉、prompt injection 和 PHI 泄露。
- Eleos 的浏览器扩展可以无风险兼容所有 EHR。

## 7. 可直接进入网站的短版写法

### Ash

Ash 是 4 个样本里最典型的“垂直心理模型叙事”。官方公开披露了 psychology foundation model、behavioral health data 预训练、临床团队 fine-tuning、reinforcement learning、长期记忆、文字/语音交互和双层安全系统。观察室可以把它写成“重模型叙事 + 高关系强度 + 高安全责任”的样本。底层模型、RAG、向量库和云厂商仍未公开，不能写成事实。

### Rosebud

Rosebud 的技术价值在于把日记从单次输入变成长期反思系统。官方披露了 AI analysis、long-term memory、Learned Preferences、Persona、语音日记、图片输入、手写扫描、Firestore，以及 OpenAI / Anthropic / Groq 处理链路。它可以作为“AI 日记如何做长期记忆”的样本，但 RAG、向量数据库和具体模型都仍未核验。

### Rocky.ai

Rocky.ai 是技术披露相对具体的 AI 教练平台样本。官方明确提到 Knowledge-Driven AI Architecture、RAG、modular knowledge graph、modular AI agents、AMGS、OpenAI / Gemini / Claude 微服务，以及 Google Cloud 法兰克福托管。它适合用来研究“教练方法论如何被配置成可白标、可检索、可编排的 AI 工作流”。需要避免把 modular agents 写成完整自主多智能体系统。

### Eleos Health

Eleos Health 是临床机构工作流型 AI 的重点样本。官方公开了 Polaris AI、Google Cloud multimodal model family、行为健康真实会话数据、浏览器扩展嵌入 EHR、HIPAA / SOC2 / HITRUST / ISO 安全体系，以及 RAG / VectorDB 工程博客。它的学习价值在于 AI 如何先进入专业人员的工作流，而非直接替代临床关系。AWS 与 Google Cloud 的公开口径要保留差异，不能简化成单一技术栈。

## 8. 对后续研究的要求

后续给任何产品补技术架构时，都必须额外检查：

1. 官方是否披露底层模型或供应商？
2. 是否披露数据是否用于训练？
3. 是否披露长期记忆如何查看、编辑、删除？
4. 是否披露 RAG / 知识库 / 向量库？
5. 是否披露危机识别和转介机制？
6. 是否披露安全审计、合规标准或第三方认证？
7. 是否有工程博客、论文或技术合作方资料？
8. 哪些本地旧稿说法必须降级为推断？

## 9. 下一步输出建议

建议基于这份表继续做两件事：

1. 更新观察室网站 4 个产品详情页，新增“AI 技术架构”区块。
2. 写第一篇技术方法文章：`为什么心理类 AI 产品的安全护栏不能只靠提示词`。
