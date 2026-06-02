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
    auto_detected: false,
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
    auto_detected: false,
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
      title:
        version === "pro" ? "一镜：冰封的太阳 - Pro版" : "一镜 Lite 版预览",
      summary: "画面中心聚拢、外圈舒展，呈现出一种从收束走向打开的心理动作。",
      report_mode: version,
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
      theme: "intimate_relationship",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      version_purchased: ["lite", "pro"],
      three_circles: {
        inner_radius: 0.26,
        middle_radius: 0.6,
      },
      auto_detected: false,
      can_upgrade: true,
      created_at: "2026-04-17T09:30:00+08:00",
    },
    {
      interpretation_id: "demo-002",
      user_id: "demo-user-id",
      theme: "intimate_relationship",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 0.31,
        middle_radius: 0.67,
      },
      auto_detected: false,
      can_upgrade: true,
      created_at: "2026-04-17T09:30:00+08:00",
    },
    {
      interpretation_id: "demo-003",
      user_id: "demo-user-id",
      theme: "wealth",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 0.29,
        middle_radius: 0.62,
      },
      auto_detected: true,
      can_upgrade: true,
      created_at: "2026-04-16T14:22:00+08:00",
    },
    {
      interpretation_id: "demo-004",
      user_id: "demo-user-id",
      theme: "personal_growth",
      status: "processing",
      generation_stage: "generating_pro",
      generation_progress: 74,
      version_purchased: ["lite", "pro"],
      three_circles: {
        inner_radius: 0.35,
        middle_radius: 0.7,
      },
      auto_detected: false,
      can_upgrade: false,
      created_at: "2026-04-15T20:10:00+08:00",
    },
    {
      interpretation_id: "demo-005",
      user_id: "demo-user-id",
      theme: "mother_relationship",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 0.28,
        middle_radius: 0.61,
      },
      auto_detected: false,
      can_upgrade: true,
      created_at: "2026-03-28T19:18:00+08:00",
    },
    {
      interpretation_id: "demo-006",
      user_id: "demo-user-id",
      theme: "father_relationship",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 0.32,
        middle_radius: 0.66,
      },
      auto_detected: true,
      can_upgrade: true,
      created_at: "2026-03-12T08:45:00+08:00",
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
    geometry:
      (uploadDetection ?? createMockDetection()).geometry_suggestion ?? null,
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
