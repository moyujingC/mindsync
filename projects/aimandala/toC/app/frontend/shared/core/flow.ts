import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  LiteStructuredReport,
  MandalaFlowState,
  ProStructuredReport,
  ReportResponse,
  SelectedImageRef,
  WealthReportResponse,
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

export function applyWealthReport(
  state: MandalaFlowState,
  response: WealthReportResponse,
): MandalaFlowState {
  const report: ReportResponse = {
    interpretation_id: response.report_id,
    version: response.report_mode,
    title: typeof response.final_report.title === "string"
      ? response.final_report.title
      : "财富议题曼陀罗解读",
    overall_impression: typeof response.final_report.summary === "string"
      ? response.final_report.summary
      : null,
    structured: {
      topic_context: response.topic_context,
      current_reading: typeof response.final_report.summary === "string"
        ? response.final_report.summary
        : response.final_report_md,
      visual_basis: response.selected_signal_ids.join("、") || "已基于画面证据生成。",
      pattern_interpretation: response.selected_clause_ids.join("、") || "财富议题候选条款已生成。",
      life_connection: response.boundaries.join("；") || "这份报告聚焦财富议题，不输出财务承诺。",
      pro_report_entry: {
        title: "更深层财富议题解读",
        summary: "后续可在 Pro 报告中展开机制、根因链和阶段性调节路径。",
        product_note: "Pro 能力需要围绕当前新报告核心重新接入。",
      },
    },
    report: response.final_report_md,
    ai_qa_context: null,
    can_upgrade: false,
    upgrade_price: null,
    error: response.success ? null : "财富报告质量门未通过",
  };

  return applyReport(state, report);
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
