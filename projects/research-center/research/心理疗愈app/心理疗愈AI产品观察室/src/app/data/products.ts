import type { Product } from './types';

export const PLACEHOLDER = (color: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='${color}' stop-opacity='0.85'/><stop offset='1' stop-color='${color}' stop-opacity='0.55'/></linearGradient></defs><rect width='800' height='500' fill='#EFF4F2'/><rect x='40' y='40' width='720' height='420' rx='14' fill='url(#g)'/><text x='60' y='110' font-family='Noto Serif SC, serif' font-size='34' fill='white' opacity='0.95'>${label}</text><text x='60' y='150' font-family='Noto Sans SC, sans-serif' font-size='16' fill='white' opacity='0.75'>图片资料待补充</text><circle cx='640' cy='380' r='80' fill='white' opacity='0.18'/><circle cx='560' cy='420' r='40' fill='white' opacity='0.14'/></svg>`
  )}`;

export const products: Product[] = [
  {
    slug: 'ash',
    name: 'Ash / Slingshot AI',
    track: 'AI 心理伴侣',
    oneLiner: '高关系强度的消费者心理产品：用 “mental health research lab + psychology foundation model” 讲一个比普通陪伴 AI 更重的故事。',
    coreExperience: '文字 / 语音对话 + 长期记忆 + 模式识别，把单轮安慰推进成持续关系体验。',
    worthLearning: '它最值得学的不是界面，而是“垂直模型叙事 + 高责任关系设计 + 安全系统”如何一起成立。',
    risk: '公开语言明显靠近 therapy，但法律边界后撤；用户认知和公司责任口径之间始终有张力。',
    confidence: '高',
    imageSource: '官方产品页 / 官方博客与安全说明，访问日期：2026-06-07',
    image: PLACEHOLDER('#6A9B8A', 'Ash'),
    url: 'https://www.talktoash.com',
    detail: {
      take30s:
        'Ash 不是普通“AI 陪聊”。它真正值得研究的地方，是把自己做成“心理健康研究实验室 + 心理学基础模型 + 消费者关系型产品”这一整套叙事。',
      positioning:
        '面向个体消费者的高关系强度心理支持产品。Ash 作为消费者入口，背后承接的是 Slingshot AI 所主张的 psychology foundation model 与研究实验室定位。',
      userPain: [
        '用户在情绪波动时需要一个随时可用、低羞耻感、低解释成本的表达出口。',
        '通用聊天机器人会顺从、安慰、给建议，但未必能稳定维持心理支持语境。',
        '传统心理咨询有价格、预约、污名与持续性门槛，很多人需要更轻的长期中间形态。',
      ],
      coreExperienceLong:
        '用户通过文字或语音进入对话，Ash 试图建立一种比普通 AI 更接近治疗式关系感的持续体验。它强调跨会话记忆、模式识别与后续 insight，重点不是“这一轮回复好不好”，而是“长期聊下来是否持续被理解和推进”。',
      psychMechanism: [
        '官方提到模型学习了 CBT、DBT、ACT、psychodynamic therapy、motivational interviewing 等多种治疗风格与方法。',
        '公开资料显示它更像“多流派心理支持能力的模型化”，而不是某一疗法脚本的产品化。',
        '公开资料不足以证明它已达到临床有效治疗水平，也不足以证明每一种疗法都被严肃执行。',
      ],
      aiRole:
        'AI 在 Ash 中承担持续关系型对话者的主体角色：倾听、追问、记忆、模式识别与风险场景下的安全降级。',
      technical: {
        evidenceLevel: 'A/B/C 混合：官方披露 psychology foundation model、behavioral health data、clinical fine-tuning、reinforcement learning、长期记忆与双层安全系统；底层模型、RAG、向量库和云厂商未公开。',
        architecture: '高关系强度的关系型对话系统 + 垂直心理模型叙事。它更像“垂直领域模型 + 产品化关系系统”，而不是普通聊天应用。',
        verified: [
          '官方公开使用 psychology foundation model、behavioral health data、clinical fine-tuning、reinforcement learning 等表述。',
          '官方披露支持文字与语音交互，并强调跨会话记忆、模式识别和一周内开始生成 insight。',
          '官方披露 layered / dual-layered safety system，并发布过自杀 / 自伤相关安全研究预印本。',
        ],
        likelyPath: [
          '文字 / 语音输入 -> 风险与意图识别 -> 历史记忆召回 -> 主对话生成 -> 双层安全检查 -> 文本 / 语音输出。',
          '长期记忆可能由结构化摘要、语义检索、用户状态或画像共同支撑，但公开资料没有确认具体方案。',
          '模式洞察可能由异步总结与跨会话主题提炼共同支撑。',
        ],
        risks: [
          '长期记忆越强，误记、错误模式归因和依赖风险越高。',
          '产品叙事明显靠近 therapy，但法律条款声明不提供医疗建议、诊断或治疗，用户理解边界需要持续观察。',
          '强化学习的优化目标未公开，无法判断它如何平衡满意度、留存和真实心理改善。',
        ],
        openQuestions: [
          '底层模型是从头训练、基于开源模型继续训练，还是混合使用第三方 frontier model？',
          '长期记忆是否使用向量数据库、摘要记忆、知识图谱或状态机？',
          '双层安全系统的两层分别是什么？',
        ],
        notFacts: [
          '不能写 Ash 使用 GPT-4o、Claude、Llama、Mistral 或某个具体底层模型。',
          '不能写 Ash 使用 RAG、向量数据库或知识图谱。',
          '不能写 Ash 已被临床证明有效治疗心理疾病。',
        ],
      },
      business: '公开发布阶段以免费 app 获取规模、关系密度和模型迭代数据为主；后续可能走订阅、EAP 或平台化延展，但当前还不足以写成已验证闭环。',
      safety:
        '官方明确承认 Ash 会出错，也明确说它不能替代临床专业人员。真正要看的，不是它会不会安慰，而是它在高风险场景下是否能稳定降级、触发资源并避免被误当成治疗服务。',
      inspiration: [
        '垂直模型叙事比“套一层通用模型”更容易建立高位品牌。',
        '在高敏感领域，关系设计本身就是产品核心。',
        '安全系统要被单独设计和单独评估，不能只靠提示词后处理。',
      ],
      learningCard:
        '在心理这种高敏感领域，“基础模型 + 产品入口”双层叙事，是一种高回报但高责任的创业姿态。',
      sources: [
        { label: 'Slingshot AI 官网', note: '研究实验室定位与 psychology foundation model 口径，2026-06-07 访问' },
        { label: 'Ash 官方产品页 / 安全与隐私页', note: '产品定位、记忆、安全和隐私边界，2026-06-07 访问' },
        { label: 'Business Wire 官方发布稿', note: '公开发布时间、融资与 beta 用户口径，2026-06-07 复核' },
      ],
    },
  },
  {
    slug: 'rosebud',
    name: 'Rosebud',
    track: 'AI 日记与自我探索',
    oneLiner: '最值得研究的不是“AI 陪你写日记”，而是它把 journaling、long-term memory 和 personalized reflection 组合成了一套持续使用系统。',
    coreExperience: '文本 / 语音 / 图片 / 手写输入 → 单条反思 → 长期记忆更新 → 周报与模式洞察。',
    worthLearning: '它把高频、低门槛的 journaling 场景做成了长期关系型产品，比“AI 治疗师”更稳、更适合产品化学习。',
    risk: '产品越像长期理解你的对象，用户就越会默认信任它；而它的治理成熟度目前并没有完全跟上这种关系强度。',
    confidence: '高',
    imageSource: '官网 / 帮助中心 / 隐私政策，访问日期：2026-06-07',
    image: PLACEHOLDER('#6F93B7', 'Rosebud'),
    url: 'https://www.rosebud.app',
    detail: {
      take30s:
        'Rosebud 真正值得研究的，不是 AI 会不会陪你写日记，而是它把日记、长期记忆、偏好学习和周期性反思，做成了一套会随着使用时间不断变强的产品。',
      positioning:
        '面向希望持续做自我反思和个人成长的用户，把“写日记”从空白页升级成有 AI 陪跑、追问、回顾和归纳的连续系统。对外明确不以“治疗”或“治疗师”叙事自居。',
      userPain: [
        '用户想整理情绪和想法，但很难长期坚持单纯书写。',
        '用户愿意记录，但传统日记无法主动帮助他们看见模式。',
        '用户真正需要的不是“今天写了一篇”，而是“持续写下来以后，我有没有更理解自己”。',
      ],
      coreExperienceLong:
        '用户通过文本、语音、图片甚至手写扫描输入内容；系统先处理单条 entry，给出反思或 dig deeper 式追问，再逐步提取重要人物、重复议题、目标和偏好，转入长期记忆层，最后生成 weekly report、主题模式和行动提示。',
      psychMechanism: [
        '官方科学页强调 proven journaling methods 和 evidence-based therapeutic modalities。',
        '它的心理学基础更像是把表达性书写、自我反思和行为改变支持做成连续产品，而不是套一套治疗脚本。',
        '公开资料不足以证明它在临床心理治疗层面有效，也不足以证明它适合承接中高风险心理问题。',
      ],
      aiRole:
        'AI 在 Rosebud 中更像“耐心的提问者 + 模式归纳者 + 长期陪跑系统”，重点不是给答案，而是帮助用户慢慢看见自己。',
      technical: {
        evidenceLevel: 'A/B/C 混合：官方披露 AI analysis、long-term memory、Learned Preferences、Persona、语音日记、图片/手写输入、Firestore 与 OpenAI / Anthropic / Groq 链路；RAG 和向量库未确认。',
        architecture: '自我记录型长期关系系统：以单条日记分析为入口，用长期记忆、偏好学习和 Persona 把一次次反思串成连续体验。',
        verified: [
          '官方帮助中心披露 AI 会提取 moods、topics、relationships 和 patterns。',
          '官方披露 long-term memory、Learned Preferences、AI personalization、voice journaling、图片输入与手写日记扫描。',
          '隐私政策披露使用 Google Firestore，以及 OpenAI、Anthropic、Groq 处理 AI operations 和 language processing。',
        ],
        likelyPath: [
          '文本 / 语音 / 图片 / 手写日记输入 -> 转写 / OCR / 图片解释 -> Firestore 存储 -> AI analysis -> 长期记忆与偏好更新 -> 个性化追问 / 周报。',
          '长期记忆可能同时包含结构化用户记忆和按语义或主题检索的历史条目，但官方未披露具体实现。',
          '多模型供应商可能承担不同任务，但路由规则未公开。',
        ],
        risks: [
          '云端保存日记内容提升跨设备体验，也提高敏感数据治理要求。',
          'BAA 与 ZDR 降低第三方处理风险，但日记内容仍会经过外部 AI 服务。',
          '官方承认长期记忆对具体时间不强，也承认 AI 幻觉。',
          '隐私政策披露尚未完成专业安全风险评估和正式事件响应计划。',
        ],
        openQuestions: [
          '长期记忆到底是向量检索、结构化记忆、摘要链、知识图谱，还是组合方案？',
          'OpenAI、Anthropic、Groq 分别承担哪些任务？',
          '是否有危机识别分类器、人工升级机制或热线提示触发规则？',
        ],
        notFacts: [
          '不能写 Rosebud 使用 GPT-4、GPT-4o、Claude 3.5 或 o1 作为核心模型。',
          '不能写 Rosebud 使用 Pinecone、pgvector、Supabase、PostgreSQL、React Native 或 Expo。',
          '不能写 Rosebud 已通过 HIPAA 认证或采用端到端加密。',
        ],
      },
      business: '当前是典型 freemium + premium subscription 路线：先用低门槛高频习惯进入，再把真正的产品壁垒做在记忆、连续性和个性化上。',
      safety:
        '长期日记数据极度敏感。问题不只是加不加密，而是当产品越来越像“了解你的人”时，用户会不会高估它的判断准确性和治理成熟度。',
      inspiration: [
        '先抓住高频、可持续、低门槛行为，再叠加 AI 深度。',
        '长期记忆比单轮对话更能构成留存壁垒。',
        '个性化不只是换语气，而是让系统逐步学会用户偏好。',
      ],
      learningCard:
        'Rosebud 最值钱的地方，不是“它会陪你写”，而是“它会随着你持续写而逐渐变强”。',
      sources: [
        { label: 'Rosebud 官网', note: '产品定位、定价与核心文案，2026-06-07 访问' },
        { label: 'Rosebud 帮助中心 / 隐私政策', note: '长期记忆、Persona、偏好学习与数据治理说明，2026-06-07 访问' },
        { label: 'TechCrunch 报道', note: '2025 年融资与 AI mentor 方向口径，2026-06-07 复核' },
      ],
    },
  },
  {
    slug: 'rocky-ai',
    name: 'Rocky.ai',
    track: 'AI 教练与个人成长',
    oneLiner: '它不是一个 AI 教练，而是一套企业级 AI 教练基础设施：白标、知识接入、角色扮演、目标跟踪和多智能体编排都在这里。',
    coreExperience: '组织上传方法论和内容 → Quest / Agent 配置 → 用户进入教练或角色扮演场景 → 系统跟踪目标、记忆和进度。',
    worthLearning: '它把专家服务和教练方法论做成了可配置平台，而不是单一聊天窗口。',
    risk: '平台能力越强，就越容易被客户配置到过界场景；尤其要防止从 coaching 滑向治疗替代。',
    confidence: '高',
    imageSource: '官网 / 帮助中心 / 隐私政策，访问日期：2026-06-07',
    image: PLACEHOLDER('#D6A66A', 'Rocky.ai'),
    url: 'https://rocky.ai',
    detail: {
      take30s:
        'Rocky.ai 真正值得研究的，不是“AI 教练会不会聊天”，而是它把自己做成了一套企业级 AI 教练基础设施：可白标、可接知识、可按场景配置 Agent、可承接教练和角色扮演流程。',
      positioning:
        '面向组织、教练、培训方和个人成长场景的 AI 教练平台。它卖的不只是对话，而是把组织知识、方法论和教练流程打包进 AI 系统里的能力。',
      userPain: [
        '教练、顾问和培训方的服务很难规模化。',
        '组织内部知识、方法论和培训内容很难被持续调用。',
        '传统培训容易停留在一次性学习，缺乏日常微练习和行为跟踪。',
      ],
      coreExperienceLong:
        '组织或教练方先配置品牌、Programs、Quests、知识内容和 AI Agents；用户再进入某个教练主题、角色扮演或自评场景，由 COE 编排合适模块，结合组织知识推进对话，并把目标和洞察沉淀到 AMGS 中，形成下一次持续跟进。',
      psychMechanism: [
        '公开资料显示它的方法基础更偏教练学、正向心理学和行为改变，而不是临床心理治疗。',
        '它试图把“教练方法”做成可配置模块，而不是把某位教练的人格简单复制成聊天 bot。',
        '公开资料不足以证明它适合承担治疗责任，也不足以证明它适合替代人工处理复杂心理困扰。',
      ],
      aiRole:
        'AI 在 Rocky.ai 中承担结构化提问者、进度追踪者、角色扮演伙伴与组织方法论执行器的角色。',
      technical: {
        evidenceLevel: 'A/B/C 混合：官方披露 Knowledge-Driven AI Architecture、RAG、COE、AMGS、modular AI agents、Google Cloud Frankfurt，以及 OpenAI / Gemini / Claude 微服务；底层运行时细节未公开。',
        architecture: '知识驱动的多智能体教练平台：白标应用、内容知识层、对话编排、目标生成和企业级部署共同构成价值。',
        verified: [
          '帮助中心明确提出 Knowledge-Driven AI Architecture 和 RAG，用于定制和扩展 coaching content。',
          '官方披露 COE、AMGS、modular AI agents、Quest 级 Agent 配置，以及多种预设 Coach / Role-play Agent 类型。',
          '官方称核心系统 proprietary，同时会把 OpenAI、Google Gemini、Anthropic Claude 作为 LLM micro-services 用于文本摘要和分析。',
          '官方披露系统和数据库托管在 Google Cloud，服务器位于法兰克福。',
        ],
        likelyPath: [
          '组织 / 教练上传内容 -> Program / Quest / Content / Bot Questions 结构化 -> RAG 检索 -> Quest 级 Agent 配置 -> 对话编排 -> 目标 / 记忆生成 -> 角色扮演 / 反馈 / 进度跟踪。',
          'RAG 可能由内容索引、metadata filtering、role / group targeting 组成。',
          'Role-play 可能由场景脚本、对话 Agent、评分规则和即时反馈组合支撑。',
        ],
        risks: [
          'proprietary AI models 与外部 LLM micro-services 的边界不透明。',
          '平台能配置的东西越多，责任边界也越容易被客户配置得过界。',
          '企业知识接入带来幻觉、权限泄露和跨客户数据隔离风险。',
          'coaching 与 therapy 边界需要明确，公开资料没有完整披露危机场景机制。',
        ],
        openQuestions: [
          'proprietary AI models 是独立训练模型、微调模型、规则/编排系统，还是特定任务模型？',
          'RAG 是否使用向量数据库、metadata filtering、hybrid search、reranking 和权限过滤？',
          'AMGS 的用户记忆能否查看、编辑、删除和纠错？',
        ],
        notFacts: [
          '不能写 Rocky.ai 使用 GPT-4、Claude 或 Gemini 作为主模型。',
          '不能写 Rocky.ai 基于 LangChain、LlamaIndex、Pinecone、Weaviate 或 pgvector。',
          '不能写 Rocky.ai 有完整自主多智能体协作系统，或可安全用于心理治疗场景。',
        ],
      },
      business: '明显的 B2B / 白标平台路径：它不是用单个 AI 教练抢用户注意力，而是试图成为组织和专业服务方的 AI 交付底座。',
      safety:
        '平台能力强不代表应该无边界扩展到心理治疗或危机干预。真正的挑战不是模型聪明不聪明，而是哪些场景平台根本不该接。',
      inspiration: [
        '不要把“AI 教练”只做成一个聊天窗口。',
        '平台化会比单点工具更适合 B2B 价值捕获。',
        '多智能体真正有价值的地方，在于任务分工，而不是概念包装。',
      ],
      learningCard:
        'Rocky.ai 最值钱的不是“会问问题”，而是“把问题、内容、角色、目标和交付流程一起产品化”。',
      sources: [
        { label: 'Rocky.ai 官网', note: '平台定位、目标用户与白标能力，2026-06-07 访问' },
        { label: 'Rocky.ai 帮助中心', note: 'COE、AMGS、RAG、Agent 配置与企业数据说明，2026-06-07 访问' },
        { label: '隐私与 IP 页面', note: '数据处理与部署口径，2026-06-07 访问' },
      ],
    },
  },
  {
    slug: 'eleos-health',
    name: 'Eleos Health',
    track: '临床与机构工作流',
    oneLiner: '它不是“AI 写病历工具”，而是把 documentation、compliance 和 revenue cycle 串成一条机构工作流的 System of Action。',
    coreExperience: '会谈音频或摘要进入系统 → 生成 note suggestions → 运行 clinical / compliance / revenue agents → 在 EHR 工作流中完成修正与提交。',
    worthLearning: '它展示了高责任行业里最稳的一类 AI 路线：不替代专业人员，而是深入最痛、最贵、最可量化的流程问题。',
    risk: '当 AI 从建议走向前置阻断和引导，问题就不只是准确率，而是治理、审计和责任链是否成立。',
    confidence: '高',
    imageSource: '官网 / 产品页 / 安全页 / 官方发布稿，访问日期：2026-06-07',
    image: PLACEHOLDER('#5F8FAA', 'Eleos Health'),
    url: 'https://eleos.health',
    detail: {
      take30s:
        'Eleos Health 最值得研究的，不是“AI 写病历”，而是它把自己从环境式 AI 记录员，进一步做成了面向 community-based care 的 System of Action。',
      positioning:
        '面向行为健康和社区型照护机构的工作流型 AI 平台：覆盖 documentation、clinical insights、compliance 和 revenue cycle management。',
      userPain: [
        '行为健康和社区照护场景的文书要求高，且直接影响 reimbursement 和 audit。',
        '提供者在写进展笔记、补文书、追合规要求上消耗大量时间。',
        '传统 CQI 多在事后才发现问题，临床、合规和收入团队的数据常常分散。',
      ],
      coreExperienceLong:
        '提供者通过浏览器扩展或移动端在现有 EHR 工作流中使用 Eleos。系统接收会谈音频或关键要点摘要，先生成结构化、临床相关、合规导向的 note suggestions，再把临床线索、合规要求与 payer 规则放进同一条 AI 工作流中，提前发现会影响过审、报销和质量管理的问题。',
      psychMechanism: [
        '公开资料显示 Eleos 并不是做治疗建议替代，而是建立在行为健康临床工作流上。',
        '平台强调识别 CBT、DBT、MI、ACT 等 evidence-based techniques，也强调 therapeutic themes、treatment goals 和 social determinants of health。',
        '它的价值更偏 provider support，而不是直接面向患者的自主治疗建议。',
      ],
      aiRole:
        'AI 在 Eleos 中承担临床副驾和机构工作流系统的角色：记录、提炼、校验、提醒和提前阻断风险，但不取代临床关系和自主专业判断。',
      technical: {
        evidenceLevel: 'A/B/C 混合：官方披露 Polaris AI、Google Cloud + Gemini family、behavioral health 真实会话数据、browser extension、workflow agents 与多项认证；具体底层服务拓扑和检索细节未完全公开。',
        architecture: '高责任医疗工作流系统：音频原生、多模态、workflow agents、EHR 嵌入和合规治理共同构成价值，而不是单一笔记生成器。',
        verified: [
          'Eleos Documentation 支持环境音频捕获和短摘要输入，输出 progress note 建议，服务者需要 review / edit 后提交。',
          'Polaris AI 官方称与 Google Cloud 合作构建，并启用 Gemini family of multimodal models。',
          '官方披露通过 browser extension 嵌入 web-based EHR 工作流。',
          '官网与安全页公开 HIPAA、SOC 2 Type II、HITRUST、ISO 27001、ISO 27799、ISO 42001 等治理口径。',
        ],
        likelyPath: [
          '会谈音频或摘要输入 -> 临床相关结构化提取 -> note suggestion 生成 -> provider review -> 合规与风险检查 -> payer / 组织规则校验 -> 上游修正与提交。',
          '到 2026 年公开口径下，可以理解为 documentation layer -> clinical insights layer -> compliance layer -> revenue cycle layer。',
          '各层之间可能有规则、检索、模型和权限系统共同协作，但公开资料没有完整展开。',
        ],
        risks: [
          '行为健康会谈中的停顿、隐喻、创伤叙事和多参与者对话容易被错误理解。',
          '一旦 AI 的 note 或风险提示被过度信任，就会带来拒付、审计或自动化偏差风险。',
          'browser extension 降低集成门槛，也要面对页面结构变化、权限和可审计性问题。',
          '去标识化音频和高敏感临床数据仍然是治理难点。',
        ],
        openQuestions: [
          'Polaris AI 到底是基于 Gemini family 做 fine-tuning、RAG、prompting，还是更深层 model adaptation？',
          'Polaris 是否替代原 AWS NLP engine，还是只用于新产品 / 新能力？',
          'browser extension 如何写回 EHR？是否自动填充、人工复制或受控写入？是否有审计日志？',
        ],
        notFacts: [
          '不能写 Eleos 使用 Gemini / Vertex AI 作为唯一底层模型。',
          '不能写 Eleos 全站部署在 Google Cloud。',
          '不能写 Eleos 不存储任何音频或转录，或已经完全解决幻觉、prompt injection 和 PHI 泄露。',
        ],
      },
      business: '典型的高 ARPU B2B 医疗平台路径：价值不只在效率提升，更在降低拒付、减少返工、提前发现风险和改善机构质量管理。',
      safety:
        '在 Eleos 这里，安全治理不是附属项，而是进入市场的基础设施。当 AI 从“建议”走向“提前阻断和引导”，真正的问题就变成了治理、透明度和可追责性。',
      inspiration: [
        '不要只盯着“让医生少写字”，要盯着“机构哪里最容易损失钱和质量”。',
        '在高监管行业，嵌入工作流往往比重做系统更现实。',
        '认证、治理和责任设计本身就是产品能力。',
      ],
      learningCard:
        'Eleos 最值得学的不是“AI 更懂情绪”，而是“AI 更懂机构风险和工作流”。',
      sources: [
        { label: 'Eleos 官网 / 产品页 / 安全页', note: 'System of Action、Documentation、EHR 接入与治理口径，2026-06-07 访问' },
        { label: '官方发布稿', note: 'Series C、Polaris AI、ISO 42001 与 agent 扩展口径，2026-06-07 复核' },
        { label: '公开工程与研究叙事', note: '用于理解其技术方向，但未公开的实现细节不写成事实' },
      ],
    },
  },
  // Other products (cards only)
  { slug: 'noah-ai', name: 'Noah AI', track: 'AI 心理伴侣', oneLiner: '基于人格特质适配的对话式情绪伙伴。', coreExperience: '人格测评 + 长期对话记忆，AI 风格随用户偏好调整。', worthLearning: '把人格匹配作为初始化体验，降低冷启动焦虑。', risk: '"匹配感"可能造成对真实关系的替代依赖。', confidence: '中', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#7BA890', 'Noah AI') },
  { slug: 'sonia-ai', name: 'Sonia AI', track: 'AI 心理伴侣', oneLiner: 'CBT 导向的对话式心理自助产品。', coreExperience: '结构化 CBT 练习 + 情绪追踪，AI 担任练习引导者。', worthLearning: '把 CBT 工作表数字化为对话流，降低门槛。', risk: '结构化练习的吸引力随使用周期衰减明显。', confidence: '中', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#8AAEC0', 'Sonia AI') },
  { slug: 'pi', name: 'Pi', track: 'AI 心理伴侣', oneLiner: '通用 AI 伴侣，对情绪话题表现出色。', coreExperience: '低延迟语音对话 + 友善人格，被很多用户当情绪出口。', worthLearning: '"情绪友好"作为通用 AI 的差异化定位的可行性。', risk: '非专门为心理设计，安全边界更模糊。', confidence: '中', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#A4B8B0', 'Pi') },
  { slug: 'layers', name: 'Layers', track: 'AI 日记与自我探索', oneLiner: '多模态情绪记录与 AI 解读。', coreExperience: '语音 / 图片 / 文字混合记录，AI 周期性给出"情绪剖面"。', worthLearning: '多模态降低"写"的门槛。', risk: '"被解读"可能带来标签化与自我限定。', confidence: '低', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#9AAEC4', 'Layers') },
  { slug: 'betwixt', name: 'Betwixt', track: 'AI 日记与自我探索', oneLiner: '叙事式互动小说 + 心理学练习。', coreExperience: '把 CBT、ACT 练习嵌进互动叙事，让"做练习"像玩游戏。', worthLearning: '游戏化叙事是被严重低估的心理产品形态。', risk: '叙事产能成本高，难以持续供给。', confidence: '中', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#BE9F78', 'Betwixt') },
  { slug: 'flourish-science', name: 'Flourish Science', track: 'AI 教练与个人成长', oneLiner: '基于积极心理学的 AI 成长教练。', coreExperience: '每日小练习（感恩、优势识别）+ AI 引导反思。', worthLearning: '积极心理学有大量已验证的小练习，适合 AI 承载。', risk: '"积极"被滥用容易变成"有毒乐观"。', confidence: '中', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#C2A678', 'Flourish Science') },
  { slug: 'purpose', name: 'Purpose', track: 'AI 教练与个人成长', oneLiner: '面向意义感与价值观澄清的 AI 教练。', coreExperience: '价值观盘点 + 长期目标对齐，对话偏深度。', worthLearning: '把"意义"作为产品维度，与"效率"赛道区分开。', risk: '价值观话题极度文化敏感，易出错。', confidence: '低', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#D2A66E', 'Purpose') },
  { slug: 'yuna-health', name: 'Yuna Health', track: '职场心理健康', oneLiner: '面向员工的 AI 心理健康陪伴与转介平台。', coreExperience: '员工匿名对话 + 风险识别 + 转介至 EAP 资源。', worthLearning: '"AI 前置筛查 + 人工转介"是企业场景的稳健结构。', risk: '雇主对话数据的隔离与匿名是信任前提。', confidence: '中', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#6F93B7', 'Yuna Health') },
  { slug: 'coachhub-aimy', name: 'CoachHub AIMY', track: '职场心理健康', oneLiner: '企业教练平台中的 AI 教练模块。', coreExperience: '为不能配人类教练的员工，提供 AI 教练补位。', worthLearning: '"AI 教练 + 人类教练"的混合产品形态。', risk: 'AI 与人类教练的衔接体验非常难做。', confidence: '中', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#7C9CBC', 'CoachHub AIMY') },
  { slug: 'moodtalker', name: 'MoodTalker', track: '国内观察', oneLiner: '中文 AI 情绪倾诉与日记应用。', coreExperience: '中文情境优化的对话风格 + 日记回顾。', worthLearning: '中文心理表达与英文有结构性差异，本地化不止翻译。', risk: '国内合规对心理类应用要求高，需密切关注。', confidence: '低', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#7DAB99', 'MoodTalker') },
  { slug: 'xingyun', name: '星云星空', track: '国内观察', oneLiner: '中文 AI 角色化心理陪伴。', coreExperience: '可选 AI 人格 + 长期记忆 + 情境化倾诉。', worthLearning: '角色化是国内用户接受 AI 陪伴的重要入口。', risk: '"角色"容易滑向娱乐化，偏离心理价值。', confidence: '低', imageSource: '图片资料待补充，当前为研究卡片图', image: PLACEHOLDER('#8FA8C0', '星云星空') },
  { slug: 'infiheal', name: 'InfiHeal', track: '待核验线索', oneLiner: '印度市场的 AI 心理健康平台（待核验）。', coreExperience: '待核验。', worthLearning: '新兴市场的 AI 心理产品形态差异。', risk: '信息不足，未独立验证。', confidence: '待核验', imageSource: '线索来源：行业报告（待核验）', image: PLACEHOLDER('#9AA5A8', 'InfiHeal') },
  { slug: 'therappai', name: 'therappai', track: '待核验线索', oneLiner: 'AI 治疗辅助工具线索（待核验）。', coreExperience: '待核验。', worthLearning: '待核验。', risk: '信息不足，未独立验证。', confidence: '待核验', imageSource: '线索来源：社交媒体（待核验）', image: PLACEHOLDER('#9AA5A8', 'therappai') },
];
