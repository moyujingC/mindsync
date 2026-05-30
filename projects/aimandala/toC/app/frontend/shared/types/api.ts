export type InterpretationVersion = "lite" | "pro";
export type InterpretationListFilter = "all" | "ready" | "pending";

export interface InterpretationUpgradeHistoryEntry {
  from: InterpretationVersion | string;
  to: InterpretationVersion | string;
  price_diff: number;
  at: string;
}

export interface InterpretationListQuery {
  filter?: InterpretationListFilter;
  limit?: number;
  theme?: string;
}

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

export interface UploadImageResponse {
  success: boolean;
  image_path: string;
  storage_backend: string;
  storage_key: string;
  original_filename: string;
  content_type?: string | null;
  size_bytes: number;
  image_url?: string | null;
  image_local_expires_at?: string | null;
}

export interface CreateInterpretationRequest {
  user_id: string;
  image_path: string;
  image_url?: string | null;
  storage_backend?: string | null;
  storage_key?: string | null;
  image_local_expires_at?: string | null;
  theme?: string;
  painting_intention?: string | null;
  painting_feeling?: string | null;
  inner_radius?: number;
  middle_radius?: number;
}

export interface VisualObservationUnit {
  id?: string;
  position?: string;
  color?: string;
  shape?: string;
  visible_evidence?: string;
  description?: string;
  evidence?: string;
}

export interface VisualCircleObservation {
  summary?: string;
  visual_units?: VisualObservationUnit[];
  color_distribution?: string[];
  dominant_colors?: string[];
  shape?: string;
  pattern?: string;
  texture?: string;
  intensity?: string;
}

export interface WealthReportRequest {
  image_path: string;
  report_mode?: InterpretationVersion;
  redeem_code?: string;
  painting_intention?: string;
  painting_feeling?: string;
  inner_radius?: number;
  middle_radius?: number;
  visual_observations?: {
    global_visual_summary?: string;
    circles?: {
      inner?: VisualCircleObservation;
      middle?: VisualCircleObservation;
      outer?: VisualCircleObservation;
    };
    evidence_summary?: string[];
    uncertainties?: string[];
  } | null;
  storage_backend?: string;
  storage_key?: string;
}

export interface WealthReportResponse {
  success: boolean;
  report_id: string;
  report_mode: InterpretationVersion | string;
  final_report_md: string;
  final_report: Record<string, unknown>;
  visual_draft?: Record<string, unknown> | null;
  prompt_pack_manifest?: Record<string, unknown> | null;
  quality_gate?: Record<string, unknown> | null;
  run_summary?: Record<string, unknown> | null;
}

export interface ReportPersona {
  persona_id: string;
  persona_version: string;
  display_name: string;
  role_label: string;
  scope: string;
  boundaries: string[];
}

export interface ReportFollowupTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ReportFollowupRequest {
  report_id: string;
  question: string;
  report_mode?: InterpretationVersion | string;
  final_report_md: string;
  final_report?: Record<string, unknown>;
  visual_draft?: Record<string, unknown> | null;
  history?: ReportFollowupTurn[];
  theme?: string;
  theme_label?: string;
  painting_intention?: string;
  painting_feeling?: string;
}

export interface ReportFollowupResponse {
  success: boolean;
  report_id: string;
  answer_md: string;
  referenced_report_sections: Array<{ label: string; quote: string }>;
  safety: Record<string, unknown>;
  out_of_scope: boolean;
  persona: ReportPersona | Record<string, unknown>;
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
  upgrade_history?: InterpretationUpgradeHistoryEntry[];
  image_url?: string | null;
  storage_backend?: string | null;
  storage_key?: string | null;
  image_local_expires_at?: string | null;
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
  image_url?: string | null;
  storage_backend?: string | null;
  storage_key?: string | null;
  image_local_expires_at?: string | null;
}

export interface ReportResponse {
  interpretation_id: string;
  version: InterpretationVersion | string;
  title?: string | null;
  overall_impression?: string | null;
  structured?: Record<string, unknown> | null;
  persona?: ReportPersona | null;
  report?: string | null;
  ai_qa_context?: string | null;
  can_upgrade: boolean;
  upgrade_price?: number | null;
  error?: string | null;
  image_url?: string | null;
  storage_backend?: string | null;
  storage_key?: string | null;
  image_local_expires_at?: string | null;
  visual_draft?: Record<string, unknown> | null;
  prompt_pack_manifest?: Record<string, unknown> | null;
  quality_gate?: Record<string, unknown> | null;
  run_summary?: Record<string, unknown> | null;
}

export type ReportDebugProfileResponse = Record<string, unknown> & {
  interpretation_id?: string;
  knowledge_debug?: Record<string, unknown>;
};

export type KnowledgeBuildSummaryResponse = Record<string, unknown>;

export type KnowledgeFixturePreviewResponse = Record<string, unknown>;
