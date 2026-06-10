export type MobileWebRouteId =
  | "landing"
  | "upload"
  | "reportEntry"
  | "loading"
  | "report"
  | "history"
  | "historyRecordDetail"
  | "historyRecordDetailNotUpgraded"
  | "historyRecordDetailGenerating"
  | "historyRecordDetailViewable";

export interface MobileWebRouteDefinition {
  id: MobileWebRouteId;
  path: string;
  title: string;
  previewLabel?: string;
}

export const mobileWebRoutes: MobileWebRouteDefinition[] = [
  { id: "landing", path: "/", title: "一镜一梳", previewLabel: "落地页" },
  { id: "upload", path: "/upload", title: "上传画作", previewLabel: "上传" },
  { id: "reportEntry", path: "/report-entry", title: "解读确认页", previewLabel: "付款" },
  { id: "loading", path: "/loading", title: "解读生成中", previewLabel: "加载" },
  { id: "report", path: "/report", title: "新版解读报告", previewLabel: "新版解读报告" },
  { id: "history", path: "/history", title: "历史解读", previewLabel: "历史" },
  {
    id: "historyRecordDetail",
    path: "/history-record-detail",
    title: "解读详情",
    previewLabel: "解读详情-运行态",
  },
  {
    id: "historyRecordDetailNotUpgraded",
    path: "/history-record-detail/not-upgraded",
    title: "解读详情-未升级 Pro",
    previewLabel: "解读详情-未升级 Pro",
  },
  {
    id: "historyRecordDetailGenerating",
    path: "/history-record-detail/generating",
    title: "解读详情-Pro 生成中",
    previewLabel: "解读详情-Pro 生成中",
  },
  {
    id: "historyRecordDetailViewable",
    path: "/history-record-detail/viewable",
    title: "解读详情-Pro 已可查看",
    previewLabel: "解读详情-Pro 已可查看",
  },
];

export function isHistoryRecordDetailRoute(route: MobileWebRouteId): boolean {
  return (
    route === "historyRecordDetail" ||
    route === "historyRecordDetailNotUpgraded" ||
    route === "historyRecordDetailGenerating" ||
    route === "historyRecordDetailViewable"
  );
}
