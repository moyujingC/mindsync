import type {
  InterpretationStatusResponse,
  LiteStructuredReport,
  ProStructuredReport,
  ReportResponse,
} from "../types";
import {
  getThemeDisplayName,
  isKnownThemeId,
  normalizeThemeId,
} from "./themes";

export const liteReportSectionTitles = {
  overall: "整体感受",
  visual: "画面元素",
  emotion: "情绪画像",
  teaser: "给你的一个小预告",
  story: "你的心灵画像故事",
  theme: "在当前主题中的具体表现",
  awareness: "三个日常小觉察",
  insights: "六个核心洞察",
  experiment: "一个情绪调节小实验",
} as const;

export const liteStoryLabels: Array<[string, string]> = [
  ["起", "base"],
  ["承", "contradiction"],
  ["转", "pattern"],
  ["再转", "defense"],
  ["合", "block"],
  ["升", "light"],
];

export const liteThemeInsightLabels: Array<[string, string]> = [
  ["典型场景", "scene"],
  ["具体影响", "impact"],
  ["一个小小的觉察点", "awareness"],
];

export const proReportSectionTitles = {
  firstImpression: "第一眼直觉",
  coreTable: "核心洞察表格",
  circles: "三圈深度诊断",
  micro: "微观能量分析",
  imbalance: "失衡识别",
  rootCause: "根源探索",
  healing: "疗愈建议",
} as const;

export const proImbalanceLabels: Record<string, string> = {
  type: "当前状态",
  summary: "整体判断",
  primary: "主要失衡类型",
  evidence: "判断依据",
  energy_level: "能量层面",
  psychological_level: "心理层面",
  life_manifestation: "生活表现",
};

export const proRootCauseLabels: Record<string, string> = {
  surface: "表面现象",
  deeper: "形成机制",
  core: "核心信念",
};

export const proMicroLabels: Record<string, string> = {
  adjacent: "相邻关系",
  wrap: "包裹关系",
  "节奏关系": "节奏关系",
  "关系模式": "关系模式",
  "行动模式": "行动模式",
};

export type SelfUnderstandingReportActionIntent =
  | "open_upgrade_report"
  | "open_report_entry"
  | "restart_upload";

