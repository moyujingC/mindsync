import type {
  CircleGeometrySuggestion,
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  ReportResponse,
} from "./api";

export type MandalaFlowStep =
  | "idle"
  | "detectingCircles"
  | "liteGenerating"
  | "liteReady"
  | "proReady"
  | "error";

export interface SelectedImageRef {
  imagePath: string;
}

export interface MandalaFlowState {
  step: MandalaFlowStep;
  selectedImage: SelectedImageRef | null;
  detection: DetectCirclesResponse | null;
  geometry: CircleGeometrySuggestion | null;
  interpretation: CreateInterpretationResponse | null;
  status: InterpretationStatusResponse | null;
  report: ReportResponse | null;
  lastError: string | null;
}

export interface StartCreatePayload {
  userId: string;
  imagePath: string;
  imageUrl?: string | null;
  storageBackend?: string | null;
  storageKey?: string | null;
  imageLocalExpiresAt?: string | null;
  theme?: string;
  redeemCode?: string;
  paintingIntention?: string;
  paintingFeeling?: string;
  innerRadius?: number;
  middleRadius?: number;
}
