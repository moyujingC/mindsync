import { MobileWebAppShell } from "../app-shell";
import { createHistoryPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import type { InterpretationRecordResponse } from "../../shared/types";

export interface MobileWebHistoryPageProps {
  records: InterpretationRecordResponse[];
}

export function MobileWebHistoryPage({
  records,
}: MobileWebHistoryPageProps) {
  const descriptor = createHistoryPageDescriptor(records);

  return (
    <MobileWebAppShell route={mobileWebRoutes[3]}>
      <section className="mw-hero-card">
        <p className="mw-kicker">历史记录</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </section>

      <section className="mw-metric-row">
        <article className="mw-metric-card">
          <span>总记录数</span>
          <strong>{descriptor.summary.total}</strong>
        </article>
        <article className="mw-metric-card">
          <span>已可查看</span>
          <strong>{descriptor.summary.ready}</strong>
        </article>
        <article className="mw-metric-card">
          <span>生成中</span>
          <strong>{descriptor.summary.pending}</strong>
        </article>
      </section>

      <section className="mw-stack">
        {descriptor.items.length ? (
          descriptor.items.map((item) => (
            <article key={item.interpretationId} className="mw-card">
              <div className="mw-card__header">
                <h3>{item.title}</h3>
                <span className="mw-badge">
                  {item.canOpenReport ? "可查看报告" : "生成中"}
                </span>
              </div>
              <p>{item.subtitle}</p>
              <p className="mw-meta">Interpretation ID: {item.interpretationId}</p>
            </article>
          ))
        ) : (
          <article className="mw-card">
            <div className="mw-card__header">
              <h3>还没有历史记录</h3>
            </div>
            <p>当前用户还没有生成过 To C 解读，后续可从上传主路径进入。</p>
          </article>
        )}
      </section>
    </MobileWebAppShell>
  );
}
