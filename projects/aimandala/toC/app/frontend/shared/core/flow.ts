import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  LiteStructuredReport,
  MandalaFlowState,
  ProStructuredReport,
  ReportResponse,
  SelectedImageRef,
  UpgradePlaceholderResponse,
} from "../types";

export const initialMandalaFlowState: MandalaFlowState = {
  step: "idle",
  selectedImage: null,
  detection: null,
  geometry: null,
  interpretation: null,
  status: null,
  report: null,
  lastError: null,
};

export function selectImage(
  state: MandalaFlowState,
  imagePath: string,
): MandalaFlowState {
  const selectedImage: SelectedImageRef = { imagePath };
  return {
    ...state,
    selectedImage,
    lastError: null,
  };
}

export function applyDetection(
  state: MandalaFlowState,
  detection: DetectCirclesResponse,
): MandalaFlowState {
  return {
    ...state,
    step: "detectingCircles",
    detection,
    geometry: detection.geometry_suggestion ?? null,
    lastError: null,
  };
}

export function applyInterpretationCreated(
  state: MandalaFlowState,
  interpretation: CreateInterpretationResponse,
): MandalaFlowState {
  return {
    ...state,
    step: interpretation.report_ready ? "liteReady" : "liteGenerating",
    interpretation,
    lastError: null,
  };
}

export function applyStatus(
  state: MandalaFlowState,
  status: InterpretationStatusResponse,
): MandalaFlowState {
  return {
    ...state,
    step: status.report_ready ? "liteReady" : "liteGenerating",
    status,
    lastError: null,
  };
}

export function applyReport(
  state: MandalaFlowState,
  report: ReportResponse,
): MandalaFlowState {
  return {
    ...state,
    step: report.version === "pro" ? "upgradePlaceholder" : "liteReady",
    report,
    lastError: report.error ?? null,
  };
}

export function applyUpgradePlaceholder(
  state: MandalaFlowState,
  upgrade: UpgradePlaceholderResponse,
): MandalaFlowState {
  return {
    ...state,
    step: "upgradePlaceholder",
    report: {
      interpretation_id: upgrade.interpretation_id,
      version: "pro",
      title: "一梳 Pro 版入口",
      overall_impression: upgrade.message,
      structured: null,
      report: upgrade.message,
      ai_qa_context: null,
      can_upgrade: false,
      upgrade_price: null,
      error: null,
    },
    lastError: null,
  };
}

export function applyError(
  state: MandalaFlowState,
  message: string,
): MandalaFlowState {
  return {
    ...state,
    step: "error",
    lastError: message,
  };
}

export function getLiteStructuredReport(
  report: ReportResponse | null,
): LiteStructuredReport | null {
  if (!report?.structured) {
    return null;
  }

  const structured = report.structured as Partial<LiteStructuredReport>;
  if (
    typeof structured.title !== "string" ||
    typeof structured.overall_impression !== "string" ||
    typeof structured.visual_elements_rendered !== "string" ||
    typeof structured.emotion_portrait_rendered !== "string" ||
    typeof structured.pro_teaser !== "string"
  ) {
    return null;
  }

  return structured as LiteStructuredReport;
}

export function getProStructuredReport(
  report: ReportResponse | null,
): ProStructuredReport | null {
  if (!report?.structured || report.version !== "pro") {
    return null;
  }

  const structured = report.structured as Partial<ProStructuredReport>;
  if (
    typeof structured !== "object" ||
    structured === null
  ) {
    return null;
  }

  return structured as ProStructuredReport;
}
