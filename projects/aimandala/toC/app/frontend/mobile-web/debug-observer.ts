import type {
  DetectCirclesResponse,
  InterpretationStatusResponse,
  MandalaFlowState,
  ReportResponse,
} from "../shared/types";
import type { MobileWebAppProps } from "./app";
import type { MobileWebUploadDraft } from "./state";

export interface MobileWebRuntimeDebugSnapshot {
  route: MobileWebAppProps["route"];
  runtimeBusy: boolean;
  historyBusy: boolean;
  uploadDetecting: boolean;
  uploadDetectError: string | null;
  uploadDraft: MobileWebUploadDraft | null;
  flowState: MandalaFlowState | null;
  reportSummary: {
    version?: string;
    title?: string | null;
    canUpgrade?: boolean;
    hasStructured?: boolean;
    hasMarkdown?: boolean;
    aiQaContext?: boolean;
  } | null;
  detection: DetectCirclesResponse | null;
  status: InterpretationStatusResponse | null;
  report: ReportResponse | null;
}

export interface DebugTimelineSnapshot {
  route: string;
  previewMode: boolean;
  uploadDraft: MobileWebUploadDraft | null;
  flowState: MandalaFlowState | null;
  detection: DetectCirclesResponse | null;
  detectError: string | null;
  report: ReportResponse | null;
  status: InterpretationStatusResponse | null;
  runtimeBusy: boolean;
  historyBusy: boolean;
  uploadDetecting: boolean;
}

export interface DebugTimelineEntry {
  id: string;
  sessionId: string;
  createdAt: string;
  source: "preview" | "runtime";
  title: string;
  subtitle: string;
  snapshot: DebugTimelineSnapshot;
}
