import {
  applyDetection,
  applyError,
  applyInterpretationCreated,
  applyReport,
  applyStatus,
  initialMandalaFlowState,
  selectImage,
} from "../shared/core";
import {
  createInterpretation,
  detectCircles,
  getInterpretationReport,
  getInterpretationStatus,
} from "../shared/api";
import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationVersion,
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

function hasResolvedCircleRadii(
  payload: StartCreatePayload,
): payload is StartCreatePayload & { innerRadius: number; middleRadius: number } {
  return (
    typeof payload.innerRadius === "number" &&
    !Number.isNaN(payload.innerRadius) &&
    typeof payload.middleRadius === "number" &&
    !Number.isNaN(payload.middleRadius)
  );
}

function normalizeCirclePercent(value: number): number {
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

function normalizeCircleRatio(value: number): number {
  const normalized = value <= 1 ? value : value / 100;
  return Math.max(0, Math.min(1, normalized));
}

function buildManualDetection(
  innerRadius: number,
  middleRadius: number,
): DetectCirclesResponse {
  return {
    inner_radius: normalizeCircleRatio(innerRadius),
    middle_radius: normalizeCircleRatio(middleRadius),
    confidence: 1,
    method: "manual_confirmed",
    geometry_suggestion: null,
    debug_info: null,
  };
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
    let detection: DetectCirclesResponse | undefined;

    if (hasResolvedCircleRadii(payload)) {
      detection = buildManualDetection(payload.innerRadius, payload.middleRadius);
      state = applyDetection(state, detection);
    } else {
      detection = await detectCircles({ image_path: payload.imagePath });
      state = applyDetection(state, detection);
    }

    const interpretation = await createInterpretation({
      user_id: payload.userId,
      image_path: payload.imagePath,
      storage_backend: payload.storageBackend,
      storage_key: payload.storageKey,
      image_local_expires_at: payload.imageLocalExpiresAt,
      theme: payload.theme,
      painting_intention: payload.paintingIntention,
      painting_feeling: payload.paintingFeeling,
      inner_radius: payload.innerRadius ?? (detection ? normalizeCirclePercent(detection.inner_radius) : undefined),
      middle_radius: payload.middleRadius ?? (detection ? normalizeCirclePercent(detection.middle_radius) : undefined),
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

    const report = await getInterpretationReport(
      interpretation.interpretation_id,
      "lite",
    );
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
  reportType: InterpretationVersion,
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

    const report = await getInterpretationReport(interpretationId, reportType);
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

export async function pollMobileWebReportUntilReady(
  interpretationId: string,
  reportType: InterpretationVersion = "lite",
  currentState: MandalaFlowState = initialMandalaFlowState,
  options: MobileWebReportPollingOptions = {},
): Promise<MobileWebFlowSnapshot> {
  const { intervalMs = 1500, maxAttempts = 8, onTick } = options;
  let latest = currentState;
  let latestSnapshot: MobileWebFlowSnapshot = { state: latest };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    latestSnapshot = await refreshMobileWebReport(interpretationId, reportType, latest);
    latest = latestSnapshot.state;

    if (onTick) {
      await onTick(latestSnapshot);
    }

    const readyForType =
      reportType === "pro"
        ? latestSnapshot.report?.version === "pro" &&
          typeof latestSnapshot.report.report === "string" &&
          latestSnapshot.report.report.trim().length > 0
        : latest.step !== "liteGenerating";

    if (readyForType) {
      return latestSnapshot;
    }

    if (attempt < maxAttempts - 1) {
      await wait(intervalMs);
    }
  }

  if (latest.step === "liteGenerating" || reportType === "pro") {
    latestSnapshot = {
      ...latestSnapshot,
      state: applyError(
        latest,
        reportType === "pro"
          ? "Pro 报告生成时间较长，请稍后到历史记录中继续查看。"
          : "Lite 报告生成超时，请稍后重试。",
      ),
    };
  }

  return latestSnapshot;
}
