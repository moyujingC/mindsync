import type { ReactNode } from "react";

import type { MiniappRouteId } from "./routes";
import type { FrontendUserSession } from "../shared/types";
import type { MobileWebUploadDraft } from "../mobile-web/state";
import { MobileWebApp } from "../mobile-web/app";
import { resolveMiniappRouteProps } from "./router-plan";
import { MiniappRuntime } from "./runtime";

export interface MiniappAppProps {
  route: MiniappRouteId;
  mode?: "preview" | "runtime";
  initialDraft?: MobileWebUploadDraft;
  initialSession?: FrontendUserSession;
}

export function MiniappApp({
  route,
  mode = "preview",
  initialDraft,
  initialSession,
}: MiniappAppProps): ReactNode {
  if (mode === "runtime") {
    return (
      <MiniappRuntime
        route={route}
        initialDraft={initialDraft}
        initialSession={initialSession}
      />
    );
  }

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
