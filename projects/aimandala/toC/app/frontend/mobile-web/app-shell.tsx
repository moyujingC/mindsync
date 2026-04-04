import type { ReactNode } from "react";

import type { MobileWebRouteDefinition } from "./routes";

export interface MobileWebAppShellProps {
  route: MobileWebRouteDefinition;
  children: ReactNode;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
}

export function MobileWebAppShell({
  route,
  children,
  environmentLabel,
  environmentDetail,
  environmentTone = "preview",
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
      {environmentLabel ? (
        <section
          className={`mw-environment-banner mw-environment-banner--${environmentTone}`}
        >
          <strong>{environmentLabel}</strong>
          <p>{environmentDetail}</p>
        </section>
      ) : null}
      <section className="mw-app-shell__content">{children}</section>
    </main>
  );
}
