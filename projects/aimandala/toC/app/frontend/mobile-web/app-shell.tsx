import type { ReactNode } from "react";

import type { MobileWebRouteDefinition } from "./routes";

export interface MobileWebAppShellProps {
  route: MobileWebRouteDefinition;
  children: ReactNode;
  className?: string;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  hideHeader?: boolean;
}

export function MobileWebAppShell({
  route,
  children,
  className,
  environmentLabel,
  environmentDetail,
  environmentTone = "preview",
  hideHeader = false,
}: MobileWebAppShellProps) {
  return (
    <main className={`mw-app-shell${className ? ` ${className}` : ""}`}>
      {hideHeader ? null : (
        <header className="mw-app-shell__header">
          <div>
            <small className="mw-app-shell__eyebrow">一镜一梳</small>
            <h1>{route.title}</h1>
          </div>
        </header>
      )}
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
