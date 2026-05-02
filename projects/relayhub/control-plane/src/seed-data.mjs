export const seedModelEntries = [
  {
    id: "preset-qwen-max",
    name: "Qwen Max 官方",
    providerLabel: "阿里云百炼",
    kind: "domestic-model",
    source: "preset",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    modelId: "qwen-max",
    reasoningEffort: null,
    catalogFamily: "openai-compatible",
    purchaseUrl: "https://bailian.console.aliyun.com/",
    status: "preset-unconfigured",
    statusNote: "预置条目已就位，补充 API Key 后可测试连接。",
    hasStoredApiKey: false,
    maskedApiKey: null,
    lastTestedAt: null,
    lastTestResult: "idle",
    lastTestCode: "not-tested",
    lastTestMessage: "还未开始测试连接。",
    capabilities: {
      responses: {
        ok: false,
        streamOk: false
      },
      chatCompletions: {
        ok: false
      },
      lastProbedAt: null,
      lastErrorMessage: null
    },
    presetPriority: "recommended",
    recommendedTaskCategories: ["业务任务"],
    recommendedTaskIds: ["task-therapy-dialogue"],
    selectionReason: "更适合正式业务对话和边界要求更高的场景，可作为国产正式候选。",
    activationHint: "先去阿里云百炼开通并充值，再填 API Key 测试连接。",
    costTier: "高",
    capabilityTags: ["对话", "正式候选", "国产模型"],
    tags: ["国产模型", "通用对话", "正式生产候选"]
  },
  {
    id: "preset-deepseek-v3",
    name: "DeepSeek V3 官方",
    providerLabel: "DeepSeek Platform",
    kind: "domestic-model",
    source: "preset",
    baseUrl: "https://api.deepseek.com/v1",
    modelId: "deepseek-chat",
    reasoningEffort: null,
    catalogFamily: "openai-compatible",
    purchaseUrl: "https://platform.deepseek.com/",
    status: "preset-unconfigured",
    statusNote: "适合作为国产模型候选，当前尚未配置密钥。",
    hasStoredApiKey: false,
    maskedApiKey: null,
    lastTestedAt: null,
    lastTestResult: "idle",
    lastTestCode: "not-tested",
    lastTestMessage: "还未开始测试连接。",
    capabilities: {
      responses: {
        ok: false,
        streamOk: false
      },
      chatCompletions: {
        ok: false
      },
      lastProbedAt: null,
      lastErrorMessage: null
    },
    presetPriority: "recommended-first",
    recommendedTaskCategories: ["业务任务"],
    recommendedTaskIds: ["task-therapy-summary", "task-therapy-dialogue"],
    selectionReason: "当前更适合先作为国产业务候选，摘要和通用文本任务都更容易先跑通。",
    activationHint: "先在 DeepSeek Platform 充值并拿到 API Key，再完成测试连接。",
    costTier: "中",
    capabilityTags: ["摘要", "编码", "成本优先", "国产模型"],
    tags: ["国产模型", "编码", "摘要"]
  },
  {
    id: "preset-ppchat-relay",
    name: "PPChat 中转",
    providerLabel: "code.ppchat.vip",
    kind: "coding-plan",
    source: "preset",
    baseUrl: "https://code.ppchat.vip/v1",
    modelId: "gpt-5",
    reasoningEffort: "high",
    catalogFamily: "openai-compatible",
    purchaseUrl: "https://code.ppchat.vip/",
    status: "configured-pending-test",
    statusNote: "已录入示例配置，建议手动测试连接后再绑定任务。",
    hasStoredApiKey: true,
    maskedApiKey: "sk-ppc...demo",
    lastTestedAt: "2026-04-18 12:10",
    lastTestResult: "idle",
    lastTestCode: "not-tested",
    lastTestMessage: "已保存配置，建议手动测试连接后再绑定任务。",
    capabilities: {
      responses: {
        ok: false,
        streamOk: false
      },
      chatCompletions: {
        ok: true
      },
      lastProbedAt: "2026-04-18 12:10",
      lastErrorMessage: "上游可达，但尚未完成 Responses 流式探测。"
    },
    presetPriority: "recommended-first",
    recommendedTaskCategories: ["通用工具"],
    recommendedTaskIds: ["task-claude-code", "task-codex-repo"],
    selectionReason: "最适合作为通用工具和编码任务的首个激活候选，先跑通绑定路径最快。",
    activationHint: "当前已保存示例配置，先测试连接，通过后直接去任务库绑定。",
    costTier: "中",
    capabilityTags: ["编码", "长上下文", "中转 API"],
    tags: ["中转 API", "Coding Plan", "OpenAI-compatible"]
  },
  {
    id: "preset-siliconflow",
    name: "SiliconFlow 通用目录",
    providerLabel: "SiliconFlow",
    kind: "coding-plan",
    source: "preset",
    baseUrl: "https://api.siliconflow.cn/v1",
    modelId: "deepseek-ai/DeepSeek-V3",
    reasoningEffort: null,
    catalogFamily: "openai-compatible",
    purchaseUrl: "https://cloud.siliconflow.cn/",
    status: "preset-unconfigured",
    statusNote: "适合作为中转型 coding plan 候选。",
    hasStoredApiKey: false,
    maskedApiKey: null,
    lastTestedAt: null,
    lastTestResult: "idle",
    lastTestCode: "not-tested",
    lastTestMessage: "还未开始测试连接。",
    capabilities: {
      responses: {
        ok: false,
        streamOk: false
      },
      chatCompletions: {
        ok: false
      },
      lastProbedAt: null,
      lastErrorMessage: null
    },
    presetPriority: "recommended",
    recommendedTaskCategories: ["通用工具", "业务任务"],
    recommendedTaskIds: ["task-codex-repo", "task-therapy-summary"],
    selectionReason: "适合作为聚合型备用候选，便于在成本和模型类型之间做第一轮试用切换。",
    activationHint: "先去 SiliconFlow 开通并充值，再填 API Key 测试连接。",
    costTier: "低",
    capabilityTags: ["聚合目录", "成本优先", "国产模型聚合"],
    tags: ["中转 API", "国产模型聚合"]
  },
  {
    id: "preset-volcengine-doubao",
    name: "豆包 1.5 Pro 官方",
    providerLabel: "火山方舟",
    kind: "domestic-model",
    source: "preset",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    modelId: "doubao-1-5-pro-32k-250115",
    reasoningEffort: null,
    catalogFamily: "openai-compatible",
    purchaseUrl: "https://console.volcengine.com/ark",
    status: "preset-unconfigured",
    statusNote: "适合作为正式业务候选，当前尚未配置密钥。",
    hasStoredApiKey: false,
    maskedApiKey: null,
    lastTestedAt: null,
    lastTestResult: "idle",
    lastTestCode: "not-tested",
    lastTestMessage: "还未开始测试连接。",
    capabilities: {
      responses: {
        ok: false,
        streamOk: false
      },
      chatCompletions: {
        ok: false
      },
      lastProbedAt: null,
      lastErrorMessage: null
    },
    presetPriority: "recommended",
    recommendedTaskCategories: ["业务任务"],
    recommendedTaskIds: ["task-therapy-dialogue"],
    selectionReason: "适合补一条正式业务候选线，避免所有业务任务都只压在单一国产模型上。",
    activationHint: "先在火山方舟开通模型与额度，再填 API Key 测试连接。",
    costTier: "中",
    capabilityTags: ["对话", "正式候选", "国产模型"],
    tags: ["国产模型", "正式候选", "对话"]
  },
  {
    id: "preset-openrouter-coding",
    name: "OpenRouter Coding",
    providerLabel: "OpenRouter",
    kind: "coding-plan",
    source: "preset",
    baseUrl: "https://openrouter.ai/api/v1",
    modelId: "anthropic/claude-3.7-sonnet",
    reasoningEffort: null,
    catalogFamily: "openai-compatible",
    purchaseUrl: "https://openrouter.ai/",
    status: "preset-unconfigured",
    statusNote: "适合作为通用工具备用 coding plan，当前尚未配置密钥。",
    hasStoredApiKey: false,
    maskedApiKey: null,
    lastTestedAt: null,
    lastTestResult: "idle",
    lastTestCode: "not-tested",
    lastTestMessage: "还未开始测试连接。",
    capabilities: {
      responses: {
        ok: false,
        streamOk: false
      },
      chatCompletions: {
        ok: false
      },
      lastProbedAt: null,
      lastErrorMessage: null
    },
    presetPriority: "optional",
    recommendedTaskCategories: ["通用工具"],
    recommendedTaskIds: ["task-claude-code", "task-codex-repo"],
    selectionReason: "适合作为备用 coding plan，便于在通用工具任务上做手动切换。",
    activationHint: "先在 OpenRouter 充值并复制 API Key，再回来测试连接。",
    costTier: "高",
    capabilityTags: ["编码", "备用候选", "中转 API"],
    tags: ["中转 API", "Coding Plan", "备用候选"]
  },
  {
    id: "preset-aitechflux-relay",
    name: "AITechFlux 中转",
    providerLabel: "AITechFlux",
    kind: "relay-api",
    source: "preset",
    baseUrl: "https://aitechflux.com/v1",
    modelId: "claude-sonnet",
    reasoningEffort: null,
    catalogFamily: "openai-compatible",
    purchaseUrl: "https://aitechflux.com/",
    status: "preset-unconfigured",
    statusNote: "预置入口已就位，补充 API Key 后可测试连接。",
    hasStoredApiKey: false,
    maskedApiKey: null,
    lastTestedAt: null,
    lastTestResult: "idle",
    lastTestCode: "not-tested",
    lastTestMessage: "还未开始测试连接。",
    capabilities: {
      responses: {
        ok: false,
        streamOk: false
      },
      chatCompletions: {
        ok: false
      },
      lastProbedAt: null,
      lastErrorMessage: null
    },
    presetPriority: "recommended",
    recommendedTaskCategories: ["通用工具"],
    recommendedTaskIds: ["task-claude-code", "task-codex-repo"],
    selectionReason: "第三方中转入口，可复用 URL + Key，并在工具内切换默认模型。",
    activationHint: "先在 AITechFlux 开通或充值，再填 API Key 测试连接。",
    costTier: "中",
    capabilityTags: ["编码", "中转 API", "入口复用"],
    tags: ["中转 API", "第三方中转", "Claude"]
  }
];

