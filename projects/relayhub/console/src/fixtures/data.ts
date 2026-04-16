export type HealthState = "healthy" | "degraded" | "risk" | "idle";
export type ProviderKind = "第三方中转" | "国产模型" | "免费国外 API";
export type TransparencyState = "完整" | "部分缺失" | "暂无";

export interface MetricsSnapshot {
  requests: number;
  tokens: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
  cost: number;
}

export interface RunRecord {
  id: string;
  name: string;
  type: string;
  status: HealthState;
  startedAt: string;
  environment: string;
}

export interface RouteRecord {
  taskType: string;
  model: string;
  provider: string;
  note: string;
}

export interface EnvironmentRecord {
  id: string;
  name: string;
  mode: string;
  purpose: string;
  providerScope: string;
  status: HealthState;
  providerCount: number;
  requests24h: number;
  successRate: number;
  recentStatus: string;
  targetNote: string;
  recommendation: string;
  policySummary: string[];
  routes: RouteRecord[];
  metrics: MetricsSnapshot;
  runs: RunRecord[];
}

export interface ProviderRecord {
  id: string;
  name: string;
  kind: ProviderKind;
  availableEnvironments: string[];
  health: HealthState;
  transparency: TransparencyState;
  errorRate: number;
  p95Latency: number;
  description: string;
  recommendation: string;
  recommendationNote: string;
  models: Array<{ name: string; useCase: string }>;
  metrics: MetricsSnapshot | null;
}

const dashboardMetrics: MetricsSnapshot = {
  requests: 18436,
  tokens: 6248000,
  avgLatency: 1180,
  p95Latency: 2640,
  errorRate: 2.1,
  cost: 1830,
};

