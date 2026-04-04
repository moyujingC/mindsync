export type MobileWebRouteId =
  | "upload"
  | "loading"
  | "report"
  | "history"
  | "upgrade";

export interface MobileWebRouteDefinition {
  id: MobileWebRouteId;
  path: string;
  title: string;
}

export const mobileWebRoutes: MobileWebRouteDefinition[] = [
  { id: "upload", path: "/upload", title: "上传画作" },
  { id: "loading", path: "/loading", title: "解读生成中" },
  { id: "report", path: "/report", title: "一镜 Lite 版结果" },
  { id: "history", path: "/history", title: "历史解读" },
  { id: "upgrade", path: "/upgrade", title: "一梳 Pro 版入口" },
];
