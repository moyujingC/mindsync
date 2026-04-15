export type MiniappRouteId =
  | "landing"
  | "upload"
  | "reportEntry"
  | "loading"
  | "report"
  | "history"
  | "historyRecordDetail";

export interface MiniappRouteDefinition {
  id: MiniappRouteId;
  path: string;
  title: string;
}

export const miniappRoutes: MiniappRouteDefinition[] = [
  { id: "landing", path: "/miniapp", title: "一镜一梳小程序预览" },
  { id: "upload", path: "/miniapp/upload", title: "上传画作" },
  {
    id: "reportEntry",
    path: "/miniapp/report-entry",
    title: "Lite / Pro 选择页",
  },
  { id: "loading", path: "/miniapp/loading", title: "解读生成中" },
  { id: "report", path: "/miniapp/report", title: "Lite 解读报告" },
  { id: "history", path: "/miniapp/history", title: "历史解读" },
  {
    id: "historyRecordDetail",
    path: "/miniapp/history-record-detail",
    title: "历史记录详情",
  },
];