export const environments: EnvironmentRecord[] = [
  {
    id: "dev-relay",
    name: "开发版",
    mode: "dev-relay",
    purpose: "服务 Claude Code / Codex，比较第三方中转、国产模型与少量免费国外 API。",
    providerScope: "允许第三方中转、国产模型与少量免费国外 API。",
    status: "healthy",
    providerCount: 6,
    requests24h: 12640,
    successRate: 96.8,
    recentStatus: "主用编码代理链路稳定，推荐结论已生成。",
    targetNote: "优先服务真实编码代理任务，不服务产品生产流量。",
    recommendation: "当前建议将「星河中转 A」作为 Claude Code 主用上游，DeepSeek Direct 作为低成本备选。",
    policySummary: [
      "允许第三方中转参与开发工作流比较。",
      "观察重点是流式稳定性、usage 透明度和续费价值。",
      "不把开发版 provider 白名单直接复用于生产。",
    ],
    routes: [
      {
        taskType: "Claude Code 主链路",
        model: "claude-sonnet-compatible",
        provider: "星河中转 A",
        note: "主用上游，流式稳定。",
      },
      {
        taskType: "Codex 辅助编码",
        model: "deepseek-coder",
        provider: "DeepSeek Direct",
        note: "低成本补位。",
      },
      {
        taskType: "试验性验证",
        model: "gpt-oss-free",
        provider: "Freebridge Sandbox",
        note: "仅用于非关键测试。",
      },
    ],
    metrics: {
      requests: 12640,
      tokens: 4821000,
      avgLatency: 980,
      p95Latency: 2120,
      errorRate: 3.2,
      cost: 1260,
    },
    runs: [
      {
        id: "run-dev-1",
        name: "Claude Code 稳定性对比",
        type: "benchmark",
        status: "healthy",
        startedAt: "今天 09:10",
        environment: "开发版",
      },
      {
        id: "run-dev-2",
        name: "中转透明度巡检",
        type: "health-check",
        status: "degraded",
        startedAt: "今天 11:40",
        environment: "开发版",
      },
    ],
  },
  {
    id: "prod-aimandala",
    name: "心理疗愈生产版",
    mode: "prod-relay/aimandala",
    purpose: "服务心理疗愈业务生产流量，强调国产模型白名单、隐私边界与任务级治理。",
    providerScope: "只允许国产模型，不允许第三方中转进入用户数据主链路。",
    status: "risk",
    providerCount: 2,
    requests24h: 4890,
    successRate: 99.2,
    recentStatus: "运行稳定，但存在配置草稿越界风险提示。",
    targetNote: "重点是边界确认、风险识别和任务级国产替代建议。",
    recommendation: "摘要任务建议优先切到 Qwen Enterprise 摘要池，预计降本 38%。",
    policySummary: [
      "当前生产版只允许国产模型。",
      "不默认记录用户正文，不把 prompt / response 自动发送到日志平台。",
      "开发版观测策略不能直接复用于生产。",
    ],
    routes: [
      {
        taskType: "主对话",
        model: "deepseek-chat-pro",
        provider: "DeepSeek Direct",
        note: "高质量主链路。",
      },
      {
        taskType: "摘要",
        model: "qwen-summary",
        provider: "Qwen Enterprise",
        note: "低成本国产替代。",
      },
      {
        taskType: "标签分类",
        model: "qwen-lite",
        provider: "Qwen Enterprise",
        note: "结构化低成本任务。",
      },
    ],
    metrics: {
      requests: 4890,
      tokens: 1213000,
      avgLatency: 1480,
      p95Latency: 3010,
      errorRate: 0.8,
      cost: 410,
    },
    runs: [],
  },
  {
    id: "eval-sidecar",
    name: "评测版",
    mode: "eval-sidecar",
    purpose: "承接旁路 benchmark、日报、探活和推荐结论，不与生产 API 主链路强耦合。",
    providerScope: "聚合匿名化指标，观察开发版与生产版的对比结果。",
    status: "degraded",
    providerCount: 4,
    requests24h: 906,
    successRate: 92.4,
    recentStatus: "日报已生成，周度比较任务仍在补齐。",
    targetNote: "让评分板、比较结果和建议可以独立浏览。",
    recommendation: "已生成中转续费建议与国产替代建议，但周报 feed 仍为空态。",
    policySummary: [
      "sidecar 故障不应阻断主 Relay 正常存在。",
      "只汇总匿名化指标，不承接生产主请求。",
      "benchmark、探活和日报职责与主 API 进程隔离。",
    ],
    routes: [
      {
        taskType: "中转站对比",
        model: "claude-sonnet-compatible",
        provider: "星河中转 A / Atlas Relay",
        note: "比较流式稳定性与透明度。",
      },
      {
        taskType: "摘要替代评测",
        model: "qwen-summary / deepseek-chat-pro",
        provider: "Qwen Enterprise / DeepSeek Direct",
        note: "评估成本与质量平衡。",
      },
    ],
    metrics: {
      requests: 906,
      tokens: 214000,
      avgLatency: 1730,
      p95Latency: 3370,
      errorRate: 6.5,
      cost: 160,
    },
    runs: [
      {
        id: "run-eval-1",
        name: "开发版中转续费日报",
        type: "report",
        status: "healthy",
        startedAt: "今天 07:30",
        environment: "评测版",
      },
      {
        id: "run-eval-2",
        name: "国产替代周报",
        type: "report",
        status: "idle",
        startedAt: "暂无数据",
        environment: "评测版",
      },
      {
        id: "run-eval-3",
        name: "Qwen 摘要任务对比",
        type: "comparison",
        status: "risk",
        startedAt: "今天 10:00",
        environment: "评测版",
      },
    ],
  },
];

