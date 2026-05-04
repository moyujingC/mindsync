import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  LiteStructuredReport,
  MandalaFlowState,
  ProStructuredReport,
  ReportResponse,
  SelectedImageRef,
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
    step: report.version === "pro" ? "proReady" : "liteReady",
    report,
    lastError: report.error ?? null,
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
    typeof structured.topic_context !== "object" ||
    structured.topic_context === null ||
    typeof structured.current_reading !== "string" ||
    typeof structured.visual_basis !== "string" ||
    typeof structured.pattern_interpretation !== "string" ||
    typeof structured.life_connection !== "string" ||
    typeof structured.pro_report_entry !== "object" ||
    structured.pro_report_entry === null
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
    structured === null ||
    typeof structured.topic_context !== "object" ||
    structured.topic_context === null ||
    typeof structured.deep_impression !== "string" ||
    typeof structured.evidence_digest !== "string" ||
    typeof structured.imbalance_diagnosis !== "string" ||
    typeof structured.root_cause_chain !== "object" ||
    structured.root_cause_chain === null ||
    typeof structured.deep_structure_interpretation !== "string" ||
    !Array.isArray(structured.healing_plan)
  ) {
    return null;
  }

  return structured as ProStructuredReport;
}