export const seedTasks = [
  {
    id: "task-claude-code",
    name: "Claude Code Web Coding",
    category: "通用工具",
    description: "偏前端和工作区重构类任务，关注代码生成质量与稳定性。",
    builtIn: true,
    defaultModelEntryId: "preset-ppchat-relay",
    defaultModelEntryName: "PPChat 中转",
    switchNote: "需要时可切到更便宜的国产候选，但要保留人工复核。"
  },
  {
    id: "task-codex-repo",
    name: "Codex Repo Coding",
    category: "通用工具",
    description: "偏仓库级实现、测试修复和文档收口，关注长上下文和回归稳定性。",
    builtIn: true,
    defaultModelEntryId: null,
    defaultModelEntryName: null,
    switchNote: "当前还没有默认模型，先完成模型激活再绑定。"
  },
  {
    id: "task-dev-frontend",
    name: "开发前端改动",
    category: "通用工具",
    description: "偏页面结构、交互细节、样式调整与前端重构，优先关注 UI 改动质量和可直接合入性。",
    builtIn: true,
    defaultModelEntryId: "preset-aitechflux-relay",
    defaultModelEntryName: "AITechFlux 中转",
    switchNote: "默认沿用 Claude 型主路径；如果想省钱，可切到 OpenAI-compatible 入口后再人工复核。"
  },
  {
    id: "task-dev-backend",
    name: "开发后端改动",
    category: "通用工具",
    description: "偏服务端接口、数据面逻辑、脚本与运维接线，优先关注改动闭环和稳定性。",
    builtIn: true,
    defaultModelEntryId: null,
    defaultModelEntryName: null,
    switchNote: "建议优先绑定支持 Responses 的 Codex / OpenAI-compatible 入口，方便仓库级实现和回归。"
  },
  {
    id: "task-dev-test-fix",
    name: "开发测试修复",
    category: "通用工具",
    description: "偏单测修复、回归验证、fixture 收口和 QA 辅助，优先关注快速定位和稳定改动。",
    builtIn: true,
    defaultModelEntryId: null,
    defaultModelEntryName: null,
    switchNote: "通常适合绑定支持 Responses 的入口，方便连续试错和批量修复。"
  },
  {
    id: "task-dev-docs",
    name: "开发文档整理",
    category: "通用工具",
    description: "偏 spec、runbook、交付说明、知识整理与口径统一，优先关注表达清晰和上下文一致。",
    builtIn: true,
    defaultModelEntryId: "preset-aitechflux-relay",
    defaultModelEntryName: "AITechFlux 中转",
    switchNote: "默认走 Claude 型表达主路径；成本优先时可切到国产或 OpenAI-compatible 候选。"
  },
  {
    id: "task-dev-research",
    name: "开发研究总结",
    category: "通用工具",
    description: "偏方案比较、技术调研、迁移分析和决策收口，优先关注长上下文理解与总结质量。",
    builtIn: true,
    defaultModelEntryId: "preset-aitechflux-relay",
    defaultModelEntryName: "AITechFlux 中转",
    switchNote: "默认走 Claude 型总结主路径；如需结构化代码实验，可切到支持 Responses 的入口。"
  },
  {
    id: "task-therapy-dialogue",
    name: "心理疗愈对话",
    category: "业务任务",
    description: "偏正式产品对话内容，需要更高质量和更强边界控制。",
    builtIn: true,
    defaultModelEntryId: null,
    defaultModelEntryName: null,
    switchNote: "生产候选优先考虑国产模型，不直接沿用开发中转。"
  },
  {
    id: "task-therapy-summary",
    name: "心理疗愈摘要",
    category: "业务任务",
    description: "偏摘要和结构化整理，优先关注稳定性与成本效率。",
    builtIn: true,
    defaultModelEntryId: "preset-deepseek-v3",
    defaultModelEntryName: "DeepSeek V3 官方",
    switchNote: "可以在国产模型之间比较成本和摘要质量。"
  },
  {
    id: "task-aimandala-lite-report",
    name: "AI曼陀罗 Lite 报告",
    category: "业务任务",
    description: "承接 AI曼陀罗 Lite 报告生成，请求必须走国产正式候选。",
    builtIn: true,
    defaultModelEntryId: "preset-deepseek-v3",
    defaultModelEntryName: "DeepSeek V3 官方",
    switchNote: "只允许绑定国产模型，供 AI曼陀罗 Lite 报告主链路使用。"
  },
  {
    id: "task-aimandala-pro-report",
    name: "AI曼陀罗 Pro 报告",
    category: "业务任务",
    description: "承接 AI曼陀罗 Pro 报告生成，请求必须走国产正式候选。",
    builtIn: true,
    defaultModelEntryId: "preset-qwen-max",
    defaultModelEntryName: "Qwen Max 官方",
    switchNote: "只允许绑定国产模型，优先关注报告质量和边界稳定性。"
  },
  {
    id: "task-aimandala-chat",
    name: "AI曼陀罗 报告追问",
    category: "业务任务",
    description: "承接 AI曼陀罗 报告追问与对话，请求必须走国产正式候选。",
    builtIn: true,
    defaultModelEntryId: "preset-qwen-max",
    defaultModelEntryName: "Qwen Max 官方",
    switchNote: "只允许绑定国产模型，优先关注对话质量与边界控制。"
  },
  {
    id: "task-aimandala-vision",
    name: "AI曼陀罗 三圈识别",
    category: "业务任务",
    description: "承接 AI曼陀罗 图片识别与视觉链路，请求必须走国产正式候选。",
    builtIn: true,
    defaultModelEntryId: "preset-volcengine-doubao",
    defaultModelEntryName: "豆包 1.5 Pro 官方",
    switchNote: "只允许绑定国产模型，优先关注视觉识别稳定性。"
  }
];

