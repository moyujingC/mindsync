import { getInterpretationList } from "../shared/api";
import { initialMandalaFlowState } from "../shared/core";

import { bootstrapMobileWebFlow, refreshMobileWebReport, runMobileWebLiteFlow } from "./controller";
import { MobileWebAppShell } from "./app-shell";
import { createHistoryPageDescriptor, createReportPageDescriptor, createUploadPageDescriptor } from "./pages";
import { mobileWebRoutes } from "./routes";
import { getMobileWebPrimaryAction, toStartCreatePayload } from "./state";
import { createMobileWebPageViewModel } from "./view-model";

export async function renderUploadEntry(imagePath: string) {
  const bootstrap = await bootstrapMobileWebFlow(imagePath);
  const descriptor = createUploadPageDescriptor(
    {
      imagePath,
      theme: "general",
      paintingIntention: "",
      paintingFeeling: "",
    },
    bootstrap.state.detection,
  );

  return (
    <MobileWebAppShell route={mobileWebRoutes[0]}>
      <pre>{JSON.stringify(descriptor, null, 2)}</pre>
    </MobileWebAppShell>
  );
}

export async function renderLiteResultEntry(params: {
  imagePath: string;
  userId: string;
  theme?: string;
  paintingIntention?: string;
  paintingFeeling?: string;
}) {
  const result = await runMobileWebLiteFlow(
    toStartCreatePayload(
      {
        imagePath: params.imagePath,
        theme: params.theme || "general",
        paintingIntention: params.paintingIntention || "",
        paintingFeeling: params.paintingFeeling || "",
      },
      params.userId,
    ),
  );

  const viewModel = createMobileWebPageViewModel(
    result.state,
    getMobileWebPrimaryAction(result.state),
  );
  const descriptor = createReportPageDescriptor(viewModel);

  return (
    <MobileWebAppShell route={mobileWebRoutes[2]}>
      <pre>{JSON.stringify(descriptor, null, 2)}</pre>
    </MobileWebAppShell>
  );
}

export async function renderHistoryEntry(userId: string) {
  const records = await getInterpretationList(userId);
  const descriptor = createHistoryPageDescriptor(records);

  return (
    <MobileWebAppShell route={mobileWebRoutes[3]}>
      <pre>{JSON.stringify(descriptor, null, 2)}</pre>
    </MobileWebAppShell>
  );
}

export async function refreshReportEntry(interpretationId: string) {
  const refreshed = await refreshMobileWebReport(
    interpretationId,
    initialMandalaFlowState,
  );
  const viewModel = createMobileWebPageViewModel(
    refreshed.state,
    getMobileWebPrimaryAction(refreshed.state),
  );
  const descriptor = createReportPageDescriptor(viewModel);

  return (
    <MobileWebAppShell route={mobileWebRoutes[2]}>
      <pre>{JSON.stringify(descriptor, null, 2)}</pre>
    </MobileWebAppShell>
  );
}
