import type { HistoryPageDescriptor } from "../pages";

export interface HistorySummaryRowProps {
  summary: HistoryPageDescriptor["summary"];
}

export function HistorySummaryRow({
  summary,
}: HistorySummaryRowProps) {
  return (
    <section className="mw-metric-row">
      <article className="mw-metric-card">
        <span>总记录数</span>
        <strong>{summary.total}</strong>
      </article>
      <article className="mw-metric-card">
        <span>已可查看</span>
        <strong>{summary.ready}</strong>
      </article>
      <article className="mw-metric-card">
        <span>生成中</span>
        <strong>{summary.pending}</strong>
      </article>
    </section>
  );
}

export interface HistoryRecordsListProps {
  descriptor: HistoryPageDescriptor;
}

export function HistoryRecordsList({
  descriptor,
}: HistoryRecordsListProps) {
  return (
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
  );
}
