import { works, type WorkSummary } from "./works";

export type PortfolioTarget =
  | "ai-product-manager"
  | "ai-transformation-consultant"
  | "fde-ai-solution-engineer";

export type RoleTrack = {
  id: string;
  title: string;
  summary: string;
  proof: string[];
};

export const defaultPortfolioTarget: PortfolioTarget = "ai-product-manager";

const roleTracks: RoleTrack[] = [
  {
    id: "role-ai-product-manager",
    title: "AI 产品经理",
    summary: "从真实痛点出发，定义 AI 产品路径、MVP 范围、用户体验、输出契约、质量门和迭代评估口径。",
    proof: ["一镜一梳", "心理疗愈 AI 产品观察", "游戏开发技术履历"],
  },
  {
    id: "role-ai-transformation-consultant",
    title: "AI 转型咨询顾问",
    summary: "进入复杂业务现场，诊断流程问题，把专家经验沉淀为 SOP、知识库、AI 工作流、试点路径和组织采用口径。",
    proof: ["知行工坊", "房产咨询与经纪人孵化", "曼陀罗疗愈知识库"],
  },
  {
    id: "role-fde-ai-solution-engineer",
    title: "FDE / AI 解决方案工程师",
    summary: "把客户场景拆成可验证 PoC、Agent 工作流、数据与权限边界、日志 / 人审 / 回滚、评估口径和 ROI 口径。",
    proof: ["知行工坊", "一镜一梳", "早期工程与独立交付经历"],
  },
];

const worksById = Object.fromEntries(works.map((work) => [work.id, work])) as Record<string, WorkSummary>;
const rolesById = Object.fromEntries(roleTracks.map((role) => [role.id, role])) as Record<string, RoleTrack>;

const targetProfiles = {
  "ai-product-manager": {
    label: "AI 产品经理",
    shortLabel: "产品经理版",
    summary: "把 AI 产品经理放在第一优先级，并突出一镜一梳作为主案例。",
    roleOrder: [
      "role-ai-product-manager",
      "role-ai-transformation-consultant",
      "role-fde-ai-solution-engineer",
    ],
    workOrder: [
      "mandala-app",
      "healing-ai-research",
      "game-career",
      "monorepo",
      "healing-kb",
    ],
  },
  "ai-transformation-consultant": {
    label: "AI 转型咨询顾问",
    shortLabel: "咨询顾问版",
    summary: "把复杂业务诊断、知识沉淀和流程落地相关案例放在最前面。",
    roleOrder: [
      "role-ai-transformation-consultant",
      "role-fde-ai-solution-engineer",
      "role-ai-product-manager",
    ],
    workOrder: [
      "monorepo",
      "healing-kb",
      "mandala-app",
      "healing-ai-research",
      "game-career",
    ],
  },
  "fde-ai-solution-engineer": {
    label: "FDE / AI 解决方案工程师",
    shortLabel: "解决方案版",
    summary: "把系统设计、PoC 交付、生产化边界和跨场景落地能力放在最前面。",
    roleOrder: [
      "role-fde-ai-solution-engineer",
      "role-ai-product-manager",
      "role-ai-transformation-consultant",
    ],
    workOrder: [
      "monorepo",
      "mandala-app",
      "game-career",
      "healing-kb",
      "healing-ai-research",
    ],
  },
} satisfies Record<
  PortfolioTarget,
  {
    label: string;
    shortLabel: string;
    summary: string;
    roleOrder: string[];
    workOrder: string[];
  }
>;

export function isPortfolioTarget(value: string | null): value is PortfolioTarget {
  return value === "ai-product-manager" || value === "ai-transformation-consultant" || value === "fde-ai-solution-engineer";
}

export function resolvePortfolioTarget(value: string | null): PortfolioTarget {
  return isPortfolioTarget(value) ? value : defaultPortfolioTarget;
}

export function getPortfolioTargetProfile(target: PortfolioTarget) {
  return targetProfiles[target];
}

export function getOrderedRoles(target: PortfolioTarget) {
  return targetProfiles[target].roleOrder.map((roleId) => rolesById[roleId]);
}

export function getRoleLinks(target: PortfolioTarget) {
  return getOrderedRoles(target).map(({ id, title }) => ({
    hash: `#${id}`,
    label: title,
  }));
}

export function getOrderedWorks(target: PortfolioTarget) {
  return targetProfiles[target].workOrder.map((workId) => worksById[workId]);
}

export function getWorkLinks(target: PortfolioTarget) {
  return getOrderedWorks(target).map(({ to, navLabel, title }) => ({
    to,
    label: navLabel,
    title,
  }));
}