export const providers: ProviderRecord[] = [
  {
    id: "xinghe-relay-a",
    name: "星河中转 A",
    kind: "第三方中转",
    availableEnvironments: ["开发版", "评测版"],
    health: "healthy",
    transparency: "部分缺失",
    errorRate: 1.9,
    p95Latency: 1860,
    description: "开发版当前主用中转，流式体验稳定，但 usage 透明度仍有缺口。",
    recommendation: "适合作为 Claude Code 主用",
    recommendationNote: "流式完整性与响应稳定性最佳，但 token 明细偶有缺失。",
    models: [
      { name: "claude-sonnet-compatible", useCase: "Claude Code 主链路" },
      { name: "gpt-4-compatible", useCase: "备用调试任务" },
    ],
    metrics: {
      requests: 6010,
      tokens: 2360000,
      avgLatency: 920,
      p95Latency: 1860,
      errorRate: 1.9,
      cost: 720,
    },
  },
  {
    id: "atlas-relay",
    name: "Atlas Relay",
    kind: "第三方中转",
    availableEnvironments: ["开发版", "评测版"],
    health: "risk",
    transparency: "完整",
    errorRate: 8.7,
    p95Latency: 3490,
    description: "透明度较好，但最近 24 小时错误率偏高，流式中断频繁。",
    recommendation: "不建议作为当前主用",
    recommendationNote: "建议仅保留在对比任务里，不进入关键编码代理主链路。",
    models: [
      { name: "claude-sonnet-compatible", useCase: "中转对比" },
      { name: "gpt-4-compatible", useCase: "备用验证" },
    ],
    metrics: {
      requests: 2200,
      tokens: 1020000,
      avgLatency: 1680,
      p95Latency: 3490,
      errorRate: 8.7,
      cost: 380,
    },
  },
  {
    id: "deepseek-direct",
    name: "DeepSeek Direct",
    kind: "国产模型",
    availableEnvironments: ["开发版", "心理疗愈生产版", "评测版"],
    health: "healthy",
    transparency: "完整",
    errorRate: 1.2,
    p95Latency: 2220,
    description: "国产主力 provider，同时服务开发版对比与生产版主对话链路。",
    recommendation: "适合作为高质量国产主链路",
    recommendationNote: "在主对话和结构化提取任务上稳定，是生产版首选之一。",
    models: [
      { name: "deepseek-chat-pro", useCase: "生产版主对话" },
      { name: "deepseek-coder", useCase: "开发版低成本编码补位" },
    ],
    metrics: {
      requests: 5380,
      tokens: 1760000,
      avgLatency: 1190,
      p95Latency: 2220,
      errorRate: 1.2,
      cost: 470,
    },
  },
  {
    id: "qwen-enterprise",
    name: "Qwen Enterprise",
    kind: "国产模型",
    availableEnvironments: ["心理疗愈生产版", "评测版"],
    health: "healthy",
    transparency: "完整",
    errorRate: 0.6,
    p95Latency: 1980,
    description: "适合摘要和标签分类等低成本结构化任务，是当前国产替代建议的主要承接方。",
    recommendation: "适合作为摘要与分类低成本备选",
    recommendationNote: "摘要任务预计可以节约约 38% 成本，且成功率稳定。",
    models: [
      { name: "qwen-summary", useCase: "生产版摘要" },
      { name: "qwen-lite", useCase: "标签分类 / 提取" },
    ],
    metrics: {
      requests: 2940,
      tokens: 702000,
      avgLatency: 1120,
      p95Latency: 1980,
      errorRate: 0.6,
      cost: 240,
    },
  },
  {
    id: "moonshot-direct",
    name: "Moonshot Direct",
    kind: "国产模型",
    availableEnvironments: ["开发版"],
    health: "degraded",
    transparency: "完整",
    errorRate: 3.9,
    p95Latency: 2810,
    description: "开发版里的国产备选，长文本表现尚可，但近期延迟偏高。",
    recommendation: "适合作为长文本备选",
    recommendationNote: "可用于对比，但不建议取代当前主用上游。",
    models: [
      { name: "moonshot-long", useCase: "长文本整理" },
      { name: "moonshot-lite", useCase: "实验性草稿任务" },
    ],
    metrics: {
      requests: 1050,
      tokens: 392000,
      avgLatency: 1460,
      p95Latency: 2810,
      errorRate: 3.9,
      cost: 110,
    },
  },
  {
    id: "freebridge-sandbox",
    name: "Freebridge Sandbox",
    kind: "免费国外 API",
    availableEnvironments: ["开发版"],
    health: "idle",
    transparency: "暂无",
    errorRate: 0,
    p95Latency: 0,
    description: "仅用于低优先级试验，目前没有足够运行数据，不应进入关键路径。",
    recommendation: "仅适合作为试验入口",
    recommendationNote: "当前 24 小时无样本，不产生任何生产或续费结论。",
    models: [
      { name: "gpt-oss-free", useCase: "试验性验证" },
    ],
    metrics: null,
  },
];

export const dashboardDecisions = [
  {
    title: "中转站续费建议",
    type: "开发版",
    target: "优先续费 星河中转 A",
    reason: "流式稳定性最好，最适合 Claude Code 主用链路。",
    updatedAt: "今天 11:50",
  },
  {
    title: "国产模型替代建议",
    type: "生产版",
    target: "摘要任务切到 Qwen Enterprise",
    reason: "预计降本 38%，且成功率与延迟维持在可接受范围。",
    updatedAt: "今天 10:40",
  },
];

