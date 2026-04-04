import { useState } from "react";

import { MobileWebAppShell } from "../app-shell";
import { createHistoryPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import {
  HistoryFilterTabs,
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
  const [activeFilter, setActiveFilter] = useState<"all" | "ready" | "pending">("all");

  return (
    <MobileWebAppShell route={mobileWebRoutes[3]}>
      <section className="mw-hero-card">
        <p className="mw-kicker">历史记录</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </section>

      <HistorySummaryRow summary={descriptor.summary} />
      <HistoryFilterTabs
        activeFilter={activeFilter}
        onChange={setActiveFilter}
      />

      <HistoryRecordsList
        descriptor={descriptor}
        activeFilter={activeFilter}
      />

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
