export type WorkSummary = {
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
    title: "一镜一梳",
    subtitle: "曼陀罗绘画 AI 解读应用",
    role: "创始人 & AI 产品负责人",
    period: "2025 — 至今",
    brief: "基于东方五行理论与多模态图像分析的曼陀罗绘画解读与自我探索系统。",
    tags: ["React", "Node.js", "OpenAI", "Monorepo"],
    accent: "#8B5A2B",
    to: "/works/mandala-app",
    navLabel: "AI产品实践",
  },
  {
    title: "知行工坊",
    subtitle: "Monorepo 一人公司操作系统",
    role: "系统设计者",
    period: "2026 — 至今",
    brief: "AI 时代一人公司工作空间，整合公司治理、项目管理与 Agent 协作。",
    tags: ["Astro", "TypeScript", "Paperclip", "Claude Code"],
    accent: "#2C3E50",
    to: "/works/monorepo",
    navLabel: "系统与工具",
  },
  {
    title: "曼陀罗疗愈知识库",
    subtitle: "结构化东方疗愈体系",
    role: "体系构建者",
    period: "2025 — 至今",
    brief: "基于一线个案经验沉淀的曼陀罗解读知识体系，包含三环结构、五行对应、情绪映射等核心模块。",
    tags: ["知识工程", "结构化梳理", "东方心理学"],
    accent: "#6FA8A0",
    to: "/works/healing-kb",
    navLabel: "疗愈知识库",
  },
  {
    title: "心理疗愈 AI 产品观察",
    subtitle: "产品分析与趋势洞察",
    role: "独立研究员",
    period: "2026 — 至今",
    brief: "深度拆解国内外 20+ 心理疗愈 AI 产品，分析技术路径、产品模式与行业痛点。",
    tags: ["竞品分析", "行业洞察", "AI+人文"],
    accent: "#9B8AB8",
    to: "/works/healing-ai-research",
    navLabel: "行业研究",
  },
  {
    title: "游戏开发技术履历",
    subtitle: "8 年全平台游戏研发经验",
    role: "游戏程序员 / 制作人",
    period: "2008 — 2016",
    brief: "从一线程序员到技术负责人，覆盖端游、主机、移动端全链路研发，参与多款 AAA 级跨平台项目。",
    tags: ["C++", "Lua", "Unity", "Python"],
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
