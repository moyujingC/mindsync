import type { ReactNode } from "react";

import type { MiniappRouteId } from "./routes";
import { MobileWebApp } from "../mobile-web/app";
import { resolveMiniappRouteProps } from "./router-plan";

export interface MiniappAppProps {
  route: MiniappRouteId;
}

export function MiniappApp({
  route,
}: MiniappAppProps): ReactNode {
  const props = resolveMiniappRouteProps({ route });

  return (
    <MobileWebApp
      {...props}
      environmentLabel="当前为 miniapp 静态壳预览"
      environmentDetail="当前页面只用于批次 C 的结构与 shared/ui 消费审阅，不代表真实小程序运行时。"
      environmentTone="preview"
    />
  );
}
