import { getInterpretationList } from "../shared/api";
import { initialMandalaFlowState } from "../shared/core";

import {
  bootstrapMobileWebFlow,
  refreshMobileWebReport,
  runMobileWebLiteFlow,
} from "./controller";
import type { MobileWebHistoryPageProps } from "./page-shells/history-page";
import type { MobileWebReportPageProps } from "./page-shells/report-page";
import type { MobileWebUploadPageProps } from "./page-shells/upload-page";
import type { MobileWebUploadDraft } from "./state";
import { toStartCreatePayload } from "./state";

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

export async function loadHistoryPage(
  userId: string,
): Promise<MobileWebHistoryPageProps> {
  const records = await getInterpretationList(userId);

  return {
    records,
  };
}
