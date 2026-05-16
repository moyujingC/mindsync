import {
  applyDetection,
  applyError,
  applyWealthReport,
  initialMandalaFlowState,
  selectImage,
} from "../shared/core";
import { createWealthReport } from "../shared/api";
import type {
  DetectCirclesResponse,
  InterpretationVersion,
  MandalaFlowState,
  ReportResponse,
  StartCreatePayload,
  WealthReportResponse,
} from "../shared/types";
import type { MobileWebReportVariant } from "./state";

export interface MobileWebFlowSnapshot {
  state: MandalaFlowState;
  detection?: DetectCirclesResponse;
  wealthReport?: WealthReportResponse;
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
  return runMobileWebReportFlow(payload, "lite");
}

export async function runMobileWebReportFlow(
  payload: StartCreatePayload,
  reportMode: MobileWebReportVariant = "lite",
): Promise<MobileWebFlowSnapshot> {
  let state = selectImage(initialMandalaFlowState, payload.imagePath);

  try {
    let detection: DetectCirclesResponse | undefined;

    if (hasResolvedCircleRadii(payload)) {
      detection = buildManualDetection(payload.innerRadius, payload.middleRadius);
      state = applyDetection(state, detection);
    } else {
      throw new Error("manual three-circle boundaries are required");
    }

    const wealthReport = await createWealthReport({
      image_path: payload.imagePath,
      storage_backend: payload.storageBackend ?? undefined,
      storage_key: payload.storageKey ?? undefined,
      report_mode: reportMode,
      painting_intention: payload.paintingIntention,
      painting_feeling: payload.paintingFeeling,
      inner_radius: normalizeCirclePercent(detection.inner_radius),
      middle_radius: normalizeCirclePercent(detection.middle_radius),
    });
    state = applyWealthReport(state, wealthReport);

    return {
      state,
      detection,
      wealthReport,
      report: state.report ?? undefined,
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

  return {
    state: applyError(
      state,
      `Report refresh is not available for ${interpretationId} (${reportType}) on the current report API.`,
    ),
  };
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
