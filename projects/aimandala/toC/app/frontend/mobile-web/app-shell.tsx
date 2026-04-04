import type { ReactNode } from "react";

import type { MobileWebRouteDefinition } from "./routes";

export interface MobileWebAppShellProps {
  route: MobileWebRouteDefinition;
  children: ReactNode;
}

export function MobileWebAppShell({
  route,
  children,
}: MobileWebAppShellProps) {
  return (
    <main>
      <header>
        <small>AI-Mandala mobile-web</small>
        <h1>{route.title}</h1>
      </header>
      <section>{children}</section>
    </main>
  );
}
