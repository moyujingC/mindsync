import type {
  MobileWebReportProductType,
  MobileWebUploadDraft,
} from "../state";

export type ReportEntryAvailability =
  | "available"
  | "coming_soon"
  | "theme_required";

export interface ReportEntryCardDescriptor {
  id: MobileWebReportProductType;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  note: string;
  statusLabel: string;
  tone: "soft" | "core" | "focus" | "deep";
  availability: ReportEntryAvailability;
  recommended?: boolean;
}

export interface ReportEntryPageDescriptor {
  title: string;
  description: string;
  themeLabel: string;
  cards: ReportEntryCardDescriptor[];
}

const themeDisplayNames: Record<string, string> = {
  general: "全面解读",
  father_relationship: "父亲关系",
  mother_relationship: "母亲关系",
  intimate_relationship: "亲密关系",
  parent_child_relationship: "亲子关系",
  wealth_career: "财富与事业",
  health_wellness: "身体与健康",
  personal_growth: "个人成长",
};

function getThemeLabel(theme?: string): string {
  if (!theme) {
    return "全面解读";
  }

  return themeDisplayNames[theme] ?? theme;
}

export function createReportEntryPageDescriptor(
  draft: Pick<MobileWebUploadDraft, "theme">,
): ReportEntryPageDescriptor {
  const theme = draft.theme || "general";
  const themeLabel = getThemeLabel(theme);
  const isGeneralTheme = theme === "general";

  return {
    title: "这次你想从哪个方向理解这张画？",
    description:
      "当前先把报告入口切换到新的四类矩阵。现在已开放“自我理解报告”和“深层模式报告”，其余两类会在后续逐步接入正式生成链路。",
    themeLabel,
    cards: [
      {
        id: "current_mirroring",
        eyebrow: "当下映照报告",
        title: "先被接住，再看见当下状态",
        description:
          "适合刚进入报告、状态有点乱，或暂时不想读太高密度内容的时候。它更轻、更柔和，先帮助你确认自己正在经历什么。",
        bullets: [
          "低压命中感与情绪安放",
          "少一点结构，多一点接住",
          "适合作为第一次进入报告的轻入口",
        ],
        cta: "即将开放",
        note: "后续会接成低压入口型报告，目前先保留在矩阵中占位。",
        statusLabel: "即将开放",
        tone: "soft",
        availability: "coming_soon",
      },
      {
        id: "self_understanding",
        eyebrow: "自我理解报告",
        title: "从模糊到明白的核心理解报告",
        description:
          "这是当前最完整、最通用的一条主路径。它会帮你把当下感受整理成一条更能看懂、能相信、能带走的理解链。",
        bullets: [
          "整体命中、画面依据、状态解释",
          "模式命名、现实连接、一个下一步",
          "当前默认走这条主结果页",
        ],
        cta: "进入自我理解报告",
        note: "当前先走自我理解报告兼容链路。",
        statusLabel: "当前开放",
        tone: "core",
        availability: "available",
        recommended: true,
      },
      {
        id: "issue_focus",
        eyebrow: "议题聚焦报告",
        title: "围绕一个具体问题看清楚",
        description:
          "适合你已经明确卡在某个主题里，例如关系、边界、表达或事业阶段。它会更强调场景相关性，而不只是泛泛讲你是谁。",
        bullets: [
          "更强调一个主题下的核心拉扯",
          "更重视现实场景与问题解释力",
          "不是完整人格画像，而是问题向理解",
        ],
        cta: isGeneralTheme ? "先选一个具体主题" : "即将开放",
        note: isGeneralTheme
          ? "议题聚焦报告需要更明确的主题输入，当前主题还比较泛。"
          : `你当前选择的是“${themeLabel}”，这类报告后续会优先围绕该主题开放。`,
        statusLabel: isGeneralTheme ? "需要具体主题" : "即将开放",
        tone: "focus",
        availability: isGeneralTheme ? "theme_required" : "coming_soon",
      },
      {
        id: "deep_pattern",
        eyebrow: "深层模式报告",
        title: "直接进入更深一层的模式拆解",
        description:
          "适合你已经准备好看更深层的重复模式、形成机制和接下来优先处理什么。它不是只是更长，而是要比自我理解报告多出一层质变。",
        bullets: [
          "更深层的机制与根源递进",
          "更明确的优先级判断",
          "后续更适合承接到方案或长期陪伴",
        ],
        cta: "直接进入深层模式报告",
        note: "当前先走深层模式报告兼容链路。",
        statusLabel: "当前开放",
        tone: "deep",
        availability: "available",
      },
    ],
  };
}
