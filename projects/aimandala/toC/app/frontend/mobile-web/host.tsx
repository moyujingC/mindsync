import type { ReactNode } from "react";

import { MobileWebApp } from "./app";
import {
  resolveMobileWebRouteProps,
  type MobileWebRouteInput,
} from "./router-plan";

export async function renderMobileWebRoute(
  input: MobileWebRouteInput,
): Promise<ReactNode> {
  const props = await resolveMobileWebRouteProps(input);
  return <MobileWebApp {...props} />;
}
