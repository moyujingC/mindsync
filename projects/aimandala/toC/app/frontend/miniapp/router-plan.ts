import type { MobileWebAppProps } from "../mobile-web/app";
import { createMiniappPreviewProps } from "./fixtures";
import type { MiniappRouteId } from "./routes";

export interface MiniappRouteInput {
  route: MiniappRouteId;
}

export function resolveMiniappRouteProps(
  input: MiniappRouteInput,
): MobileWebAppProps {
  return createMiniappPreviewProps(input.route);
}
