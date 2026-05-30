import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  MandalaFlowState,
  ReportPersona,
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

function getReportStringValue(
  source: Record<string, unknown>,
  key: string,
): string | null {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseReportPersona(source: Record<string, unknown>): ReportPersona | null {
  const value = source.persona;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const persona = value as Record<string, unknown>;
  const personaId = getReportStringValue(persona, "persona_id");
  const personaVersion = getReportStringValue(persona, "persona_version");
  const displayName = getReportStringValue(persona, "display_name");
  const roleLabel = getReportStringValue(persona, "role_label");
  const scope = getReportStringValue(persona, "scope");
  const boundaries = Array.isArray(persona.boundaries)
    ? persona.boundaries.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (!personaId || !personaVersion || !displayName || !roleLabel || !scope) {
    return null;
  }

  return {
    persona_id: personaId,
    persona_version: personaVersion,
    display_name: displayName,
    role_label: roleLabel,
    scope,
    boundaries,
  };
}

export function applyWealthReport(
  state: MandalaFlowState,
  response: WealthReportResponse,
): MandalaFlowState {
  const finalReport = response.final_report;
  const title = getReportStringValue(finalReport, "title") ?? "财富关系曼陀罗解读";
  const overallImpression =
    getReportStringValue(finalReport, "summary") ??
    getReportStringValue(finalReport, "overall_impression");
  const persona = parseReportPersona(finalReport);
  const report: ReportResponse = {
    interpretation_id: response.report_id,
    version: response.report_mode,
    title,
    overall_impression: overallImpression,
    structured: finalReport,
    persona,
    report: response.final_report_md,
    ai_qa_context: null,
    can_upgrade: false,
    upgrade_price: null,
    error: response.success ? null : "财富报告质量门未通过",
    visual_draft: response.visual_draft,
    prompt_pack_manifest: response.prompt_pack_manifest,
    quality_gate: response.quality_gate,
    run_summary: response.run_summary,
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
