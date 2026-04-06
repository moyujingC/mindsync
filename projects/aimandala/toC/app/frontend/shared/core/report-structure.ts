import type { LiteStructuredReport, ProStructuredReport } from "../types";

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
  deeper: "深层模式",
  core: "核心信念",
};

export const proMicroLabels: Record<string, string> = {
  adjacent: "相邻关系",
  wrap: "包裹关系",
  "节奏关系": "节奏关系",
  "关系模式": "关系模式",
  "行动模式": "行动模式",
};

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
