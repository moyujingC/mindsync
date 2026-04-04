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
      <header>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </header>

      <ul>
        {descriptor.items.map((item) => (
          <li key={item.interpretationId}>
            <h3>{item.title}</h3>
            <p>{item.subtitle}</p>
            <small>{item.canOpenReport ? "可查看报告" : "报告未就绪"}</small>
          </li>
        ))}
      </ul>
    </MobileWebAppShell>
  );
}
