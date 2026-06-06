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
    oneLiner: '比普通陪伴 AI 更进一步：它想做的不是一次聊天，而是一段持续的心理支持关系。',
    coreExperience: '文字 / 语音对话 + 长期记忆 + 模式识别，让产品从“会回应”走向“会持续理解”。',
    worthLearning: '它把模型叙事、关系设计和安全系统放在了一起，这是心理 AI 里少见的重投入路线。',
    risk: '产品语言靠近“治疗感”，但法律边界明显后撤，这种张力会一直存在。',
    confidence: '高',
    imageSource: '官方产品页 / 官方博客与安全说明，访问日期：2026-06-07',
    image: PLACEHOLDER('#6A9B8A', 'Ash'),
    url: 'https://www.talktoash.com',
    detail: {
      take30s:
        'Ash 不是普通“AI 陪聊”。它想做的是更长期、更像被持续理解的心理支持体验。',
      positioning:
        '面向个体消费者的心理支持产品。它一边提供对话体验，一边把自己讲成“心理学基础模型”的消费者入口。这个定位和普通陪伴型 AI 很不一样：它不是只想做一个情绪出口，而是想占住“心理支持”这条更高责任的产品位置。',
      userPain: [
        '用户在情绪波动时需要一个随时可用、低羞耻感、低解释成本的表达出口。',
        '通用聊天机器人会顺从、安慰、给建议，但未必能稳定维持心理支持语境。',
        '传统心理咨询有价格、预约、污名与持续性门槛，很多人需要更轻的长期中间形态。',
      ],
      coreExperienceLong:
        '用户通过文字或语音进入对话，Ash 强调跨会话记忆、模式识别和后续 insight。它要解决的不是“这一轮回复好不好”，而是“长期聊下来，用户会不会感觉自己被持续理解”。换句话说，它在追求的不是聊天顺滑，而是关系连续性。',
      psychMechanism: [
        '官方提到模型学习了 CBT、DBT、ACT、psychodynamic therapy、motivational interviewing 等多种治疗风格与方法。',
        '公开资料显示它更像“多流派心理支持能力的模型化”，而不是某一疗法脚本的产品化。',
        '公开资料不足以证明它已达到临床有效治疗水平，也不足以证明每一种疗法都被严肃执行。',
      ],
      aiRole:
        'AI 在这里承担的是持续关系型对话者：倾听、追问、记忆和在高风险场景下主动收住边界。它并不只是“回答问题”，而是在尝试维持一种长期、稳定、带有反思感的支持关系。',
      technical: {
        evidenceLevel: '高：官方明确披露了心理学基础模型、长期记忆和双层安全系统；底层模型与工程细节没有公开。',
        architecture: 'Ash 更像一套为心理支持场景专门打磨的关系型对话系统，而不是普通聊天机器人。',
        verified: [
          '官方公开使用 psychology foundation model、behavioral health data、clinical fine-tuning 和 reinforcement learning 等表述。',
          '官方披露支持文字与语音交互，并强调跨会话记忆和模式识别。',
          '官方披露双层安全系统，并发布过自杀 / 自伤相关安全研究。',
        ],
        likelyPath: [
          '文字 / 语音输入 -> 风险识别 -> 历史记忆召回 -> 主对话生成 -> 安全检查 -> 输出。',
          '长期记忆大概率不只是简单聊天记录，而是经过整理后的用户上下文。',
          '模式洞察更像后台持续总结，而不是单轮对话里临时生成。',
        ],
        risks: [
          '长期记忆越强，误记和错误归因的风险越高。',
          '产品体验越像治疗，用户越可能高估它的能力边界。',
          '模型优化目标没有公开，外界很难判断它在“陪伴感”和“真实帮助”之间怎么取舍。',
        ],
        openQuestions: [
          '底层模型到底是自研、继续训练，还是混合调用第三方模型？',
          '长期记忆到底用什么方式实现？',
          '双层安全系统具体是怎么分工的？',
        ],
        notFacts: [
          '不能写 Ash 使用某个具体底层模型。',
          '不能写 Ash 已公开采用某种特定记忆架构。',
          '不能写 Ash 已被临床证明能治疗心理疾病。',
        ],
      },
      business: '当前更像先做规模和关系密度，再看订阅、企业福利或平台能力延展。',
      safety:
        '官方明确承认 Ash 会出错，也明确说它不能替代临床专业人员。真正要看的，是它能不能在高风险场景下稳定收住边界。',
      inspiration: [
        '垂直模型叙事比“套一层通用模型”更容易建立高位品牌。',
        '在高敏感领域，关系设计本身就是产品核心。',
        '安全系统要被单独设计和单独评估，不能只靠提示词后处理。',
      ],
      learningCard:
        '在高敏感领域，越想做“更像人”的产品，就越要先把边界和安全做好。',
      sources: [
        { label: 'Slingshot AI 官网', note: '主要用来确认公司定位，以及它如何描述自己的心理学基础模型。' },
        { label: 'Ash 官方产品页 / 安全与隐私页', note: '主要用来确认产品定位、长期记忆、安全边界和隐私处理方式。' },
        { label: '官方发布稿', note: '主要用来交叉看发布时间、公开融资口径和 beta 阶段信息。' },
      ],
    },
  },
  {
    slug: 'rosebud',
    name: 'Rosebud',
    track: 'AI 日记与自我探索',
    oneLiner: '它最有意思的地方，不是“陪你写日记”，而是“越写越懂你”。',
    coreExperience: '文本 / 语音 / 图片 / 手写输入 → 单条反思 → 长期记忆更新 → 周报与模式洞察。',
    worthLearning: '这是非常稳的一条路线：从高频、低门槛习惯切入，再把价值做深。',
    risk: '产品越像“懂你的人”，用户就越容易高估它的判断准确性和治理成熟度。',
    confidence: '高',
    imageSource: '官网 / 帮助中心 / 隐私政策，访问日期：2026-06-07',
    image: PLACEHOLDER('#6F93B7', 'Rosebud'),
    url: 'https://www.rosebud.app',
    detail: {
      take30s:
        'Rosebud 的重点不是“AI 陪你写日记”，而是“这套系统会随着你的持续使用而变强”。',
      positioning:
        '面向希望持续做自我反思和个人成长的用户，把“写日记”升级成有 AI 追问、回顾和归纳的连续系统。它刻意不把自己讲成治疗工具，而是更克制地停在“反思和成长”这一边。',
      userPain: [
        '用户想整理情绪和想法，但很难长期坚持单纯书写。',
        '用户愿意记录，但传统日记无法主动帮助他们看见模式。',
        '用户真正需要的不是“今天写了一篇”，而是“持续写下来以后，我有没有更理解自己”。',
      ],
      coreExperienceLong:
        '用户通过文本、语音、图片甚至手写扫描输入内容；系统先处理单条内容，再逐步提取重要人物、重复议题和偏好，转入长期记忆层，最后生成周报和模式洞察。它的价值不在某一次追问有多聪明，而在于写得越久，系统越能把零散记录串成连续理解。',
      psychMechanism: [
        '官方科学页强调 proven journaling methods 和 evidence-based therapeutic modalities。',
        '它的心理学基础更像是把表达性书写、自我反思和行为改变支持做成连续产品，而不是套一套治疗脚本。',
        '公开资料不足以证明它在临床心理治疗层面有效，也不足以证明它适合承接中高风险心理问题。',
      ],
      aiRole:
        'AI 在 Rosebud 中更像“耐心的提问者 + 模式归纳者”，重点不是给答案，而是帮助用户慢慢看见自己。它不像咨询师，也不像效率工具，更像一个不断帮你回看和整理自己的反思系统。',
      technical: {
        evidenceLevel: '高：官方明确披露了长期记忆、偏好学习、Persona、多模型链路和数据存储口径；底层记忆实现没有公开。',
        architecture: 'Rosebud 本质上是一套“会记住你、也会继续追问你”的反思系统，而不只是 AI 日记本。',
        verified: [
          '官方帮助中心披露 AI 会提取 moods、topics、relationships 和 patterns。',
          '官方披露 long-term memory、Learned Preferences、AI personalization、voice journaling、图片输入与手写日记扫描。',
          '隐私政策披露使用 Google Firestore，以及 OpenAI、Anthropic、Groq 处理 AI operations 和 language processing。',
        ],
        likelyPath: [
          '文本 / 语音 / 图片 / 手写输入 -> 内容处理 -> 单条分析 -> 长期记忆与偏好更新 -> 追问 / 周报。',
          '长期记忆很可能既包含结构化总结，也包含历史内容的主题召回。',
          '不同模型供应商大概率在分工合作，但官方没有公开具体路由。',
        ],
        risks: [
          '云端日记内容天然带来更高的数据治理要求。',
          '即使做了去身份化，内容仍然会经过外部 AI 服务。',
          '官方承认长期记忆对具体时间不强，也承认会出现幻觉。',
          '官方也承认安全治理还没有完全成熟。',
        ],
        openQuestions: [
          '长期记忆到底是摘要、检索，还是两者结合？',
          'OpenAI、Anthropic、Groq 各自负责什么？',
          '危机场景里是否有更明确的识别和升级机制？',
        ],
        notFacts: [
          '不能写 Rosebud 使用某个具体核心模型。',
          '不能写 Rosebud 已公开采用某个特定向量数据库或前端技术栈。',
          '不能写 Rosebud 已通过 HIPAA 认证或采用端到端加密。',
        ],
      },
      business: '很清楚的订阅产品逻辑：先抓住习惯，再把价值做在长期记忆和连续体验上。',
      safety:
        '长期日记数据极度敏感。真正的问题不只是加密，而是用户会不会把它当成一个比实际更可靠的“理解者”。',
      inspiration: [
        '先抓住高频、可持续、低门槛行为，再叠加 AI 深度。',
        '长期记忆比单轮对话更能构成留存壁垒。',
        '个性化不只是换语气，而是让系统逐步学会用户偏好。',
      ],
      learningCard:
        'Rosebud 最值钱的地方，是它把“写下来”慢慢变成“看见自己”。',
      sources: [
        { label: 'Rosebud 官网', note: '主要用来确认它如何定义自己、怎么收费，以及核心产品文案。' },
        { label: 'Rosebud 帮助中心 / 隐私政策', note: '主要用来确认长期记忆、Persona、偏好学习和数据治理口径。' },
        { label: 'TechCrunch 报道', note: '主要用来补充融资信息和它对外讲述的增长方向。' },
      ],
    },
  },
  {
    slug: 'rocky-ai',
    name: 'Rocky.ai',
    track: 'AI 教练与个人成长',
    oneLiner: '它卖的不是一个 AI 教练，而是一整套“把教练方法规模化交付”的平台。',
    coreExperience: '组织上传方法论和内容 → Quest / Agent 配置 → 用户进入场景 → 系统跟踪目标、记忆和进度。',
    worthLearning: '它把专家服务做成平台，这比单一聊天窗口更有商业想象力。',
    risk: '平台能力越强，越要防止客户把它配置到不该接的高风险场景。',
    confidence: '高',
    imageSource: '官网 / 帮助中心 / 隐私政策，访问日期：2026-06-07',
    image: PLACEHOLDER('#D6A66A', 'Rocky.ai'),
    url: 'https://rocky.ai',
    detail: {
      take30s:
        'Rocky.ai 真正值得研究的，不是“AI 教练会不会聊天”，而是它把教练服务做成了可配置、可白标、可规模化交付的平台。',
      positioning:
        '面向组织、教练和培训方的 AI 教练平台。它卖的不只是对话，而是把方法论、内容和流程打包进系统里的能力。这个定位决定了它更像基础设施，而不是一个单点应用。',
      userPain: [
        '教练、顾问和培训方的服务很难规模化。',
        '组织内部知识、方法论和培训内容很难被持续调用。',
        '传统培训容易停留在一次性学习，缺乏日常微练习和行为跟踪。',
      ],
      coreExperienceLong:
        '组织或教练方先配置品牌、Programs、Quests、知识内容和 AI Agents；用户再进入教练、角色扮演或自评场景，系统结合组织知识推进对话，并把目标和洞察沉淀成后续跟进。它真正想解决的，不是“AI 会不会教练式提问”，而是“教练方法能不能被稳定、重复、规模化交付”。',
      psychMechanism: [
        '公开资料显示它的方法基础更偏教练学、正向心理学和行为改变，而不是临床心理治疗。',
        '它试图把“教练方法”做成可配置模块，而不是把某位教练的人格简单复制成聊天 bot。',
        '公开资料不足以证明它适合承担治疗责任，也不足以证明它适合替代人工处理复杂心理困扰。',
      ],
      aiRole:
        'AI 在 Rocky.ai 中承担结构化提问者、进度追踪者、角色扮演伙伴和方法论执行器的角色。它不是一个自由聊天 bot，而是被放进了流程、知识和目标管理里的工作角色。',
      technical: {
        evidenceLevel: '高：官方明确披露了 RAG、COE、AMGS、模块化 Agent 和多模型微服务；底层运行时细节没有公开。',
        architecture: 'Rocky.ai 更像一套知识驱动的教练平台：内容、角色、目标和流程一起被编排，而不是只靠一个 bot。',
        verified: [
          '帮助中心明确提出 Knowledge-Driven AI Architecture 和 RAG，用于定制和扩展 coaching content。',
          '官方披露 COE、AMGS、modular AI agents、Quest 级 Agent 配置，以及多种预设 Coach / Role-play Agent 类型。',
          '官方称核心系统 proprietary，同时会把 OpenAI、Google Gemini、Anthropic Claude 作为 LLM micro-services 用于文本摘要和分析。',
          '官方披露系统和数据库托管在 Google Cloud，服务器位于法兰克福。',
        ],
        likelyPath: [
          '上传内容 -> 结构化成 Program / Quest / 内容模块 -> 检索相关知识 -> 分派合适 Agent -> 跟踪目标和进度。',
          'RAG 大概率不只是找资料，而是和角色、群组、场景一起决定回答方式。',
          '角色扮演功能很可能同时依赖场景脚本、对话 Agent 和反馈规则。',
        ],
        risks: [
          '自有系统和外部 LLM 微服务之间的边界并不透明。',
          '平台越灵活，越容易被客户配置到不该接的高风险场景。',
          '企业知识接入会带来幻觉、权限和隔离问题。',
          'coaching 和 therapy 的边界必须明确。',
        ],
        openQuestions: [
          '所谓 proprietary AI models 到底是什么？',
          'RAG 的底层检索和权限控制如何实现？',
          'AMGS 的记忆能否被查看、纠错和删除？',
        ],
        notFacts: [
          '不能写 Rocky.ai 由某个具体大模型“主导”。',
          '不能写 Rocky.ai 公开采用某个具体 Agent 框架或向量库。',
          '不能写 Rocky.ai 适合安全用于心理治疗场景。',
        ],
      },
      business: '很明确的 B2B / 白标平台路线：核心不是抢个人用户，而是成为组织和专业服务方的交付底座。',
      safety:
        '平台能力强不代表应该无边界扩展到心理治疗或危机干预。真正的挑战，是先定义哪些场景根本不该接。',
      inspiration: [
        '不要把“AI 教练”只做成一个聊天窗口。',
        '平台化会比单点工具更适合 B2B 价值捕获。',
        '多智能体真正有价值的地方，在于任务分工，而不是概念包装。',
      ],
      learningCard:
        'Rocky.ai 最值钱的不是“会问问题”，而是“能把一套方法稳定交付出去”。',
      sources: [
        { label: 'Rocky.ai 官网', note: '主要用来确认平台定位、目标用户，以及白标和组织场景能力。' },
        { label: 'Rocky.ai 帮助中心', note: '主要用来确认 COE、AMGS、RAG、Agent 配置和产品运转方式。' },
        { label: '隐私与 IP 页面', note: '主要用来确认数据处理、部署位置和企业数据边界。' },
      ],
    },
  },
  {
    slug: 'eleos-health',
    name: 'Eleos Health',
    track: '临床与机构工作流',
    oneLiner: '它卖的不是“AI 写病历”，而是“让机构少出错、少漏钱、少返工”的工作流系统。',
    coreExperience: '会谈音频或摘要进入系统 → 生成 note suggestions → 运行 clinical / compliance / revenue agents → 在 EHR 工作流中完成修正与提交。',
    worthLearning: '它代表了高责任行业里最稳的一条 AI 路线：不替代专业人员，而是深入最贵的流程问题。',
    risk: '当 AI 进入临床和合规主链路，问题就不只是准确率，而是治理、审计和责任链是否成立。',
    confidence: '高',
    imageSource: '官网 / 产品页 / 安全页 / 官方发布稿，访问日期：2026-06-07',
    image: PLACEHOLDER('#5F8FAA', 'Eleos Health'),
    url: 'https://eleos.health',
    detail: {
      take30s:
        'Eleos Health 最值得研究的，不是“AI 写病历”，而是它把记录、合规和收入保护做成了一套机构工作流系统。',
      positioning:
        '面向行为健康和社区型照护机构的工作流型 AI 平台：覆盖记录、临床洞察、合规和收入周期管理。它的目标不是“让写 note 更轻松”这么简单，而是让机构在临床和运营两端都少出错。',
      userPain: [
        '行为健康和社区照护场景的文书要求高，且直接影响 reimbursement 和 audit。',
        '提供者在写进展笔记、补文书、追合规要求上消耗大量时间。',
        '传统 CQI 多在事后才发现问题，临床、合规和收入团队的数据常常分散。',
      ],
      coreExperienceLong:
        '提供者通过浏览器扩展或移动端在现有 EHR 工作流中使用 Eleos。系统先生成结构化 note suggestions，再把临床线索、合规要求和 payer 规则放进同一条工作流里，提前发现会影响过审、报销和质量管理的问题。它的重点不只是记录会谈，而是把“记录之后会发生什么”一起纳入系统。',
      psychMechanism: [
        '公开资料显示 Eleos 并不是做治疗建议替代，而是建立在行为健康临床工作流上。',
        '平台强调识别 CBT、DBT、MI、ACT 等 evidence-based techniques，也强调 therapeutic themes、treatment goals 和 social determinants of health。',
        '它的价值更偏 provider support，而不是直接面向患者的自主治疗建议。',
      ],
      aiRole:
        'AI 在 Eleos 中承担临床副驾和机构工作流系统的角色：记录、提炼、校验、提醒和提前阻断风险。它不直接替代专业判断，而是尽量把问题拦在更靠前的位置。',
      technical: {
        evidenceLevel: '高：官方明确披露了 Polaris AI、workflow agents、browser extension 和多项认证；具体底层服务和检索细节没有完全公开。',
        architecture: 'Eleos 更像一套高责任工作流系统：记录、合规、收入保护和机构治理被放进了同一条链路里。',
        verified: [
          'Eleos Documentation 支持环境音频捕获和短摘要输入，输出 progress note 建议，服务者需要 review / edit 后提交。',
          'Polaris AI 官方称与 Google Cloud 合作构建，并启用 Gemini family of multimodal models。',
          '官方披露通过 browser extension 嵌入 web-based EHR 工作流。',
          '官网与安全页公开 HIPAA、SOC 2 Type II、HITRUST、ISO 27001、ISO 27799、ISO 42001 等治理口径。',
        ],
        likelyPath: [
          '会谈音频或摘要输入 -> 结构化提取 -> note suggestion -> provider review -> 合规检查 -> 提交。',
          '公开口径下，它已经不只是文档工具，而是 documentation、clinical insights、compliance 和 revenue cycle 一起协作。',
          '各层之间很可能有规则、模型和权限系统共同工作，但公开资料没有完全展开。',
        ],
        risks: [
          '行为健康会谈中的停顿、隐喻和创伤叙事很容易被错误理解。',
          '一旦机构过度信任 AI 的 note 或风险提示，就会带来拒付、审计或自动化偏差风险。',
          'browser extension 降低了集成门槛，也带来页面结构、权限和审计问题。',
          '去标识化音频和高敏感临床数据仍然是治理难点。',
        ],
        openQuestions: [
          'Polaris AI 到底是在 Gemini family 之上做了多深的适配？',
          '它是否替代了旧能力，还是只负责新能力？',
          'browser extension 如何写回 EHR，审计怎么做？',
        ],
        notFacts: [
          '不能写 Eleos 只依赖某一个底层模型。',
          '不能写 Eleos 全部系统都部署在单一云上。',
          '不能写 Eleos 不存储任何相关数据，或已经彻底解决幻觉和泄露问题。',
        ],
      },
      business: '很清楚的高客单价 B2B 医疗平台路线：价值不只在提效，更在少拒付、少返工和更稳的质量管理。',
      safety:
        '在 Eleos 这里，安全治理不是附属项，而是产品本身。当 AI 开始影响流程，治理、透明度和可追责性就必须跟上。',
      inspiration: [
        '不要只盯着“让医生少写字”，要盯着“机构哪里最容易损失钱和质量”。',
        '在高监管行业，嵌入工作流往往比重做系统更现实。',
        '认证、治理和责任设计本身就是产品能力。',
      ],
      learningCard:
        'Eleos 最值得学的，不是“AI 更懂情绪”，而是“AI 更懂机构风险和工作流”。',
      sources: [
        { label: 'Eleos 官网 / 产品页 / 安全页', note: '主要用来确认 System of Action、Documentation、EHR 接入方式和治理口径。' },
        { label: '官方发布稿', note: '主要用来确认 Polaris AI、融资、认证和 agent 扩展方向。' },
        { label: '公开工程与研究叙事', note: '主要用来帮助理解它的技术方向；未公开的实现细节没有当成事实引用。' },
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
