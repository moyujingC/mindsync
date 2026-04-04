import { MobileWebAppShell } from "../app-shell";
import { createHistoryPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import {
  HistoryRecordsList,
  HistorySummaryRow,
} from "../components/history-cards";
import type { InterpretationRecordResponse } from "../../shared/types";

export interface MobileWebHistoryPageProps {
  records: InterpretationRecordResponse[];
  onBackToUpload?: () => void;
}

export function MobileWebHistoryPage({
  records,
  onBackToUpload,
}: MobileWebHistoryPageProps) {
  const descriptor = createHistoryPageDescriptor(records);

  return (
    <MobileWebAppShell route={mobileWebRoutes[3]}>
      <section className="mw-hero-card">
        <p className="mw-kicker">历史记录</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </section>

      <HistorySummaryRow summary={descriptor.summary} />

      <HistoryRecordsList descriptor={descriptor} />

      <footer className="mw-footer-action">
        <button
          type="button"
          className="mw-secondary-button"
          onClick={onBackToUpload}
        >
          返回上传页
        </button>
      </footer>
    </MobileWebAppShell>
  );
}