export const seedEntries = [
  {
    id: "entry-claude-ide-local",
    name: "Claude IDE Local",
    clientFamily: "claude",
    adapterType: null,
    hostType: "mac",
    protocolFamily: "anthropic-messages",
    controllable: true,
    description: "本地 Mac 上通过 IDE 使用 Claude 的主入口。",
    alias: "relayhub-entry-claude-ide-local",
    notes: ["主入口", "可被 RelayHub 接管"]
  },
  {
    id: "entry-codex-ide-local",
    name: "Codex IDE Local",
    clientFamily: "codex",
    adapterType: null,
    hostType: "mac",
    protocolFamily: "openai-responses",
    controllable: true,
    description: "本地 Mac 上通过 IDE 使用 Codex 的主入口。",
    alias: "relayhub-entry-codex-ide-local",
    notes: ["主入口", "可被 RelayHub 接管"]
  },
  {
    id: "entry-claude-mobile-observe",
    name: "Claude Mobile Observe",
    clientFamily: "claude",
    adapterType: null,
    hostType: "external-observe",
    protocolFamily: "observe-only",
    controllable: false,
    description: "Claude 手机 app 官方入口，只做观测和决策，不做中转接管。",
    alias: null,
    notes: ["观测入口", "不可控"]
  },
  {
    id: "entry-paperclip-claude-local-mac",
    name: "Paperclip claude_local Mac",
    clientFamily: "paperclip",
    adapterType: "claude_local",
    hostType: "mac",
    protocolFamily: "anthropic-messages",
    controllable: true,
    description: "Paperclip 在本地 Mac 上运行的 claude_local 入口。",
    alias: "relayhub-entry-paperclip-claude-local-mac",
    notes: ["本地执行器", "ANTHROPIC_* 同步目标"]
  },
  {
    id: "entry-paperclip-claude-local-server",
    name: "Paperclip claude_local Server",
    clientFamily: "paperclip",
    adapterType: "claude_local",
    hostType: "server",
    protocolFamily: "anthropic-messages",
    controllable: true,
    description: "Paperclip 在服务器上运行的 claude_local 入口。",
    alias: "relayhub-entry-paperclip-claude-local-server",
    notes: ["服务器执行", "ANTHROPIC_* 同步目标"]
  },
  {
    id: "entry-paperclip-codex-local-mac",
    name: "Paperclip codex_local Mac",
    clientFamily: "paperclip",
    adapterType: "codex_local",
    hostType: "mac",
    protocolFamily: "openai-responses",
    controllable: true,
    description: "Paperclip 在本地 Mac 上运行的 codex_local 入口。",
    alias: "relayhub-entry-paperclip-codex-local-mac",
    notes: ["本地执行器", "Codex provider 同步目标"]
  },
  {
    id: "entry-paperclip-codex-local-server",
    name: "Paperclip codex_local Server",
    clientFamily: "paperclip",
    adapterType: "codex_local",
    hostType: "server",
    protocolFamily: "openai-responses",
    controllable: true,
    description: "Paperclip 在服务器上运行的 codex_local 入口。",
    alias: "relayhub-entry-paperclip-codex-local-server",
    notes: ["服务器执行", "Codex provider 同步目标"]
  },
  {
    id: "entry-paperclip-pi-local-mac",
    name: "Paperclip pi_local Mac",
    clientFamily: "paperclip",
    adapterType: "pi_local",
    hostType: "mac",
    protocolFamily: "openai-chat-completions",
    controllable: true,
    description: "Paperclip 在本地 Mac 上运行的 pi_local 入口。",
    alias: "relayhub-entry-paperclip-pi-local-mac",
    notes: ["本地执行器", "provider config 同步目标"]
  },
  {
    id: "entry-paperclip-pi-local-server",
    name: "Paperclip pi_local Server",
    clientFamily: "paperclip",
    adapterType: "pi_local",
    hostType: "server",
    protocolFamily: "openai-chat-completions",
    controllable: true,
    description: "Paperclip 在服务器上运行的 pi_local 入口。",
    alias: "relayhub-entry-paperclip-pi-local-server",
    notes: ["服务器执行", "provider config 同步目标"]
  },
  {
    id: "entry-paperclip-hermes-local-server",
    name: "Paperclip hermes_local Server",
    clientFamily: "paperclip",
    adapterType: "hermes_local",
    hostType: "server",
    protocolFamily: "openai-chat-completions",
    controllable: true,
    description: "Paperclip 在服务器容器中运行的 hermes_local 入口。",
    alias: "relayhub-entry-paperclip-hermes-local-server",
    notes: ["仅服务器", "OPENAI_* 同步目标"]
  }
];

