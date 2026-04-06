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
          <small className="mw-app-shell__eyebrow">一镜一梳</small>
          <h1>{route.title}</h1>
          <p className="mw-app-shell__subtitle">
            当前先以内容结构与主路径衔接为主，视觉稿后续按 Figma 设计复刻。
          </p>
        </div>

        <nav className="mw-route-nav" aria-label="Mobile web routes">
          内容过渡页
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
