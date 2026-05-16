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
  // Temporary access URL. Long-lived identity lives in storage_backend + storage_key.
  image_url?: string | null;
  image_local_expires_at?: string | null;
}

export interface CreateInterpretationRequest {
  user_id: string;
  image_path: string;
  // Compatibility-only temporary URL; formal creation should rely on storage_key.
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
  topic: "wealth";
  report_mode: InterpretationVersion | string;
  final_report_md: string;
  final_report: Record<string, unknown>;
  selected_signal_ids: string[];
  selected_clause_ids: string[];
  selected_module_ids: string[];
  boundaries: string[];
  topic_context: ReportTopicContext;
  quality_gate: Record<string, unknown>;
  agent_output: Record<string, unknown>;
  report_context_package: Record<string, unknown>;
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

export interface ReportTopicContext {
  topic: string;
  topic_label: string;
  report_mode: InterpretationVersion | string;
  orientation: {
    intro: string;
    focus: string;
    key_terms: Array<{
      term: string;
      explanation: string;
    }>;
  };
}

export interface LiteStructuredReport {
  prompt_preview?: string | null;
  prompt_schema_validation_issues?: string[] | null;
  topic_context: ReportTopicContext;
  current_reading: string;
  visual_basis: string;
  pattern_interpretation: string;
  life_connection: string;
  self_understanding_blocks?: {
    title?: string;
    opening_hit?: string;
    visual_evidence?: {
      summary?: string;
      anchors?: string[];
    } | null;
    state_interpretation?: {
      current_state?: string;
      emotional_tension?: string;
      explanation_chain?: string;
    } | null;
    pattern_naming?: {
      pattern_name?: string;
      pattern_description?: string;
      protective_logic?: string;
    } | null;
    reality_connection?: {
      life_dimension?: string;
      typical_scene?: string;
      current_impact?: string;
    } | null;
    next_step?: {
      direction?: string;
      action?: string;
    } | null;
    theme_insights?: {
      scene?: string;
      impact?: string;
      awareness?: string;
    } | null;
    daily_awareness?: Array<{
      day?: number;
      title?: string;
      content?: string;
    }> | null;
  } | null;
  story?: {
    base?: { content?: string; connector?: string | null } | null;
    contradiction?: { content?: string; connector?: string | null } | null;
    pattern?: { content?: string; connector?: string | null } | null;
    defense?: { content?: string; connector?: string | null } | null;
    block?: { content?: string; connector?: string | null } | null;
    light?: { content?: string; connector?: string | null } | null;
  } | null;
  theme_insights?: {
    scene?: string;
    impact?: string;
    awareness?: string;
  } | null;
  three_awareness?: Array<{
    day?: number;
    title?: string;
    content?: string;
  }> | null;
  lite_healing_guidance?: {
    directions?: Array<{
      title?: string;
      content?: string;
    }> | null;
    micro_practices?: Array<{
      title?: string;
      content?: string;
    }> | null;
  } | null;
  six_insights_rendered?: Record<string, string> | null;
  experiment_rendered?: string | null;
  pro_report_entry: {
    title?: string;
    summary?: string;
    product_note?: string;
  };
  pro_teaser?: string | null;
}

export interface ProStructuredReport {
  prompt_preview?: string | null;
  prompt_schema_validation_issues?: string[] | null;
  topic_context: ReportTopicContext;
  deep_impression: string;
  evidence_digest: string;
  imbalance_diagnosis: string;
  root_cause_chain: {
    surface?: string;
    mechanism?: string;
    core?: string;
  };
  deep_structure_interpretation: string;
  healing_plan: Array<{ phase?: string; focus?: string; practice?: string }>;
  first_impression?: string | null;
  core_insight_table?: Record<string, string> | null;
  three_circles_detailed?: Record<string, { label?: string; reading?: string }> | null;
  micro_analysis_detailed?: Record<string, string> | null;
  imbalance_confirmed?: Record<string, string> | null;
  root_cause?: Record<string, string> | null;
  healing_suggestions?: Array<{ phase?: string; focus?: string; practice?: string }> | null;
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
  image_url?: string | null;
  storage_backend?: string | null;
  storage_key?: string | null;
  image_local_expires_at?: string | null;
}

export type ReportDebugProfileResponse = Record<string, unknown> & {
  interpretation_id?: string;
  knowledge_debug?: Record<string, unknown>;
};

export type KnowledgeBuildSummaryResponse = Record<string, unknown>;

export type KnowledgeFixturePreviewResponse = Record<string, unknown>;
