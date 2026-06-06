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
    oneLiner: 'Slingshot AI 旗下的 AI 心理伴侣产品，以"mental health research lab + psychology foundation model"为对外叙事。',
    coreExperience: '以 Ash 为消费者入口，构建一个面向心理健康场景的对话式陪伴体验。',
    worthLearning: '垂直领域基础模型 + 研究实验室定位，是 AI 心理赛道少见的"模型层 + 产品层"打包叙事。',
    risk: '融资金额、训练数据来源、临床效果数字均需继续核验，不要直接当作已证事实引用。',
    confidence: '高',
    imageSource: '产品官网 / App Store / 官方社交分享图，访问日期：2026-06-04',
    image: PLACEHOLDER('#6A9B8A', 'Ash'),
    url: 'https://ash.com',
    detail: {
      take30s:
        'Ash 是 Slingshot AI 推向消费者的 AI 心理伴侣产品。Slingshot AI 对外把自己讲成 "mental health research lab + psychology foundation model"——这是这家公司最值得创业者关注的叙事姿态。',
      positioning:
        '面向健康人群日常情绪陪伴的对话式 AI 产品，Ash 作为消费者端入口，背后是 Slingshot AI 主张的"垂直心理基础模型 + 研究实验室"组合。',
      userPain: [
        '情绪起伏时缺少一个低压、随时可用的倾诉对象。',
        '通用聊天机器人对情绪话题的处理常常滑向建议或娱乐化，缺乏稳定的关怀语气。',
        '专业心理咨询门槛与成本高，多数人需要更轻的、长期可用的中间形态。',
      ],
      coreExperienceLong:
        'Ash 的产品形态以对话式陪伴为主。具体回应节奏、语音/文字模态比重，以及它声称使用的"垂直心理基础模型"对体验的真实增益，目前仍需在产品上手与公开技术资料中继续核验。',
      psychMechanism: [
        '公司对外强调"psychology foundation model"，但模型的训练数据来源、专家参与方式、是否经过独立临床评估，均需继续核验。',
        '避免在没有官方证据的前提下，套用某一具体疗法（如 CBT / 反映式倾听）作为它的机制描述。',
      ],
      aiRole:
        'AI 在 Ash 中承担陪伴与对话的主体角色。具体能力边界、是否对高风险话题做主动降级，需继续观察。',
      technical: {
        evidenceLevel: 'A/B/C 混合：官方披露心理学基础模型、三阶段训练、长期记忆、语音/文字交互与双层安全系统；底层模型、RAG、向量库和云厂商未公开。',
        architecture: '聊天陪伴型 + 垂直心理模型叙事。公开资料显示它更像“垂直领域模型 + 产品化对话系统”，而非普通聊天应用。',
        verified: [
          '官方使用 psychology foundation model、behavioral health data、clinical fine-tuning、reinforcement learning 等表述。',
          '官方披露支持文字与语音交互，并强调跨会话记忆和模式识别。',
          '官方披露 layered / dual-layered safety system，并发布过自杀 / 自伤相关安全研究预印本。',
        ],
        likelyPath: [
          '文字 / 语音输入 -> 意图与风险分类 -> 用户历史记忆召回 -> 主对话生成 -> 双层安全审查 -> 文本 / 语音输出。',
          '长期记忆可能由结构化摘要、语义检索、用户状态或画像共同支撑，但公开资料没有确认具体方案。',
          '周报和模式洞察可能由后台异步任务聚合一段时间内的对话生成。',
        ],
        risks: [
          '长期记忆越强，误记、错误模式归因和依赖风险越高。',
          '产品叙事靠近 therapy，但法律条款声明不提供医疗建议、诊断或治疗，用户理解边界需要持续观察。',
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
      business: '面向 C 端的订阅模式细节、企业 / 机构合作路径，以及背后 Slingshot AI 的融资与商业化策略，均需继续核验。',
      safety:
        '在自伤、伤人、急性危机等高风险表述下，是否有稳定可审计的降级与转介机制，是这一品类共同的考验，Ash 的具体策略需继续观察。',
      inspiration: [
        '在通用模型主导的时代，把"心理"做成一个完整的模型层 + 产品层叙事，是少见但有结构性意义的姿态。',
        '"研究实验室 + 产品入口"的双层叙事，是值得创业者借鉴的品牌结构。',
        '在 AI 心理赛道，克制的能力边界往往比聪明的回答更值钱。',
      ],
      learningCard:
        '在心理这种高敏感领域，"基础模型 + 产品入口"双层叙事，正在成为一种新的创业姿态。',
      sources: [
        { label: 'Slingshot AI / Ash 官网', note: '公司定位与产品描述，2026-06-04 访问' },
        { label: '公开融资报道', note: '融资金额与时间需以多源交叉核验为准' },
      ],
    },
  },
  {
    slug: 'rosebud',
    name: 'Rosebud',
    track: 'AI 日记与自我探索',
    oneLiner: 'AI journaling app：用户写下或说出想法，AI 帮助 discover patterns 并给出 personalized reflection prompts。',
    coreExperience: '写 / 说想法 → AI 基于内容追问 → 周期性归纳模式 → 提供个性化反思引导。',
    worthLearning: '用"提问 + 反思引导"承担 AI 的价值，明确避开"治疗师"叙事，回到自我书写本身。',
    risk: '长期记忆要转化成洞察与行动，否则只是数据沉淀；复购与留存数据仍需继续核验。',
    confidence: '高',
    imageSource: '产品官网 / App Store / 官方社交分享图，访问日期：2026-06-04',
    image: PLACEHOLDER('#6F93B7', 'Rosebud'),
    url: 'https://rosebud.app',
    detail: {
      take30s:
        'Rosebud 把自己定义成 AI journaling app：写或说想法，AI 帮助识别 patterns，并基于内容生成 personalized reflection prompts。它克制地停在"自我反思"这一边，而不是滑向"治疗"。',
      positioning:
        '面向有自我反思习惯的用户，把"写日记"从空白页变成有 AI 在旁追问与归纳的结构化练习。明确不以"治疗"或"治疗师"叙事自居。',
      userPain: [
        '空白日记本前不知道写什么，缺少结构化的入口。',
        '写了很多但缺少回顾，看不到自己反复出现的模式。',
        '希望被"问出"洞察，而不是被推送"建议"。',
      ],
      coreExperienceLong:
        '用户写或说出当下的想法，Rosebud 基于内容给出 personalized reflection prompts，并周期性归纳 patterns。具体提问密度、回顾频率与长期上下文使用方式，请以官方表述与实际体验为准。',
      psychMechanism: [
        '产品语言围绕 reflection prompts 与 pattern discovery，而不是直接套用某一具体疗法。',
        '具体引用的心理学方法（如 expressive writing、CBT 提问等）以官方说明为准，需继续核验。',
      ],
      aiRole:
        'AI 承担"耐心的提问者 + 模式归纳者"角色，不下判断、不给治疗性建议。',
      technical: {
        evidenceLevel: 'A/B/C 混合：官方披露 AI analysis、long-term memory、Learned Preferences、Persona、语音日记、图片/手写输入、Firestore 与 OpenAI / Anthropic / Groq 处理链路；RAG 和向量库未确认。',
        architecture: 'AI 日记 + 长期记忆 + 个性化反思。它围绕日记条目、长期记忆、偏好学习、Persona 和周期性洞察形成自我反思系统。',
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
      business: '面向 C 端订阅；具体定价档位、企业 / 团队版形态以官方页面为准。',
      safety:
        '长期日记数据极度敏感，加密、可导出、可删除是基础。明确告知用户它不是治疗工具，是产品诚意的体现。',
      inspiration: [
        '把价值押在"问得好"而不是"答得多"，是 AI 时代被严重低估的产品姿态。',
        '长期反思类产品最大的挑战，是让记忆真的转化成洞察与行为，而不只是数据沉淀。',
        '在心理相关产品里，明确"我不是治疗"反而能换来更稳定的信任。',
      ],
      learningCard:
        '日记类 AI 的长期价值，取决于记忆能不能持续被翻译成对用户有用的洞察。',
      sources: [
        { label: 'Rosebud 官网', note: '产品定位、功能与隐私说明，2026-06-04 访问' },
        { label: 'App Store 评价', note: '长期用户反馈样本，需要持续抽样核验' },
      ],
    },
  },
  {
    slug: 'rocky-ai',
    name: 'Rocky.ai',
    track: 'AI 教练与个人成长',
    oneLiner: 'AI coaching platform，对外覆盖 employees、students、organizations 与 coaches 四类用户。',
    coreExperience: '面向个人与组织的对话式 AI 教练，提供白标平台、组织场景应用，以及教练角色扮演训练等模块。',
    worthLearning: '把教练方法论产品化 + 白标分发给企业和教练机构，是 AI 教练赛道少见的多边商业结构。',
    risk: 'B2B 销售周期、客户成功体系、企业数据边界都是真实门槛；它声称覆盖的具体方法论（如 GROW、SMART、ICF 等）以官方表述为准，不要直接当作已证细节。',
    confidence: '高',
    imageSource: '产品官网 / 官方社交分享图，访问日期：2026-06-04',
    image: PLACEHOLDER('#D6A66A', 'Rocky.ai'),
    url: 'https://rocky.ai',
    detail: {
      take30s:
        'Rocky.ai 把自己定位为 AI coaching platform，对外列出的目标用户是 employees、students、organizations 与 coaches——这意味着它一边做产品，一边做教练行业的基础设施。',
      positioning:
        '面向个人成长、教育、组织发展与教练机构的 AI 教练平台，强调白标分发能力与组织场景的接入。',
      userPain: [
        '个人层面：希望被"问出"目标推进的结构，但请人类教练成本高。',
        '组织层面：企业希望规模化提供成长支持，但人类教练资源稀缺。',
        '教练个人：需要可以白标承接客户对话与练习的工具基础设施。',
      ],
      coreExperienceLong:
        '产品提供面向个人的对话式 AI 教练，以及面向组织 / 教练的白标平台与角色扮演训练等模块。具体的对话脚本、教练框架引用方式，以官方公开材料为准。',
      psychMechanism: [
        '产品语言围绕"教练对话"与"目标推进"，可能与教练领域的常见方法论相关（如 GROW、SMART 等结构化提问与目标设定框架），具体引用方式以官方表述为准。',
        '不应在没有官方说明的前提下，套用具体的 ICF / GROW / SMART 实施细节作为已证事实。',
      ],
      aiRole:
        'AI 在 Rocky.ai 中承担"结构化提问者 + 进度追踪者 + 角色扮演伙伴"。它的稳定性比"聪明"更重要。',
      technical: {
        evidenceLevel: 'A/B/C 混合：官方披露 Knowledge-Driven AI Architecture、RAG、modular AI agents、AMGS、Google Cloud Frankfurt，以及 OpenAI / Gemini / Claude 微服务；底层 RAG 与 agent runtime 细节未公开。',
        architecture: 'AI 教练平台 + RAG + 模块化 agent + 白标工作流。它更像企业 / 教练方法论封装平台，而非单一聊天机器人。',
        verified: [
          '帮助中心明确提出 Knowledge-Driven AI Architecture 和 RAG，用于定制和扩展 coaching content。',
          '官方披露 modular AI agents、Quest 级 Agent 配置、预设 Coach / Role-play / Tutor 等 Agent 类型。',
          '官方披露 Automated Memory and Goal Generation System，会把用户对话和洞察解析成个性化知识片段和可追踪目标。',
          '官方称核心系统 proprietary，同时会把 OpenAI ChatGPT、Google Gemini、Anthropic Claude 作为 LLM micro-services 用于文本摘要和分析。',
        ],
        likelyPath: [
          '组织 / 教练上传内容 -> Program / Quest / Content / Bot Questions 结构化 -> RAG 检索 -> Quest 级 Agent 配置 -> 对话编排 -> 目标 / 记忆生成 -> 角色扮演 / 反馈 / 进度跟踪。',
          'RAG 可能由内容索引、metadata filtering、role / group targeting 组成。',
          'Role-play 可能由场景脚本、对话 Agent、评分规则和即时反馈组合支撑。',
        ],
        risks: [
          'proprietary AI models 与外部 LLM micro-services 的边界不透明。',
          'multi-agent 的营销表达和真实工程复杂度可能存在差距。',
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
      business: '同时存在面向 C 端的订阅与面向 B 端（企业、教育机构、教练业务）的白标 / 合作模式；定价细节与合同结构以官方为准。',
      safety:
        '必须显式区分"coaching"与"therapy"。在用户出现心理疾病线索时，应有清晰的转介路径而不是继续 coaching。',
      inspiration: [
        '把教练方法论产品化 + 白标分发，是 AI 教练赛道少见的多边业务结构。',
        '"覆盖 employees / students / organizations / coaches"本身就是一种产品野心的表达。',
        '在 B2B 与 B2B2C 上，客户成功体系比模型选型更决定生死。',
      ],
      learningCard:
        'AI 教练的商业差异，可能不只在模型，也在"谁帮你把它分发到组织里"。',
      sources: [
        { label: 'Rocky.ai 官网', note: '产品介绍、目标用户与企业 / 白标页面，2026-06-04 访问' },
        { label: '行业公开报道', note: '商业模式与客户结构以多源交叉核验为准' },
      ],
    },
  },
  {
    slug: 'eleos-health',
    name: 'Eleos Health',
    track: '临床与机构工作流',
    oneLiner: '面向 community-based care 机构的 AI system of action，帮助临床团队减少文书、提升合规与质量管理。',
    coreExperience: '在机构临床工作流内运行的 AI 系统，覆盖会话相关文档、临床要点抽取与质量改进信号。',
    worthLearning: '在被严格监管的领域切入临床文档、合规与机构工作流，是 AI 在专业服务行业的稳健姿态。',
    risk: '医疗合规、EHR 系统集成、临床责任划分都是高门槛；具体客户数、覆盖机构与临床效果数字均需继续核验。',
    confidence: '高',
    imageSource: '产品官网 / 公开案例素材，访问日期：2026-06-04',
    image: PLACEHOLDER('#5F8FAA', 'Eleos Health'),
    url: 'https://eleos.health',
    detail: {
      take30s:
        'Eleos Health 把自己讲成面向 community-based care 机构的 AI system of action——AI 的位置不是治疗师，而是嵌在临床团队工作流里的合规与质量副驾。',
      positioning:
        '面向行为健康 / 心理健康机构的临床工作流 AI：覆盖文档、质量改进、合规与组织管理相关的临床数据流。',
      userPain: [
        '临床团队大量时间被消耗在文档与合规要求上，行业职业倦怠突出。',
        '机构层面缺少对临床质量和过程的客观、可观测信号。',
        '督导与质量改进高度依赖人工抽样，难以规模化。',
      ],
      coreExperienceLong:
        '在机构的临床工作流中部署 AI，辅助会话相关文档与质量管理流程；具体功能模块、部署形态与对接的 EHR 系统，请以官方公开材料为准。',
      psychMechanism: [
        '产品语言对应循证治疗框架与治疗质量管理思路（如 fidelity、outcome measurement 等），具体引用方式以官方为准。',
        '不在没有官方说明的前提下，断言它对某一种疗法的覆盖深度。',
      ],
      aiRole:
        'AI 严格定位在"非治疗性工作"——文档、合规、督导素材整理。AI 不替代治疗师与来访之间的临床关系。',
      technical: {
        evidenceLevel: 'A/B/C 混合：官方披露 Polaris AI、Google Cloud multimodal model family、行为健康真实会话数据、浏览器扩展嵌入 EHR、合规认证与安全页；工程博客披露过 RAG / VectorDB 和 lakehouse 实践。',
        architecture: '临床机构工作流 AI + Polaris AI + EHR 嵌入 + 合规治理。AI 的位置在机构工作流里，覆盖记录、合规、质量、收入周期和临床洞察。',
        verified: [
          'Eleos Documentation 支持实时环境音频捕获和简短文本摘要输入，输出 progress note 建议，服务者需要 review / edit 后提交。',
          'Polaris AI 官方称由 Google Cloud multimodal model family 启用，并结合 Eleos 自有行为健康真实会话数据集。',
          '官方披露通过 browser extension 嵌入 web-based EHR 工作流。',
          '安全页公开 HIPAA compliant、SOC 2 Type II、HITRUST、ISO 27001、ISO 27799、ISO 42001 等安全与合规口径。',
          '工程博客披露过 RAG + VectorDB：de-identified notes、Pinecone serverless、按 healthcare organization 建 namespace 隔离。',
        ],
        likelyPath: [
          '临床会话音频 / 文本摘要 / EHR 上下文 -> ASR 或多模态音频理解 -> 临床要点抽取 -> note 建议生成 -> 合规模板 / 规则校验 -> 治疗师 review / edit -> 浏览器扩展写入 EHR。',
          'Clinical Insights Agent 可能使用 client journey、历史 note、治疗目标、指南和研究资料做检索增强。',
          'AWS 与 Google Cloud 可能形成混合架构，但这只是对公开资料差异的合理解释。',
        ],
        risks: [
          '行为健康会话中的停顿、语气、隐喻、创伤叙事和多参与者对话容易被错误理解。',
          'note 生成若遗漏 intervention、client response、progress、action plan、Golden Thread 等要素，可能带来拒付和审计风险。',
          'browser extension 降低集成门槛，也会面对 EHR 页面结构变化、权限、浏览器环境和可审计性问题。',
          'RAG / VectorDB 与 de-identified notes 能提升个性化，也带来跨客户隔离、PHI 去标识化充分性、embedding 泄露和误召回风险。',
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
      business: '面向行为健康机构的 B2B SaaS / 合作模式；具体定价、合同结构与客户规模需继续核验。',
      safety:
        'HIPAA / SOC2 等合规是入场券；录音、转写、AI 提取的责任划分必须在合同与产品流程中显式约定。',
      inspiration: [
        '在被严格监管的专业服务行业里，"AI 不替代专业人员"比"AI 替代专业人员"更容易跑通商业。',
        '从文档 / 合规 / 质量管理切入临床，比从"AI 直接面对患者"风险更低、更可持续。',
        '机构买单的关键往往是合规与质量改进，而不是效率本身。',
      ],
      learningCard:
        '在受监管行业，AI 最值得的位置是"副驾"——但必须是机构和合规都信得过的副驾。',
      sources: [
        { label: 'Eleos Health 官网', note: '产品定位与公开案例素材，2026-06-04 访问' },
        { label: '公开媒体与行业报道', note: '客户类型、规模、临床效果数字需多源交叉核验' },
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