export const seedEntryBindings = [
  {
    entryId: "entry-claude-ide-local",
    defaultModelEntryId: "preset-aitechflux-relay",
    fallbackModelEntryId: "preset-openrouter-coding",
    statusNote: "本地 Claude IDE 默认走 Anthropic 兼容入口。"
  },
  {
    entryId: "entry-codex-ide-local",
    defaultModelEntryId: "preset-ppchat-relay",
    fallbackModelEntryId: "preset-siliconflow",
    statusNote: "本地 Codex IDE 默认走 Responses 兼容入口。"
  },
  {
    entryId: "entry-claude-mobile-observe",
    defaultModelEntryId: null,
    fallbackModelEntryId: null,
    statusNote: "只做观测，不参与中转接管。"
  },
  {
    entryId: "entry-paperclip-claude-local-mac",
    defaultModelEntryId: "preset-aitechflux-relay",
    fallbackModelEntryId: "preset-openrouter-coding",
    statusNote: "本地 claude_local 跟随本地 Anthropic 兼容入口。"
  },
  {
    entryId: "entry-paperclip-claude-local-server",
    defaultModelEntryId: "preset-aitechflux-relay",
    fallbackModelEntryId: "preset-openrouter-coding",
    statusNote: "服务器 claude_local 跟随服务器 Anthropic 兼容入口。"
  },
  {
    entryId: "entry-paperclip-codex-local-mac",
    defaultModelEntryId: "preset-ppchat-relay",
    fallbackModelEntryId: "preset-siliconflow",
    statusNote: "本地 codex_local 跟随本地 Responses 兼容入口。"
  },
  {
    entryId: "entry-paperclip-codex-local-server",
    defaultModelEntryId: "preset-ppchat-relay",
    fallbackModelEntryId: "preset-siliconflow",
    statusNote: "服务器 codex_local 跟随服务器 Responses 兼容入口。"
  },
  {
    entryId: "entry-paperclip-pi-local-mac",
    defaultModelEntryId: "preset-deepseek-v3",
    fallbackModelEntryId: "preset-volcengine-doubao",
    statusNote: "本地 pi_local 以 provider 配置方式跟随入口绑定。"
  },
  {
    entryId: "entry-paperclip-pi-local-server",
    defaultModelEntryId: "preset-deepseek-v3",
    fallbackModelEntryId: "preset-volcengine-doubao",
    statusNote: "服务器 pi_local 以 provider 配置方式跟随入口绑定。"
  },
  {
    entryId: "entry-paperclip-hermes-local-server",
    defaultModelEntryId: "preset-deepseek-v3",
    fallbackModelEntryId: "preset-volcengine-doubao",
    statusNote: "服务器 hermes_local 通过 OPENAI_* 跟随入口绑定。"
  }
];

