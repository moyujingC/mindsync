export type WorkSummary = {
  id: string;
  title: string;
  subtitle: string;
  role: string;
  period: string;
  brief: string;
  tags: string[];
  accent: string;
  to: string;
  navLabel: string;
};

export const works: WorkSummary[] = [
  {
    id: "mandala-app",
    title: "一镜一梳",
    subtitle: "曼陀罗绘画 AI 解读应用",
    role: "创始人 & AI 产品负责人",
    period: "2025 — 至今",
    brief: "从 100+ 小时一线服务痛点出发，完成上传、画面结构标定、Lite 报告、报告内追问和历史记录的线上主链；并用两段式生成、案例对照与安全边界控制输出质量。",
    tags: ["AI 产品", "多模态", "模型评测", "Golden Case", "质量门"],
    accent: "#8B5A2B",
    to: "/works/mandala-app",
    navLabel: "AI产品实践",
  },
  {
    id: "delivery-system",
    title: "AI 辅助研发与交付流程",
    subtitle: "需求到验证的可追踪协作系统",
    role: "系统设计者",
    period: "2026 — 至今",
    brief: "将需求、规格、任务、质检、验证与交付组织为可追踪文档流，支撑多项目并行推进、减少 AI 协作中的上下文断裂，并保留问题定位与复盘依据。",
    tags: ["SDD", "TDD", "质量门", "交付回写"],
    accent: "#2C3E50",
    to: "/works/delivery-system",
    navLabel: "系统与工具",
  },
  {
    id: "healing-kb",
    title: "曼陀罗疗愈知识库",
    subtitle: "结构化东方疗愈体系",
    role: "体系构建者",
    period: "2025 — 至今",
    brief: "把一线解读经验整理为画面结构、视觉证据、报告表达和安全边界，形成可审阅、可复用的领域知识层，为后续检索增强生成（RAG）方案提供规格基础。",
    tags: ["知识工程", "RAG 规格", "SOP", "AI 知识层"],
    accent: "#6FA8A0",
    to: "/works/healing-kb",
    navLabel: "疗愈知识库",
  },
  {
    id: "healing-ai-research",
    title: "心理疗愈 AI 产品观察",
    subtitle: "产品分析与趋势洞察",
    role: "独立研究员",
    period: "2026 — 至今",
    brief: "持续观察心理疗愈、情绪支持和自我探索类 AI 产品，分析产品模式、技术路径、交互边界、风险控制和落地机会。",
    tags: ["竞品分析", "行业洞察", "边界设计"],
    accent: "#9B8AB8",
    to: "/works/healing-ai-research",
    navLabel: "AI产品观察",
  },
  {
    id: "game-career",
    title: "游戏开发技术履历",
    subtitle: "主机 / 端游 / 移动端研发经验",
    role: "游戏程序员 / 制作人",
    period: "2008 — 2016",
    brief: "从一线程序员到项目组织者，覆盖端游、主机、移动端研发，积累复杂系统拆解、跨模块协作和工程交付能力。",
    tags: ["C++", "Python", "跨模块协作", "工程交付"],
    accent: "#5A7A8C",
    to: "/works/game-career",
    navLabel: "游戏研发履历",
  },
];

export const worksLinks = works.map(({ to, navLabel, title }) => ({
  to,
  label: navLabel,
  title,
}));
