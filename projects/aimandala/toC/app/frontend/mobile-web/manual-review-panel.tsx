import { useEffect, useMemo, useState } from "react";

import { getInterpretationReportDebug } from "../shared/api";
import type {
  DetectCirclesResponse,
  MandalaFlowState,
  ReportDebugProfileResponse,
} from "../shared/types";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";

type ReviewStepStatus = "pass" | "question" | "fail";

interface ManualReviewPanelProps {
  route: MobileWebRouteId;
  previewMode: boolean;
  draft: MobileWebUploadDraft;
  interpretationId: string;
  flowState: MandalaFlowState | null;
  detection: DetectCirclesResponse | null;
  runtimeReportDebugProfile?: ReportDebugProfileResponse | null;
}

const PLACEHOLDER_INTERPRETATION_IDS = new Set(["", "demo-interpretation-id"]);

const REVIEW_STEPS = [
  { id: "input", label: "1. 输入包确认" },
  { id: "visual", label: "2. Layer0 视觉事实" },
  { id: "rules", label: "3. Layer0 规则推导" },
  { id: "mapping", label: "4. 报告映射预览" },
] as const;

function formatJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function formatText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function resolveImagePreview(reviewInput: Record<string, unknown>, draft: MobileWebUploadDraft): string {
  const preview = formatText(reviewInput.image_preview_ref);
  if (preview) {
    return preview;
  }
  return draft.imagePath || "";
}

