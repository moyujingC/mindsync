import { getInterpretationList } from "../shared/api";
import { initialMandalaFlowState } from "../shared/core";

import {
  bootstrapMobileWebFlow,
  openMobileWebUpgradeEntry,
  refreshMobileWebReport,
  runMobileWebLiteFlow,
} from "./controller";
import type { HistoryFilterId } from "./components/history-cards";
import type { MobileWebHistoryPageProps } from "./page-shells/history-page";
import type { MobileWebReportPageProps } from "./page-shells/report-page";
import type { MobileWebUploadPageProps } from "./page-shells/upload-page";
import type { MobileWebUploadDraft } from "./state";
import { toStartCreatePayload } from "./state";
import type { InterpretationListQuery } from "../shared/types";

export async function loadUploadPage(
  draft: MobileWebUploadDraft,
): Promise<MobileWebUploadPageProps> {
  const bootstrap = await bootstrapMobileWebFlow(draft.imagePath);

  return {
    draft,
    detection: bootstrap.state.detection,
  };
}

export async function loadLiteReportPage(input: {
  draft: MobileWebUploadDraft;
  userId: string;
}): Promise<MobileWebReportPageProps> {
  const result = await runMobileWebLiteFlow(
    toStartCreatePayload(input.draft, input.userId),
  );

  return {
    state: result.state,
  };
}

export async function loadExistingReportPage(
  interpretationId: string,
): Promise<MobileWebReportPageProps> {
  const refreshed = await refreshMobileWebReport(
    interpretationId,
    initialMandalaFlowState,
  );

  return {
    state: refreshed.state,
  };
}

export async function loadUpgradePage(
  interpretationId: string,
): Promise<MobileWebReportPageProps> {
  const report = await loadExistingReportPage(interpretationId);
  const upgrade = await openMobileWebUpgradeEntry(
    interpretationId,
    report.state,
  );

  return {
    state: upgrade.state,
  };
}

export async function loadHistoryPage(
  userId: string,
  query: InterpretationListQuery = {},
): Promise<MobileWebHistoryPageProps> {
  const historyQuery: InterpretationListQuery = {
    filter: (query.filter as HistoryFilterId | undefined) ?? "all",
    limit: query.limit,
    theme: query.theme,
  };
  const records = await getInterpretationList(userId, historyQuery);

  return {
    records,
  };
}
