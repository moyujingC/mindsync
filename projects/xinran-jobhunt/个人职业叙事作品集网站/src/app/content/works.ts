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
    brief: "从人工解读痛点出发，设计画作上传、三圈识别、Lite / Pro 报告、报告追问和质量门的 AI 产品主线。",
    tags: ["AI 产品", "多模态", "Prompt Pack", "质量门"],
    accent: "#8B5A2B",
    to: "/works/mandala-app",
    navLabel: "AI产品实践",
  },
  {
    title: "知行工坊",
    subtitle: "Monorepo 一人公司操作系统",
    role: "系统设计者",
    period: "2026 — 至今",
    brief: "用 Monorepo 管理公司治理、项目入口、Agent 角色、知识库和阶段 artifact，让 AI 协作可追踪、可交接。",
    tags: ["Agent 协作", "Monorepo", "知识治理", "任务流转"],
    accent: "#2C3E50",
    to: "/works/monorepo",
    navLabel: "系统与工具",
  },
  {
    title: "曼陀罗疗愈知识库",
    subtitle: "结构化东方疗愈体系",
    role: "体系构建者",
    period: "2025 — 至今",
    brief: "把一线解读经验整理为三圈结构、五行对应、视觉证据、报告表达和安全边界，接入 AI 报告链路。",
    tags: ["知识工程", "SOP", "AI 知识层"],
    accent: "#6FA8A0",
    to: "/works/healing-kb",
    navLabel: "疗愈知识库",
  },
  {
    title: "心理疗愈 AI 产品观察",
    subtitle: "产品分析与趋势洞察",
    role: "独立研究员",
    period: "2026 — 至今",
    brief: "持续观察心理疗愈、情绪支持和自我探索类 AI 产品，分析产品模式、技术路径、边界风险和落地机会。",
    tags: ["竞品分析", "行业洞察", "AI+人文"],
    accent: "#9B8AB8",
    to: "/works/healing-ai-research",
    navLabel: "心理疗愈AI研学",
  },
  {
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
