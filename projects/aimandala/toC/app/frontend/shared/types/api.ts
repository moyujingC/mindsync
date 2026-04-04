export type InterpretationVersion = "lite" | "pro";

export interface CircleGeometrySuggestion {
  shape_type: "circle" | "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  inner_t: number;
  middle_t: number;
}

export interface DetectCirclesRequest {
  image_path: string;
  confidence_threshold?: number;
}

export interface DetectCirclesResponse {
  inner_radius: number;
  middle_radius: number;
  confidence: number;
  method: string;
  geometry_suggestion?: CircleGeometrySuggestion | null;
  debug_info?: Record<string, unknown> | null;
}

export interface CreateInterpretationRequest {
  user_id: string;
  image_path: string;
  theme?: string;
  painting_intention?: string | null;
  painting_feeling?: string | null;
  inner_radius?: number;
  middle_radius?: number;
}

export interface CreateInterpretationResponse {
  success: boolean;
  interpretation_id: string;
  version: InterpretationVersion;
  status: string;
  generation_stage: string;
  generation_progress: number;
  three_circles: {
    inner_radius: number;
    middle_radius: number;
  };
  auto_detected: boolean;
  existing: boolean;
  report_ready: boolean;
}

export interface InterpretationRecordResponse {
  interpretation_id: string;
  user_id: string;
  theme: string;
  status: string;
  generation_stage: string;
  generation_progress: number;
  version_purchased: string[];
  three_circles: {
    inner_radius: number;
    middle_radius: number;
  };
  auto_detected: boolean;
  can_upgrade: boolean;
  created_at: string;
}

export interface InterpretationStatusResponse {
  interpretation_id: string;
  status: string;
  generation_stage: string;
  generation_progress: number;
  report_ready: boolean;
  version_purchased: string[];
  three_circles: {
    inner_radius: number;
    middle_radius: number;
  };
  auto_detected: boolean;
  can_upgrade: boolean;
}

export interface LiteStructuredReport {
  title: string;
  overall_impression: string;
  visual_elements_rendered: string;
  emotion_portrait_rendered: string;
  pro_teaser: string;
}

export interface ReportResponse {
  interpretation_id: string;
  version: InterpretationVersion | string;
  title?: string | null;
  overall_impression?: string | null;
  structured?: LiteStructuredReport | Record<string, unknown> | null;
  report?: string | null;
  ai_qa_context?: string | null;
  can_upgrade: boolean;
  upgrade_price?: number | null;
  error?: string | null;
}

export interface UpgradePlaceholderResponse {
  success: boolean;
  interpretation_id: string;
  version: "pro";
  enabled: boolean;
  status: string;
  message: string;
}

export interface PricingInfo {
  lite: number;
  pro: number;
  upgrade_diff: number;
}