export interface SelfUnderstandingReportCta {
  intent: SelfUnderstandingReportActionIntent;
  primaryLabel: string;
  footerHint: string;
  legacyCardTitle: string;
  legacyBulletPoints: string[];
  legacyCaption: string;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getThemeContextLabel(theme?: string | null): string | null {
  const normalized = normalizeThemeId(theme);
  if (!normalized || normalized === "general") {
    return null;
  }

  if (!isKnownThemeId(normalized) && /[_a-z]/i.test(normalized)) {
    return "这个主题";
  }

  return getThemeDisplayName(normalized, {
    generalLabel: null,
  });
}

function getSelfUnderstandingFocus(structured?: LiteStructuredReport | null): string | null {
  const blocks = structured?.self_understanding_blocks;

  return (
    cleanText(blocks?.pattern_naming?.pattern_name) ??
    cleanText(blocks?.next_step?.direction) ??
    cleanText(blocks?.reality_connection?.life_dimension) ??
    cleanText(blocks?.theme_insights?.awareness) ??
    cleanText(structured?.theme_insights?.awareness)
  );
}

function getSelfUnderstandingDimension(structured?: LiteStructuredReport | null): string | null {
  const blocks = structured?.self_understanding_blocks;

  return (
    cleanText(blocks?.reality_connection?.life_dimension) ??
    cleanText(blocks?.theme_insights?.scene) ??
    cleanText(structured?.theme_insights?.scene)
  );
}

export function hasProReportAccess(input: {
  status?: InterpretationStatusResponse | null;
  report?: ReportResponse | null;
}): boolean {
  return Boolean(
    input.report?.version === "pro" ||
      input.status?.version_purchased?.includes("pro"),
  );
}

export function resolveSelfUnderstandingReportCta(input: {
  theme?: string | null;
  canUpgrade?: boolean | null;
  hasProAccess?: boolean | null;
  structured?: LiteStructuredReport | null;
}): SelfUnderstandingReportCta {
  const themeDisplayName = getThemeContextLabel(input.theme);
  const focus = getSelfUnderstandingFocus(input.structured);
  const dimension = getSelfUnderstandingDimension(input.structured) ?? themeDisplayName ?? "日常生活";
  const focusText = focus ? `“${focus}”` : "这层模式";

  if (input.hasProAccess) {
    return {
      intent: "open_upgrade_report",
      primaryLabel: "查看 Pro 版解读",
      footerHint: focus
        ? `你已经拥有 Pro 版，可以继续看清${focusText}的来源、它在${dimension}中的延续方式，以及下一步如何展开。`
        : "你已经拥有 Pro 版，可以直接继续进入更完整的解读。",
      legacyCardTitle: focus ? `${focusText}背后，还有更完整的一层` : "你的画里，还有更完整的一层",
      legacyBulletPoints: [
        "这种模式为什么会反复出现",
        `它在${dimension}里还会怎样显现`,
        "接下来可以怎样走得更稳一点",
      ],
      legacyCaption: "你已经拥有 Pro 版，当前可以直接继续查看。",
    };
  }

  if (input.canUpgrade) {
    return {
      intent: "open_report_entry",
      primaryLabel: "看看 Pro 版解读",
      footerHint: focus
        ? `这一轮已经帮你看见了${focusText}。如果你想继续往下走，可以进入下一步选择，看看 Pro 版是否适合你。`
        : "这次 Lite 解读已经成形。如果你想继续往下走，可以进入下一步选择，看看 Pro 版是否适合你。",
      legacyCardTitle: focus ? `如果继续往下看，${focusText}会更清楚` : "你的画里，还可以再往下看一步",
      legacyBulletPoints: [
        "这种模式更完整的来源是什么",
        `它在${dimension}里还有哪些延伸`,
        "下一步该先做什么，才不只是看懂",
      ],
      legacyCaption: "先进入 Lite / Pro 选择页，再决定这次是否继续往下看。",
    };
  }

  return {
    intent: "restart_upload",
    primaryLabel: themeDisplayName ? "带着这个主题再画一幅" : "带着这份理解再画一幅",
    footerHint: themeDisplayName
      ? `这轮先不急着继续升级。更好的下一步，是围绕${themeDisplayName}再画一幅，把这次看到的变化继续画出来。`
      : "这轮先不急着继续升级。更好的下一步，是带着这份理解再画一幅，看看下一次画面会怎样回应你。",
    legacyCardTitle: themeDisplayName ? `下一幅，继续围绕${themeDisplayName}来画` : "下一幅，继续带着这份理解来画",
    legacyBulletPoints: [
      focus ? `把这次看到的${focusText}继续画出来` : "把这次最有感觉的部分继续画出来",
      "留意下一幅画里哪里开始变松，哪里仍在收紧",
      "用连续两次创作看清变化，而不是急着下结论",
    ],
    legacyCaption: themeDisplayName
      ? "当前先不继续切换版本，建议围绕同一主题继续画一幅。"
      : "当前先不继续切换版本，建议把这次理解带回下一幅画里。",
  };
}

export function getLiteStoryEntries(
  structured: LiteStructuredReport,
): Array<[string, string]> {
  return liteStoryLabels
    .map(([label, key]) => [label, structured.story?.[key as keyof NonNullable<LiteStructuredReport["story"]>]?.content])
    .filter((entry): entry is [string, string] => Boolean(entry[1]));
}

export function getLiteThemeInsightEntries(
  structured: LiteStructuredReport,
): Array<[string, string]> {
  return liteThemeInsightLabels
    .map(([label, key]) => [label, structured.theme_insights?.[key as keyof NonNullable<LiteStructuredReport["theme_insights"]>]])
    .filter((entry): entry is [string, string] => Boolean(entry[1]));
}

export function getProCoreInsightEntries(
  structured: ProStructuredReport,
): Array<[string, string]> {
  return Object.entries(structured.core_insight_table ?? {}).filter(
    ([, value]) => Boolean(value),
  );
}

export function getProCircleEntries(
  structured: ProStructuredReport,
): Array<{ label?: string; reading?: string }> {
  return Object.values(structured.three_circles_detailed ?? {}).filter(
    (item) => item?.reading,
  );
}

export function getProMicroEntries(
  structured: ProStructuredReport,
): Array<[string, string]> {
  return Object.entries(structured.micro_analysis_detailed ?? {}).filter(
    ([, value]) => Boolean(value),
  );
}

export function getProImbalanceEntries(
  structured: ProStructuredReport,
): Array<[string, string]> {
  return Object.entries(structured.imbalance_confirmed ?? {}).filter(
    ([, value]) => Boolean(value),
  );
}

export function getProRootCauseEntries(
  structured: ProStructuredReport,
): Array<[string, string]> {
  return Object.entries(structured.root_cause ?? {}).filter(
    ([, value]) => Boolean(value),
  );
}
