import { works, type WorkSummary } from "./works";

export type PortfolioTarget =
  | "ai-product-manager"
  | "ai-application-engineer"
  | "fde-ai-solution-engineer";

export type RoleTrack = {
  id: string;
  title: string;
  summary: string;
  proof: string[];
};

export const defaultPortfolioTarget: PortfolioTarget = "fde-ai-solution-engineer";

const roleTracks: RoleTrack[] = [
  {
    id: "role-ai-product-manager",
    title: "AI 产品经理",
    summary: "从真实问题定义产品路径，完成 MVP 取舍、AI 输出质量设计、商业化路径设计与端到端上线推进。",
    proof: ["一镜一梳线上产品", "11 个案例 A/B 对照", "4 人创业团队经营"],
  },
  {
    id: "role-ai-application-engineer",
    title: "AI 应用工程师",
    summary: "将模型调用、生成链路、评测回归、失败降级和部署运维组织为可运行、可测试、可排障的 AI 应用系统。",
    proof: ["两段式报告主链", "模型稳定性评测", "开源 PR 与 CI 协作"],
  },
  {
    id: "role-fde-ai-solution-engineer",
    title: "FDE / AI 解决方案工程师",
    summary: "从客户场景中识别目标、约束与风险，将非标准服务拆成可验证 PoC、方案边界、工程联调与可复用交付体系。",
    proof: ["150+ 高信任客户服务", "SOP 与培训体系", "AI 产品上线与质量验证"],
  },
];

const worksById = Object.fromEntries(works.map((work) => [work.id, work])) as Record<string, WorkSummary>;
const rolesById = Object.fromEntries(roleTracks.map((role) => [role.id, role])) as Record<string, RoleTrack>;

const targetProfiles = {
  "ai-product-manager": {
    label: "AI 产品经理",
    shortLabel: "产品经理版",
    summary: "突出一镜一梳从真实问题到上线验证的产品闭环，以及 AI 输出质量与商业化路径设计。",
    roleOrder: [
      "role-ai-product-manager",
      "role-fde-ai-solution-engineer",
      "role-ai-application-engineer",
    ],
    workOrder: [
      "mandala-app",
      "delivery-system",
      "game-career",
      "healing-ai-research",
      "healing-kb",
    ],
  },
  "ai-application-engineer": {
    label: "AI 应用工程师",
    shortLabel: "工程版",
    summary: "突出两段式生成链路、模型评测、回归验证、失败降级和商业工程底盘。",
    roleOrder: [
      "role-ai-application-engineer",
      "role-ai-product-manager",
      "role-fde-ai-solution-engineer",
    ],
    workOrder: [
      "mandala-app",
      "delivery-system",
      "game-career",
      "healing-kb",
      "healing-ai-research",
    ],
  },
  "fde-ai-solution-engineer": {
    label: "FDE / AI 解决方案工程师",
    shortLabel: "解决方案版",
    summary: "突出客户诊断、服务标准化、AI 方案边界、原型验证和工程交付的组合能力。",
    roleOrder: [
      "role-fde-ai-solution-engineer",
      "role-ai-product-manager",
      "role-ai-application-engineer",
    ],
    workOrder: [
      "mandala-app",
      "delivery-system",
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
  return value === "ai-product-manager" || value === "ai-application-engineer" || value === "fde-ai-solution-engineer";
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
