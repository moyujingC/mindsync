export type InterpretationVersion = "lite" | "pro";
export type InterpretationListFilter = "all" | "ready" | "pending";

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

export interface LiteStructuredReport {
  prompt_preview?: string | null;
  prompt_schema_validation_issues?: string[] | null;
  title: string;
  overall_impression: string;
  visual_elements_rendered: string;
  emotion_portrait_rendered: string;
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
  six_insights_rendered?: Record<string, string> | null;
  experiment_rendered?: string | null;
  pro_teaser: string;
}

export interface ProStructuredReport {
  prompt_preview?: string | null;
  prompt_schema_validation_issues?: string[] | null;
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

export interface ReportChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReportChatRequest {
  message: string;
  history?: ReportChatMessage[];
}

export interface ReportChatResponse {
  interpretation_id: string;
  reply: string;
}

export interface ReportDebugStep {
  key: string;
  label: string;
  status: string;
  created_at?: string | null;
  summary?: Record<string, unknown> | null;
}

export interface ReportDebugProfileResponse {
  interpretation_id: string;
  theme: string;
  status: string;
  generation_stage: string;
  generation_progress: number;
  version_purchased: string[];
  steps: ReportDebugStep[];
  layers: Record<string, unknown>;
  field_provenance: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
  prompt_debug: Record<string, unknown>;
  knowledge_debug?: Record<string, unknown> | null;
  insight_context_summary?: Record<string, unknown> | null;
  evidence_summary?: Record<string, unknown> | null;
  fallback_summary?: Record<string, unknown> | null;
}

export interface KnowledgeBuildSummaryResponse {
  build_info: Record<string, unknown>;
  quality: Record<string, unknown>;
  eval_summary?: Record<string, unknown> | null;
}

export interface KnowledgeFixturePreviewRequest {
  fixture_id: string;
  build_selector: string;
  version: InterpretationVersion;
}

export interface KnowledgeFixturePreviewResponse {
  fixture_meta: Record<string, unknown>;
  report_summary: Record<string, unknown>;
  knowledge_summary: Record<string, unknown>;
  regression_flags: string[];
  diff_from_current?: Record<string, unknown> | null;
}

export interface UpgradePlaceholderResponse {
  success: boolean;
  interpretation_id: string;
  version: "pro";
  enabled: boolean;
  status: string;
  message: string;
}

export type PurchaseState =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "fulfilled";

export interface StubWechatPayPayload {
  mode: "stub";
  order_id: string;
  next_action: "reconcile_after_host_payment";
}

export interface WechatPayRequestPaymentArgs {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

export interface WechatPayHostPayload {
  mode: "wechatpay";
  order_id: string;
  next_action: "wait_for_payment_confirmation";
  dry_run: boolean;
  request_payment_args: WechatPayRequestPaymentArgs;
}

export type MiniappWechatPayPayload = StubWechatPayPayload | WechatPayHostPayload;

export interface CreateMiniappOrderRequest {
  interpretation_id: string;
  product_type: InterpretationVersion;
  channel: "miniapp";
  open_id?: string | null;
  debug_canonical_user_id?: string | null;
}

export interface MiniappOrderResponse {
  order_id: string;
  interpretation_id: string;
  product_type: InterpretationVersion;
  channel: "miniapp";
  purchase_state: PurchaseState;
  payable_amount: number;
  currency: string;
  version_granted?: InterpretationVersion[] | null;
  latest_purchase_updated_at?: string | null;
  wechat_pay_payload?: MiniappWechatPayPayload | null;
}

export interface ReconcileMiniappOrderResponse extends MiniappOrderResponse {
  reconciled: boolean;
}

export interface NotifyMiniappWechatPaymentRequest {
  order_id: string;
  event: "paid" | "failed" | "cancelled";
  payment_reference?: string | null;
  raw_payload?: Record<string, unknown> | null;
}

export interface PricingInfo {
  lite: number;
  pro: number;
  upgrade_diff: number;
}