export const dashboardRisks = [
  {
    title: "生产边界风险",
    level: "高",
    environment: "心理疗愈生产版",
    note: "配置草稿中出现第三方中转占位，需保持只读提醒，不进入真实可编辑流程。",
  },
  {
    title: "观测风险",
    level: "中",
    environment: "开发版",
    note: "星河中转 A 的 token usage 字段偶有缺失，续费建议仍需结合透明度风险。",
  },
  {
    title: "报告空态",
    level: "低",
    environment: "评测版",
    note: "周度国产替代报告尚未形成稳定 feed，当前页面保留空态说明。",
  },
];

export const recentRuns: RunRecord[] = [
  {
    id: "dashboard-run-1",
    name: "Claude Code 稳定性对比",
    type: "benchmark",
    status: "healthy",
    startedAt: "今天 09:10",
    environment: "开发版",
  },
  {
    id: "dashboard-run-2",
    name: "生产边界巡检",
    type: "policy-check",
    status: "risk",
    startedAt: "今天 10:25",
    environment: "心理疗愈生产版",
  },
  {
    id: "dashboard-run-3",
    name: "开发版中转续费日报",
    type: "report",
    status: "healthy",
    startedAt: "今天 07:30",
    environment: "评测版",
  },
  {
    id: "dashboard-run-4",
    name: "国产替代周报",
    type: "report",
    status: "idle",
    startedAt: "暂无数据",
    environment: "评测版",
  },
];

export const evalScoreboard = {
  coding: [
    {
      task: "Claude Code 主链路",
      contender: "星河中转 A",
      quality: 8.9,
      stability: 9.1,
      efficiency: 7.6,
      conclusion: "当前最稳，适合主用。",
    },
    {
      task: "Codex 辅助编码",
      contender: "DeepSeek Direct",
      quality: 7.8,
      stability: 8.5,
      efficiency: 9.0,
      conclusion: "低成本备选，适合补位。",
    },
    {
      task: "中转对比",
      contender: "Atlas Relay",
      quality: 7.2,
      stability: 5.8,
      efficiency: 7.1,
      conclusion: "透明度较好，但流式不稳。",
    },
  ],
  therapy: [
    {
      task: "主对话",
      contender: "DeepSeek Direct",
      quality: 8.6,
      stability: 9.0,
      efficiency: 7.4,
      conclusion: "当前生产主链路首选。",
    },
    {
      task: "摘要",
      contender: "Qwen Enterprise",
      quality: 7.9,
      stability: 8.8,
      efficiency: 9.3,
      conclusion: "推荐承担低成本摘要任务。",
    },
    {
      task: "标签分类",
      contender: "Qwen Enterprise",
      quality: 7.4,
      stability: 8.5,
      efficiency: 9.5,
      conclusion: "适合结构化轻任务。",
    },
  ],
};

export const evalComparisons = [
  {
    title: "星河中转 A vs Atlas Relay",
    task: "Claude Code 流式编码",
    difference: "星河中转 A 在流式连续性和 TTFT 上明显更稳。",
    recommendation: "将 Atlas Relay 保留为比较对象，不作主用。",
  },
  {
    title: "Qwen Enterprise vs DeepSeek Direct",
    task: "心理疗愈摘要",
    difference: "Qwen Enterprise 成本效率更高，DeepSeek Direct 在长摘要质量上略优。",
    recommendation: "摘要优先用 Qwen，长对话保留 DeepSeek。",
  },
  {
    title: "Freebridge Sandbox vs Moonshot Direct",
    task: "试验性草稿生成",
    difference: "Freebridge 当前无稳定样本，不足以形成结论。",
    recommendation: "保留空态，不生成错误建议。",
  },
];

export const evalRecommendations = [
  {
    category: "中转站续费建议",
    headline: "优先续费 星河中转 A",
    detail: "Atlas Relay 保留观察位，除非其流式错误率降到 3% 以下，否则不建议转正为主用。",
  },
  {
    category: "任务级替代建议",
    headline: "生产摘要切到 Qwen Enterprise",
    detail: "摘要、标签分类与轻量提取优先下沉到国产低成本池，主对话维持 DeepSeek Direct。",
  },
];

export const evalReports = [
  {
    name: "开发版中转续费日报",
    status: "已生成",
    period: "2026-04-16",
    note: "包含流式稳定性、透明度与续费结论。",
  },
  {
    name: "国产替代周报",
    status: "暂无数据",
    period: "本周",
    note: "周度 feed 尚未跑稳，页面保留空态而不虚构数据。",
  },
];

export const dashboardMetricsSnapshot = dashboardMetrics;
