export type MobileWebRouteId =
  | "landing"
  | "upload"
  | "reportEntry"
  | "loading"
  | "report"
  | "reportLegacy"
  | "history"
  | "upgrade";

export interface MobileWebRouteDefinition {
  id: MobileWebRouteId;
  path: string;
  title: string;
}

export const mobileWebRoutes: MobileWebRouteDefinition[] = [
  { id: "landing", path: "/", title: "一镜一梳" },
  { id: "upload", path: "/upload", title: "上传画作" },
  { id: "reportEntry", path: "/report-entry", title: "报告矩阵入口" },
  { id: "loading", path: "/loading", title: "解读生成中" },
  { id: "report", path: "/report", title: "自我理解报告" },
  { id: "reportLegacy", path: "/report-legacy", title: "报告旧版对照" },
  { id: "history", path: "/history", title: "历史解读" },
  { id: "upgrade", path: "/upgrade", title: "深层模式报告" },
];
