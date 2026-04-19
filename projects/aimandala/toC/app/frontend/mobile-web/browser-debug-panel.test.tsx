// @vitest-environment jsdom

import { type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

vi.mock("../shared/api", async () => {
  const actual = await vi.importActual<typeof import("../shared/api")>("../shared/api");
  return {
    ...actual,
    getInterpretationReportDebug: vi.fn(),
    getKnowledgeBuildSummary: vi.fn(),
    previewKnowledgeFixture: vi.fn(),
  };
});

import * as sharedApi from "../shared/api";
import { BrowserDebugPanel } from "./browser-debug-panel";
import type {
  KnowledgeBuildSummaryResponse,
  KnowledgeFixturePreviewResponse,
  ReportDebugProfileResponse,
} from "../shared/types";

const baseDraft = {
  imagePath: "/tmp/mandala.png",
  theme: "wealth_career",
  reportVariant: "pro" as const,
  reportType: "pro" as const,
  paintingIntention: "看见自己的工作状态",
  paintingFeeling: "有点紧但也想推进",
};

const baseReportDebugProfile: ReportDebugProfileResponse = {
  interpretation_id: "ipt-debug-1",
  theme: "wealth_career",
  status: "completed",
  generation_stage: "report_ready",
  generation_progress: 100,
  version_purchased: ["lite", "pro"],
  steps: [],
  layers: {},
  field_provenance: {
    lite: [
      {
        field: "current_reading",
        source: "layer0",
      },
    ],
    pro: [],
  },
  diagnostics: {
    summary: {
      fallback_used: true,
      warning_count: 1,
    },
  },
  prompt_debug: {
    lite: {
      prompt_preview: [
        "field: current_reading",
        "knowledge entity: theme.wealth_career",
        "final field: current_reading",
      ].join("\n"),
      schema_fields: [
        {
          name: "current_reading",
          semantic_role: "current reading",
          mapped_final_field: "current_reading",
        },
      ],
    },
    pro: {
      prompt_preview: "",
      schema_fields: [],
    },
  },
  insight_context_summary: {
    interpretation_id: "ipt-debug-1",
    theme: "wealth_career",
    theme_label: "财富事业",
    knowledge_signal: "imbalance.fire_deficiency",
    image: {
      storage_backend: "local",
    },
    constraints: {
      scope: "single_interpretation",
      fallback_present: true,
    },
  },
  evidence_summary: {
    agent: {
      name: "InsightAgent",
      version: "v1",
    },
    knowledge_sources: {
      source_ref_count: 1,
    },
  },
  fallback_summary: {
    used: true,
    levels: ["themed"],
    warnings: ["healing fallback"],
  },
  knowledge_debug: {
    build_info: {
      build_selector: "current",
      pack_id: "aimandala.v2.1",
    },
    layer0_evidence: {
      visual_facts: {
        palette: ["gold", "green"],
      },
      knowledge_hits: {
        theme: "theme.wealth_career",
      },
      rule_evaluations: {
        healing_fallback: true,
      },
      theme_projection: {
        theme: "wealth_career",
      },
      imbalance_candidates: ["imbalance.fire_deficiency"],
      quality_flags: ["warning:fire_deficiency"],
      fallback_summary: {
        used: true,
        levels: ["themed"],
        warnings: ["healing fallback"],
      },
    },
    topic_context_trace: {
      topic: "wealth_career",
      report_modes: ["lite", "pro"],
      knowledge_route: "theme_only",
      general_mixed: false,
    },
    product_block_debug: {
      lite: {
        current_reading: {
          final: "当前命中：你正在一边收紧、一边寻找推进感。",
          narrative_trace: {
            section: "overall_impression",
          },
          evidence_trace: {
            visual_fact_refs: ["visual.palette"],
            knowledge_hit_refs: ["theme.wealth_career"],
            rule_refs: ["imbalance.fire_deficiency"],
            theme_projection_refs: ["themes/wealth_career.yaml"],
          },
          prompt_trace: {
            schema_field: "current_reading",
          },
          quality_trace: {
            fidelity_flags: ["warning:fire_deficiency"],
            fallback_summary: {
              used: true,
              levels: ["themed"],
              warnings: ["healing fallback"],
            },
            compatibility_used: false,
          },
        },
      },
      pro: {
        healing_plan: {
          final: [{ title: "先恢复节奏", content: "把推进压力拆小。" }],
          narrative_trace: {
            section: "healing_suggestions",
          },
          evidence_trace: {
            visual_fact_refs: [],
            knowledge_hit_refs: ["healing.wealth_career"],
            rule_refs: ["imbalance.fire_deficiency"],
            theme_projection_refs: ["healing/wealth_career.yaml"],
          },
          prompt_trace: {
            schema_field: "healing_plan",
          },
          quality_trace: {
            fidelity_flags: ["warning:fire_deficiency"],
            fallback_summary: {
              used: true,
              levels: ["themed"],
              warnings: ["healing fallback"],
            },
            compatibility_used: true,
          },
        },
      },
    },
    internal_compatibility: {
      legacy_fields: ["pro_teaser", "healing_suggestions"],
      compatibility_used: true,
    },
    query_results: {
      theme: {
        entity_id: "theme.wealth_career",
      },
    },
    fallback_analysis: {
      used: true,
      levels: ["themed"],
      warnings: ["healing fallback"],
      query_fallbacks: [
        {
          query_key: "theme",
          entity_id: "theme.wealth_career",
          fallback_level: "themed",
        },
      ],
    },
    warning_analysis: {
      warning_hits: [
        {
          imbalance_id: "imbalance.fire_deficiency",
          warning: "需要先稳住节奏",
        },
      ],
      active_warning_paths: [
        {
          imbalance_id: "imbalance.fire_deficiency",
          source_path: "rules/imbalance_types.yaml",
        },
      ],
    },
    source_refs: [
      {
        entity_id: "theme.wealth_career",
        kind: "theme",
        source_path: "themes/wealth_career.yaml",
        absolute_path: "/abs/themes/wealth_career.yaml",
        query_keys: ["theme"],
      },
    ],
    field_to_knowledge_map: {
      current_reading: {
        query_keys: ["theme"],
        entity_ids: ["theme.wealth_career"],
        source_paths: ["themes/wealth_career.yaml"],
        warnings: [],
      },
    },
  },
};

const currentBuildSummary: KnowledgeBuildSummaryResponse = {
  build_info: {
    build_selector: "current",
    build_id: "current",
    pack_id: "aimandala.v2.1",
    generated_at: "2026-04-11T15:00:00.000Z",
  },
  quality: {
    summary: {
      theme_count: 8,
      fallback_hotspot_count: 1,
      high_risk_warning_count: 1,
    },
    fallback_hotspots: [
      {
        kind: "healing",
        theme_id: "wealth_career",
      },
    ],
    high_risk_warning_paths: [
      {
        imbalance_id: "imbalance.fire_deficiency",
      },
    ],
  },
  eval_summary: {
    summary: {
      fixture_count: 4,
      fixture_fallback_count: 1,
      warning_hit_count: 1,
      structured_missing_count: 0,
      regression_flag_count: 0,
    },
    fixtures: [
      {
        fixture_id: "toc-mvp-fixture-002",
        theme: "wealth_career",
        version: "pro",
        fallback_used: false,
        warning_hit_count: 0,
        regression_flags: [],
      },
    ],
  },
};

const candidateBuildSummary: KnowledgeBuildSummaryResponse = {
  build_info: {
    build_selector: "candidate:test-v22",
    build_id: "test-v22",
    pack_id: "aimandala.v2.1",
    generated_at: "2026-04-12T00:00:00.000Z",
  },
  quality: {
    summary: {
      theme_count: 8,
      fallback_hotspot_count: 2,
      high_risk_warning_count: 1,
    },
    fallback_hotspots: [
      {
        kind: "healing",
        theme_id: "wealth_career",
      },
      {
        kind: "narrative",
        theme_id: "intimate_relationship",
      },
    ],
    high_risk_warning_paths: [
      {
        imbalance_id: "imbalance.fire_deficiency",
      },
    ],
  },
  eval_summary: {
    summary: {
      fixture_count: 4,
      fixture_fallback_count: 2,
      warning_hit_count: 1,
      structured_missing_count: 1,
      regression_flag_count: 1,
    },
    fixtures: [
      {
        fixture_id: "toc-mvp-fixture-002",
        theme: "wealth_career",
        version: "pro",
        fallback_used: true,
        warning_hit_count: 1,
        regression_flags: ["structured_missing:healing_plan"],
      },
    ],
  },
};

const samplePreview: KnowledgeFixturePreviewResponse = {
  fixture_meta: {
    fixture_id: "toc-mvp-fixture-002",
    theme: "wealth_career",
    build_selector: "candidate:test-v22",
    version: "pro",
  },
  report_summary: {
    version: "pro",
    title: "事业主题 Pro 报告",
    structured_field_presence: {
      healing_plan: false,
    },
  },
  knowledge_summary: {
    summary: {
      fallback_used: true,
      warning_hit_count: 1,
    },
    source_refs: [
      {
        entity_id: "healing.wealth_career",
        source_path: "healing/wealth_career.yaml",
        absolute_path: "/abs/healing/wealth_career.yaml",
      },
    ],
  },
  regression_flags: ["structured_missing:healing_plan"],
  diff_from_current: {
    fallback_delta: 1,
    warning_ids_added: ["imbalance.fire_deficiency"],
    warning_ids_removed: [],
    structured_missing_added: ["healing_plan"],
    structured_missing_removed: [],
    report_excerpt_changed: true,
  },
};

function createProps(
  overrides: Partial<ComponentProps<typeof BrowserDebugPanel>> = {},
): ComponentProps<typeof BrowserDebugPanel> {
  return {
    route: "report",
    previewMode: false,
    draft: baseDraft,
    interpretationId: "ipt-debug-1",
    userId: "user-1",
    flowState: null,
    detection: null,
    detectError: null,
    detecting: false,
    runtimeSnapshot: null,
    apiTraces: [],
    timelineEntries: [],
    onClearApiTraces: vi.fn(),
    disableWorkbenchFetch: true,
    ...overrides,
  };
}

describe("BrowserDebugPanel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.clearAllMocks();
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

  async function renderPanel(
    overrides: Partial<ComponentProps<typeof BrowserDebugPanel>> = {},
  ) {
    flushSync(() => {
      root.render(<BrowserDebugPanel {...createProps(overrides)} />);
    });
    await Promise.resolve();
  }

  function getButton(label: string): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll("button")).find((item) =>
      item.textContent?.includes(label),
    );
    expect(button, `expected button containing "${label}"`).toBeTruthy();
    return button as HTMLButtonElement;
  }

  async function clickButton(label: string) {
    flushSync(() => {
      getButton(label).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await Promise.resolve();
  }

  function normalizedText() {
    return container.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }

  it("支持在四个工作台视图之间切换", async () => {
    await renderPanel({
      preloadedReportDebugProfile: baseReportDebugProfile,
      preloadedCurrentBuildSummary: currentBuildSummary,
      preloadedCandidateBuildSummary: candidateBuildSummary,
      preloadedSamplePreview: samplePreview,
      initialTab: "pipeline",
    });

    expect(normalizedText()).toContain("链路时间线");

    await clickButton("Knowledge");
    expect(normalizedText()).toContain("Build Summary");
    expect(normalizedText()).toContain("Insight Context");
    expect(normalizedText()).toContain("Topic Context Trace");
    expect(normalizedText()).toContain("Field To Knowledge");

    await clickButton("Report Trace");
    expect(normalizedText()).toContain("Diagnostics");
    expect(normalizedText()).toContain("Product Block Debug");
    expect(normalizedText()).toContain("Internal Compatibility");
    expect(normalizedText()).toContain("Prompt Snippet");

    await clickButton("Samples");
    expect(normalizedText()).toContain("Regression Summary");
    expect(normalizedText()).toContain("Selected Sample");
  });

  it("占位 interpretation id 不会触发 report-debug 拉取", async () => {
    await renderPanel({
      interpretationId: "demo-interpretation-id",
      runtimeSnapshot: null,
    });

    expect(sharedApi.getInterpretationReportDebug).not.toHaveBeenCalled();
  });

  it("会把字段映射联动到 source refs 与 prompt trace", async () => {
    await renderPanel({
      preloadedReportDebugProfile: baseReportDebugProfile,
      initialTab: "knowledge",
    });

    expect(normalizedText()).toContain("current_reading");
    expect(normalizedText()).toContain("InsightAgent");
    await clickButton("current_reading");
    expect(normalizedText()).toContain("themes/wealth_career.yaml");
    expect(normalizedText()).toContain("/abs/themes/wealth_career.yaml");

    await clickButton("Report Trace");
    expect(normalizedText()).toContain("theme.wealth_career");
    expect(normalizedText()).toContain("knowledge entity: theme.wealth_career");
    expect(normalizedText()).toContain("final field: current_reading");
    expect(normalizedText()).toContain("Product Block Debug");
    expect(normalizedText()).toContain("healing_plan");
    expect(normalizedText()).toContain("Internal Compatibility");
    expect(normalizedText()).toContain("pro_teaser");
  });

  it("会渲染固定样本的 current/candidate diff", async () => {
    await renderPanel({
      preloadedCurrentBuildSummary: currentBuildSummary,
      preloadedCandidateBuildSummary: candidateBuildSummary,
      preloadedSamplePreview: samplePreview,
      preloadedCandidateBuildId: "test-v22",
      initialTab: "samples",
    });

    expect(normalizedText()).toContain("toc-mvp-fixture-002");
    expect(normalizedText()).toContain("current:pro / candidate:pro");
    expect(normalizedText()).toContain("warning 0 to 1");
    expect(normalizedText()).toContain("warning_ids_added");
    expect(normalizedText()).toContain("imbalance.fire_deficiency");
    expect(normalizedText()).toContain("healing/wealth_career.yaml");
  });
});
