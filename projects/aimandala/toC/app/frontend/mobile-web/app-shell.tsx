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
    <main className="mw-app-shell">
      <header className="mw-app-shell__header">
        <div>
          <small className="mw-app-shell__eyebrow">一镜一梳 mobile-web</small>
          <h1>{route.title}</h1>
          <p className="mw-app-shell__subtitle">
            To C 主路径开发壳，当前按手机端 Web 版先行推进。
          </p>
        </div>

        <nav className="mw-route-nav" aria-label="Mobile web routes">
          {route.id}
        </nav>
      </header>
      <section className="mw-app-shell__content">{children}</section>
    </main>
  );
}