export function ManualReviewPanel({
  route,
  previewMode,
  draft,
  interpretationId,
  flowState,
  detection,
  runtimeReportDebugProfile = null,
}: ManualReviewPanelProps) {
  const [reportDebugProfile, setReportDebugProfile] =
    useState<ReportDebugProfileResponse | null>(runtimeReportDebugProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepStatus, setStepStatus] = useState<Record<string, ReviewStepStatus>>({});
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (runtimeReportDebugProfile) {
      setReportDebugProfile(runtimeReportDebugProfile);
    }
  }, [runtimeReportDebugProfile]);

  useEffect(() => {
    if (
      previewMode ||
      !interpretationId ||
      PLACEHOLDER_INTERPRETATION_IDS.has(interpretationId) ||
      runtimeReportDebugProfile
    ) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getInterpretationReportDebug(interpretationId)
      .then((profile) => {
        if (!cancelled) {
          setReportDebugProfile(profile);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "拉取人工审阅数据失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [interpretationId, previewMode, runtimeReportDebugProfile]);

  const knowledgeDebug = useMemo(
    () => toRecord(reportDebugProfile?.knowledge_debug),
    [reportDebugProfile],
  );
  const reviewInput = useMemo(
    () => toRecord(knowledgeDebug.review_input_package),
    [knowledgeDebug],
  );
  const reviewLayer0 = useMemo(
    () => toRecord(knowledgeDebug.review_layer0_summary),
    [knowledgeDebug],
  );
  const reviewMapping = useMemo(
    () => toRecord(knowledgeDebug.review_mapping_summary),
    [knowledgeDebug],
  );
  const layer0Evidence = useMemo(
    () => toRecord(knowledgeDebug.layer0_evidence),
    [knowledgeDebug],
  );
  const imagePreview = useMemo(
    () => resolveImagePreview(reviewInput, draft),
    [draft, reviewInput],
  );

  const fallbackInput = {
    image_path: draft.imagePath,
    theme: draft.theme,
    topic: draft.theme,
    topic_label: draft.theme,
    report_mode: draft.reportVariant ?? draft.reportType ?? "lite",
    painting_intention: draft.paintingIntention,
    painting_feeling: draft.paintingFeeling,
    inner_radius: detection?.inner_radius ?? draft.innerRadius ?? null,
    middle_radius: detection?.middle_radius ?? draft.middleRadius ?? null,
    three_circles_source: detection ? "auto_detect" : "user_override",
  };
  const effectiveInput = Object.keys(reviewInput).length ? reviewInput : fallbackInput;

  return (
    <aside className="browser-shell__panel browser-shell__panel--side browser-shell__panel--review">
      <div className="browser-shell__panel-header">
        <h2>人工逐步审阅</h2>
        <p className="muted">这里不做自动判定，只把当前输入包、Layer0 证据和报告映射整理成可人工审核的步骤。</p>
      </div>

      <section className="manual-review-meta">
        <div className="browser-debug-chip">
          <strong>interpretation</strong>
          <span>{reportDebugProfile?.interpretation_id ?? interpretationId ?? "--"}</span>
        </div>
        <div className="browser-debug-chip">
          <strong>report_mode</strong>
          <span>{formatText(effectiveInput.report_mode) || "--"}</span>
        </div>
        <div className="browser-debug-chip">
          <strong>topic</strong>
          <span>{formatText(effectiveInput.topic) || formatText(effectiveInput.theme) || "--"}</span>
        </div>
        <div className="browser-debug-chip">
          <strong>route</strong>
          <span>{route}</span>
        </div>
      </section>

      {loading ? <p className="muted">正在加载人工审阅数据...</p> : null}
      {error ? <p className="runtime-state runtime-state--error">{error}</p> : null}

      {REVIEW_STEPS.map((step) => {
        const status = stepStatus[step.id];
        const note = stepNotes[step.id] ?? "";
        return (
          <section key={step.id} className="browser-debug-section manual-review-step">
            <div className="browser-debug-section__header">
              <h3>{step.label}</h3>
              <span>{status ?? "未标记"}</span>
            </div>

            {step.id === "input" ? (
              <>
                {imagePreview ? (
                  <div className="manual-review-image-wrap">
                    <img src={imagePreview} alt="当前审阅图片" className="manual-review-image" />
                  </div>
                ) : null}
                <div className="browser-debug-kv">
                  <div>
                    <span>image_path</span>
                    <strong>{formatText(effectiveInput.image_path) || "--"}</strong>
                  </div>
                  <div>
                    <span>theme / topic_label</span>
                    <strong>{`${formatText(effectiveInput.theme) || "--"} / ${formatText(effectiveInput.topic_label) || "--"}`}</strong>
                  </div>
                  <div>
                    <span>inner / middle</span>
                    <strong>{`${formatText(effectiveInput.inner_radius) || "--"} / ${formatText(effectiveInput.middle_radius) || "--"}`}</strong>
                  </div>
                  <div>
                    <span>three_circles_source</span>
                    <strong>{formatText(effectiveInput.three_circles_source) || "--"}</strong>
                  </div>
                  <div>
                    <span>painting_intention</span>
                    <strong>{formatText(effectiveInput.painting_intention) || "缺少该输入"}</strong>
                  </div>
                  <div>
                    <span>painting_feeling</span>
                    <strong>{formatText(effectiveInput.painting_feeling) || "缺少该输入"}</strong>
                  </div>
                </div>
                <details className="browser-debug-json">
                  <summary>raw input package</summary>
                  <pre>{formatJson(effectiveInput)}</pre>
                </details>
              </>
            ) : null}

            {step.id === "visual" ? (
              <>
                <div className="manual-review-summary-list">
                  <article className="browser-debug-card">
                    <h4>visual_fact_summary</h4>
                    <p>{formatText(reviewLayer0.visual_fact_summary) || "缺少该摘要"}</p>
                  </article>
                  <article className="browser-debug-card">
                    <h4>per_circle_observation_summary</h4>
                    <p>{formatText(reviewLayer0.per_circle_observation_summary) || "缺少该摘要"}</p>
                  </article>
                  <article className="browser-debug-card">
                    <h4>shape_observation_summary</h4>
                    <p>{formatText(reviewLayer0.shape_observation_summary) || "缺少该摘要"}</p>
                  </article>
                  <article className="browser-debug-card">
                    <h4>direct_judgment_summary</h4>
                    <p>{formatText(reviewLayer0.direct_judgment_summary) || "缺少该摘要"}</p>
                  </article>
                </div>
                <details className="browser-debug-json">
                  <summary>raw Layer0 visual evidence</summary>
                  <pre>{formatJson({
                    circle_boundaries: toRecord(toRecord(layer0Evidence.visual_facts).circle_boundaries),
                    circle_colors: toRecord(toRecord(layer0Evidence.visual_facts).circle_colors),
                    weighted_element_distribution: toRecord(toRecord(layer0Evidence.visual_facts).weighted_element_distribution),
                    per_circle_color_analysis: toRecord(toRecord(toRecord(layer0Evidence.rule_evaluations).interpretation_method_trace).per_circle_color_analysis),
                    shape_analysis: toRecord(toRecord(toRecord(layer0Evidence.rule_evaluations).interpretation_method_trace).shape_analysis),
                    direct_judgment: toRecord(toRecord(toRecord(layer0Evidence.rule_evaluations).interpretation_method_trace).direct_judgment),
                  })}</pre>
                </details>
              </>
            ) : null}

            {step.id === "rules" ? (
              <>
                <div className="manual-review-summary-list">
                  <article className="browser-debug-card">
                    <h4>element_state_summary</h4>
                    <p>{formatText(reviewLayer0.element_state_summary) || "缺少该摘要"}</p>
                  </article>
                  <article className="browser-debug-card">
                    <h4>relation_summary</h4>
                    <p>{formatText(reviewLayer0.relation_summary) || "缺少该摘要"}</p>
                  </article>
                  <article className="browser-debug-card">
                    <h4>candidate_summary</h4>
                    <p>{formatText(reviewLayer0.candidate_summary) || "缺少该摘要"}</p>
                  </article>
                </div>
                <details className="browser-debug-json">
                  <summary>raw Layer0 rule evidence</summary>
                  <pre>{formatJson({
                    element_states: toRecord(toRecord(layer0Evidence.rule_evaluations).element_states),
                    triad_states: toRecord(toRecord(layer0Evidence.rule_evaluations).triad_states),
                    circle_relation_analysis: toRecord(toRecord(toRecord(layer0Evidence.rule_evaluations).interpretation_method_trace).circle_relation_analysis),
                    imbalance_trace: toRecord(toRecord(layer0Evidence.rule_evaluations).imbalance_trace),
                    primary_candidates: toArray(toRecord(toRecord(layer0Evidence.rule_evaluations).imbalance_trace).primary_candidates),
                    synthetic_signal: toRecord(toRecord(toRecord(layer0Evidence.rule_evaluations).imbalance_trace).synthetic_signal),
                  })}</pre>
                </details>
              </>
            ) : null}

            {step.id === "mapping" ? (
              <>
                <div className="manual-review-mapping-grid">
                  <article className="browser-debug-card">
                    <h4>Lite 产品区块</h4>
                    <pre>{formatJson(reviewMapping.lite_blocks)}</pre>
                  </article>
                  <article className="browser-debug-card">
                    <h4>Pro 产品区块</h4>
                    <pre>{formatJson(reviewMapping.pro_blocks)}</pre>
                  </article>
                </div>
              </>
            ) : null}

            <div className="manual-review-actions">
              {[
                ["pass", "通过"],
                ["question", "存疑"],
                ["fail", "不通过"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`manual-review-pill${status === value ? " manual-review-pill--active" : ""}`}
                  onClick={() => {
                    setStepStatus((current) => ({
                      ...current,
                      [step.id]: value as ReviewStepStatus,
                    }));
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="field">
              <span>人工备注</span>
              <textarea
                rows={3}
                value={note}
                placeholder="记录这一阶段你认为对/不对的地方"
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setStepNotes((current) => ({
                    ...current,
                    [step.id]: nextValue,
                  }));
                }}
              />
            </label>
          </section>
        );
      })}

      {previewMode ? (
        <p className="muted">当前处于 preview 模式，审阅页优先显示本地输入和已预载的 debug 数据。</p>
      ) : null}
      {flowState?.status?.generation_stage ? (
        <p className="muted">当前生成阶段：{flowState.status.generation_stage}</p>
      ) : null}
    </aside>
  );
}