export const seedRuns = [
  {
    id: "run-001",
    taskId: "task-claude-code",
    taskName: "Claude Code Web Coding",
    modelEntryId: "preset-ppchat-relay",
    modelEntryName: "PPChat 中转",
    ranAt: "2026-04-18 11:20",
    summary: "成功完成路由和文案收口，生成代码可直接合入。",
    resultGrade: "优秀",
    costCny: 3.2,
    latencyMs: 1180,
    note: "适合 UI 和文档同步类任务。"
  },
  {
    id: "run-002",
    taskId: "task-claude-code",
    taskName: "Claude Code Web Coding",
    modelEntryId: "preset-deepseek-v3",
    modelEntryName: "DeepSeek V3 官方",
    ranAt: "2026-04-18 11:58",
    summary: "实现速度快，但复杂页面结构需要更多手动修正。",
    resultGrade: "可用",
    costCny: 1.4,
    latencyMs: 980,
    note: "成本更低，但复杂交互还不稳定。"
  },
  {
    id: "run-003",
    taskId: "task-therapy-summary",
    taskName: "心理疗愈摘要",
    modelEntryId: "preset-deepseek-v3",
    modelEntryName: "DeepSeek V3 官方",
    ranAt: "2026-04-18 12:06",
    summary: "摘要结构完整，可直接进入人工复核。",
    resultGrade: "优秀",
    costCny: 0.8,
    latencyMs: 740,
    note: "当前是最稳的国产摘要候选。"
  }
];
