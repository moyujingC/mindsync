// @vitest-environment jsdom

import { type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

import { ManualReviewPanel } from "./manual-review-panel";

const draft = {
  imagePath: "/tmp/mandala.png",
  theme: "wealth_career",
  reportVariant: "lite" as const,
  reportType: "lite" as const,
  paintingIntention: "看清楚工作推进里的卡点",
  paintingFeeling: "有点紧，但也想继续往前",
};

const reportDebugProfile: ComponentProps<typeof ManualReviewPanel>["runtimeReportDebugProfile"] = {
  interpretation_id: "ipt-review-1",
  theme: "wealth_career",
  status: "completed",
  generation_stage: "report_ready",
  generation_progress: 100,
  version_purchased: ["lite"],
  steps: [],
  layers: {},
  field_provenance: {},
  diagnostics: {},
  prompt_debug: {},
  knowledge_debug: {
    review_input_package: {
      image_path: "/tmp/mandala.png",
      image_preview_ref: "",
      theme: "wealth_career",
      topic: "wealth_career",
      topic_label: "财富事业",
      report_mode: "lite",
      painting_intention: "看清楚工作推进里的卡点",
      painting_feeling: "有点紧，但也想继续往前",
      inner_radius: 0.35,
      middle_radius: 0.65,
      three_circles_source: "user_override",
    },
    review_layer0_summary: {
      visual_fact_summary: "三圈边界使用 inner=0.35 / middle=0.65。",
      per_circle_observation_summary: "内圈偏亮；中圈偏深；外圈填充较厚。",
      shape_observation_summary: "形状只作为辅助判断。",
      direct_judgment_summary: "先看到中心聚焦，再看外层承接。",
      element_state_summary: "fire:balanced",
      relation_summary: "圈级关系显示内推与外承接不同步。",
      candidate_summary: "主候选为 water-fire-conflict(0.72)。",
    },
    review_mapping_summary: {
      lite_blocks: {
        visual_basis: {
          final_excerpt: "内圈偏亮，中圈偏深。",
          narrative_trace_refs: { section: "visual_elements" },
          evidence_trace_refs: { rule_refs: ["method:per_circle_color_analysis"] },
        },
      },
      pro_blocks: {
        deep_impression: {
          final_excerpt: "中心聚焦，但外层承接较强。",
          narrative_trace_refs: { section: "first_impression" },
          evidence_trace_refs: { rule_refs: ["method:per_circle_color_analysis"] },
        },
      },
    },
    layer0_evidence: {
      visual_facts: {
        circle_boundaries: { inner_radius: 0.35, middle_radius: 0.65 },
        circle_colors: { inner: ["gold"] },
        weighted_element_distribution: { fire: 0.3 },
      },
      rule_evaluations: {
        interpretation_method_trace: {
          direct_judgment: { summary: "先看到中心聚焦，再看外层承接。" },
          per_circle_color_analysis: {},
          shape_analysis: {},
          circle_relation_analysis: {},
        },
        element_states: {},
        triad_states: {},
        imbalance_trace: {
          primary_candidates: [],
          synthetic_signal: { used: false },
        },
      },
    },
  },
};

function createProps(
  overrides: Partial<ComponentProps<typeof ManualReviewPanel>> = {},
): ComponentProps<typeof ManualReviewPanel> {
  return {
    route: "report",
    previewMode: true,
    draft,
    interpretationId: "ipt-review-1",
    flowState: null,
    detection: null,
    runtimeReportDebugProfile: reportDebugProfile,
    ...overrides,
  };
}

describe("ManualReviewPanel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    flushSync(() => {
      root.unmount();
    });
    await Promise.resolve();
    container.remove();
  });

  function renderPanel() {
    flushSync(() => {
      root.render(<ManualReviewPanel {...createProps()} />);
    });
  }

  function normalizedText() {
    return container.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }

  it("按人工步骤展示输入包、Layer0 摘要、映射预览和人工标记", () => {
    renderPanel();

    expect(normalizedText()).toContain("人工逐步审阅");
    expect(normalizedText()).toContain("1. 输入包确认");
    expect(normalizedText()).toContain("wealth_career / 财富事业");
    expect(normalizedText()).toContain("0.35 / 0.65");
    expect(normalizedText()).toContain("2. Layer0 视觉事实");
    expect(normalizedText()).toContain("内圈偏亮");
    expect(normalizedText()).toContain("3. Layer0 规则推导");
    expect(normalizedText()).toContain("water-fire-conflict");
    expect(normalizedText()).toContain("4. 报告映射预览");
    expect(normalizedText()).toContain("visual_basis");

    const passButton = Array.from(container.querySelectorAll("button")).find((item) =>
      item.textContent?.includes("通过"),
    );
    expect(passButton).toBeTruthy();
    flushSync(() => {
      passButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(normalizedText()).toContain("pass");
  });
});
