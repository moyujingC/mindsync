export type MobileWebRouteId =
  | "landing"
  | "upload"
  | "reportEntry"
  | "loading"
  | "report"
  | "history"
  | "historyRecordDetail";

export interface MobileWebRouteDefinition {
  id: MobileWebRouteId;
  path: string;
  title: string;
}

export const mobileWebRoutes: MobileWebRouteDefinition[] = [
  { id: "landing", path: "/", title: "一镜一梳" },
  { id: "upload", path: "/upload", title: "上传画作" },
  { id: "reportEntry", path: "/report-entry", title: "解读确认页" },
  { id: "loading", path: "/loading", title: "解读生成中" },
  { id: "report", path: "/report", title: "新版解读报告" },
  { id: "history", path: "/history", title: "历史解读" },
  {
    id: "historyRecordDetail",
    path: "/history-record-detail",
    title: "历史记录详情",
  },
];
