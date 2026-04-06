import {
  applyDetection,
  applyError,
  applyInterpretationCreated,
  applyReport,
  applyStatus,
  applyUpgradePlaceholder,
  initialMandalaFlowState,
  selectImage,
} from "../shared/core";
import {
  createInterpretation,
  detectCircles,
  getInterpretationReport,
  getInterpretationStatus,
  upgradeInterpretation,
} from "../shared/api";
import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  MandalaFlowState,
  ReportResponse,
  StartCreatePayload,
} from "../shared/types";

export interface MobileWebFlowSnapshot {
  state: MandalaFlowState;
  detection?: DetectCirclesResponse;
  interpretation?: CreateInterpretationResponse;
  status?: InterpretationStatusResponse;
  report?: ReportResponse;
}

export interface MobileWebReportPollingOptions {
  intervalMs?: number;
  maxAttempts?: number;
  onTick?: (snapshot: MobileWebFlowSnapshot) => void | Promise<void>;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function bootstrapMobileWebFlow(
  imagePath: string,
): Promise<MobileWebFlowSnapshot> {
  const state = selectImage(initialMandalaFlowState, imagePath);
  return { state };
}

export async function runMobileWebLiteFlow(
  payload: StartCreatePayload,
): Promise<MobileWebFlowSnapshot> {
  let state = selectImage(initialMandalaFlowState, payload.imagePath);

  try {
    const detection = await detectCircles({
      image_path: payload.imagePath,
    });
    state = applyDetection(state, detection);

    const interpretation = await createInterpretation({
      user_id: payload.userId,
      image_path: payload.imagePath,
      theme: payload.theme,
      painting_intention: payload.paintingIntention,
      painting_feeling: payload.paintingFeeling,
      inner_radius: payload.innerRadius,
      middle_radius: payload.middleRadius,
    });
    state = applyInterpretationCreated(state, interpretation);

    const status = await getInterpretationStatus(interpretation.interpretation_id);
    state = applyStatus(state, status);

    if (!status.report_ready) {
      return {
        state,
        detection,
        interpretation,
        status,
      };
    }

    const report = await getInterpretationReport(interpretation.interpretation_id);
    state = applyReport(state, report);

    return {
      state,
      detection,
      interpretation,
      status,
      report,
    };
  } catch (error) {
    state = applyError(
      state,
      error instanceof Error ? error.message : "Mobile web flow failed",
    );

    return {
      state,
    };
  }
}

export async function refreshMobileWebReport(
  interpretationId: string,
  currentState: MandalaFlowState = initialMandalaFlowState,
): Promise<MobileWebFlowSnapshot> {
  let state = currentState;

  try {
    const status = await getInterpretationStatus(interpretationId);
    state = applyStatus(state, status);

    if (!status.report_ready) {
      return {
        state,
        status,
      };
    }

    const report = await getInterpretationReport(interpretationId);
    state = applyReport(state, report);

    return {
      state,
      status,
      report,
    };
  } catch (error) {
    state = applyError(
      state,
      error instanceof Error ? error.message : "Failed to refresh report",
    );

    return {
      state,
    };
  }
}

export async function openMobileWebUpgradeEntry(
  interpretationId: string,
  currentState: MandalaFlowState = initialMandalaFlowState,
): Promise<MobileWebFlowSnapshot> {
  let state = currentState;

  try {
    const upgrade = await upgradeInterpretation(interpretationId);
    state = applyUpgradePlaceholder(state, upgrade);

    return {
      state,
    };
  } catch (error) {
    state = applyError(
      state,
      error instanceof Error ? error.message : "Failed to open upgrade entry",
    );

    return {
      state,
    };
  }
}

export async function refreshMobileWebProReport(
  interpretationId: string,
  currentState: MandalaFlowState = initialMandalaFlowState,
): Promise<MobileWebFlowSnapshot> {
  let state = currentState;

  try {
    const status = await getInterpretationStatus(interpretationId);
    state = applyStatus(state, status);

    const report = await getInterpretationReport(interpretationId, "pro");
    if (report?.version === "pro" && report.report) {
      state = applyReport(state, report);

      return {
        state,
        status,
        report,
      };
    }

    return {
      state,
      status,
      report,
    };
  } catch (error) {
    state = applyError(
      state,
      error instanceof Error ? error.message : "Failed to refresh pro report",
    );

    return {
      state,
    };
  }
}

export async function pollMobileWebReportUntilReady(
  interpretationId: string,
  currentState: MandalaFlowState = initialMandalaFlowState,
  options: MobileWebReportPollingOptions = {},
): Promise<MobileWebFlowSnapshot> {
  const { intervalMs = 1500, maxAttempts = 8, onTick } = options;
  let latest = currentState;
  let latestSnapshot: MobileWebFlowSnapshot = { state: latest };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    latestSnapshot = await refreshMobileWebReport(interpretationId, latest);
    latest = latestSnapshot.state;

    if (onTick) {
      await onTick(latestSnapshot);
    }

    if (latest.step !== "liteGenerating") {
      return latestSnapshot;
    }

    if (attempt < maxAttempts - 1) {
      await wait(intervalMs);
    }
  }

  return latestSnapshot;
}

export async function pollMobileWebProReportUntilReady(
  interpretationId: string,
  currentState: MandalaFlowState = initialMandalaFlowState,
  options: MobileWebReportPollingOptions = {},
): Promise<MobileWebFlowSnapshot> {
  const { intervalMs = 1500, maxAttempts = 8, onTick } = options;
  let latest = currentState;
  let latestSnapshot: MobileWebFlowSnapshot = { state: latest };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    latestSnapshot = await refreshMobileWebProReport(interpretationId, latest);
    latest = latestSnapshot.state;

    if (onTick) {
      await onTick(latestSnapshot);
    }

    if (
      latestSnapshot.report?.version === "pro" &&
      typeof latestSnapshot.report.report === "string" &&
      latestSnapshot.report.report.trim()
    ) {
      return latestSnapshot;
    }

    if (latest.step === "error") {
      return latestSnapshot;
    }

    if (attempt < maxAttempts - 1) {
      await wait(intervalMs);
    }
  }

  return latestSnapshot;
}
