import type { MobileWebAppProps } from "./app";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";
import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationRecordResponse,
  InterpretationStatusResponse,
  MandalaFlowState,
  ReportResponse,
} from "../shared/types";

function createMockInterpretation(): CreateInterpretationResponse {
  return {
    success: true,
    interpretation_id: "demo-interpretation-id",
    version: "lite",
    status: "completed",
    generation_stage: "report_ready",
    generation_progress: 100,
    three_circles: {
      inner_radius: 0.28,
      middle_radius: 0.63,
    },
    auto_detected: true,
    existing: false,
    report_ready: true,
  };
}

function createMockStatus(): InterpretationStatusResponse {
  return {
    interpretation_id: "demo-interpretation-id",
    status: "completed",
    generation_stage: "report_ready",
    generation_progress: 100,
    report_ready: true,
    version_purchased: ["lite"],
    three_circles: {
      inner_radius: 0.28,
      middle_radius: 0.63,
    },
    auto_detected: true,
    can_upgrade: true,
  };
}

function createMockDetection(): DetectCirclesResponse {
  return {
    inner_radius: 0.28,
    middle_radius: 0.63,
    confidence: 0.91,
    method: "preview-fixture",
    geometry_suggestion: {
      shape_type: "circle",
      cx: 0.5,
      cy: 0.5,
      rx: 0.46,
      ry: 0.46,
      rotation: 0,
      inner_t: 0.28,
      middle_t: 0.63,
    },
  };
}

export function createPreviewDetectionFixture(): DetectCirclesResponse {
  return createMockDetection();
}

function createMockReport(version: "lite" | "pro" = "lite"): ReportResponse {
  return {
    interpretation_id: "demo-interpretation-id",
    version,
    title: version === "pro" ? "一镜：冰封的太阳 - Pro版" : "一镜 Lite 版预览",
    overall_impression:
      "画面中心聚拢、外圈舒展，呈现出一种从收束走向打开的心理动作。",
    structured: {
      topic_context: {
        topic: "general",
        topic_label: "全面解读",
        report_mode: "lite",
        orientation: {
          intro: "这份报告会从全面解读这个议题角度看这张画。",
          focus: "这个议题会从整体状态、能量分布、情绪模式和当下可走的一小步来理解这张画。",
          key_terms: [],
        },
      },
      current_reading:
        "你当前的表达像是在试着把注意力从外部噪音收回来，先回到自己的中心。",
      visual_basis:
        "中心颜色密度更高，外围线条更轻，说明你正在把主要能量压缩到一个更可控的范围里。",
      pattern_interpretation:
        "既有想进一步整理内在感受的需求，也保留了对外部变化的敏感度，因此画面同时出现稳住与扩张的张力。",
      life_connection:
        "留意你在哪些场景里最容易重新被外部节奏带走。",
      lite_healing_guidance: {
        directions: [
          {
            title: "先把节奏放缓一点",
            content: "这次先不急着回应外部变化，先确认自己真正想守住的是什么。",
          },
          {
            title: "把理解放回现实场景",
            content: "留意你在哪些场景里最容易重新被外部节奏带走。",
          },
        ],
        micro_practices: [
          {
            title: "一句停顿",
            content: "遇到想立刻回应的时候，先停三秒，再决定要不要开口。",
          },
          {
            title: "一句记录",
            content: "把今天最明显的一次收紧感写下来，只记录，不分析。",
          },
        ],
      },
      pro_report_entry: {
        title: "另一份更深的独立报告",
        summary:
          "如果你希望从更深层结构继续理解这张画，Pro 会提供更完整的结构、根因与疗愈视角。",
        product_note:
          "Pro 不是 Lite 的升级版，而是另一份独立购买、独立成立的深度完整解读。",
      },
    },
    report:
      version === "pro"
        ? "# 一镜：冰封的太阳 - Pro版\n## 核心画像\n你的内在能量很强，但表达端仍带着明显的收束和保护。你不是没有热情，而是热情长期被谨慎包裹。\n\n## 三圈能量分析\n内圈更强，说明你对自己的真实感受并不陌生；中外圈的迟疑，更多发生在关系与外界互动层。\n\n## 当前失衡\n你现在更像是火被压住，而不是火不够。持续消耗、思虑偏多，会让行动感变弱。\n\n## 下一步建议\n先做小步表达，少做完美准备。让一个真实动作先发生，比继续在脑内推演更重要。"
        : "这是一份本地预览报告，用来支撑 mobile-web 页面开发。\n\n它不代表最终解读文案，只负责让布局、层次和状态在开发壳里先稳定下来。",
    ai_qa_context:
      version === "pro"
        ? "这个模式更像长期形成，还是最近被触发？\n我怎样减少过度消耗？\n什么环境最支持我的表达？"
        : null,
    can_upgrade: true,
    upgrade_price: 39,
    error: null,
  };
}

function createMockRecords(): InterpretationRecordResponse[] {
  return [
    {
      interpretation_id: "demo-001",
      user_id: "demo-user-id",
      theme: "general",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 0.26,
        middle_radius: 0.6,
      },
      auto_detected: true,
      can_upgrade: true,
      created_at: "2026-04-04T10:00:00+08:00",
    },
    {
      interpretation_id: "demo-002",
      user_id: "demo-user-id",
      theme: "wealth_career",
      status: "processing",
      generation_stage: "generating_lite",
      generation_progress: 64,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 0.31,
        middle_radius: 0.67,
      },
      auto_detected: true,
      can_upgrade: false,
      created_at: "2026-04-03T21:30:00+08:00",
    },
  ];
}

export function createPreviewAppProps(
  route: MobileWebRouteId,
  draft: MobileWebUploadDraft,
  uploadDetection: DetectCirclesResponse | null = null,
  flowStateOverride: MandalaFlowState | null = null,
  historyRecordsOverride: InterpretationRecordResponse[] | null = null,
): MobileWebAppProps {
  const baseFlowState = {
    step: "liteReady" as const,
    selectedImage: {
      imagePath: draft.imagePath,
    },
    detection: uploadDetection ?? createMockDetection(),
    geometry: (uploadDetection ?? createMockDetection()).geometry_suggestion ?? null,
    interpretation: createMockInterpretation(),
    status: createMockStatus(),
    report: createMockReport(),
    lastError: null,
  };

  switch (route) {
    case "landing":
      return {
        route,
        uploadDraft: draft,
      };

    case "upload":
      return {
        route,
        uploadDraft: draft,
      };

    case "reportEntry":
      return {
        route,
        uploadDraft: draft,
      };

    case "loading":
      return {
        route,
        uploadDraft: draft,
        flowState: flowStateOverride ?? {
          ...baseFlowState,
          step: "liteGenerating",
          report: null,
          status: {
            ...createMockStatus(),
            generation_progress: 64,
            report_ready: false,
            generation_stage: "generating_lite",
          },
        },
      };

    case "report":
    case "reportLegacy":
      return {
        route,
        uploadDraft: draft,
        flowState: flowStateOverride ?? baseFlowState,
      };

    case "history":
      return {
        route,
        uploadDraft: draft,
        historyQuery: {
          filter: "all",
          limit: 20,
        },
        records: historyRecordsOverride ?? createMockRecords(),
      };

    case "historyRecordDetail":
      return {
        route,
        uploadDraft: draft,
        record: (historyRecordsOverride ?? createMockRecords())[0],
      };
  }
}
