import type { MobileWebAppProps } from "./app";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";
import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationRecordResponse,
  InterpretationStatusResponse,
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

function createMockReport(version: "lite" | "pro" = "lite"): ReportResponse {
  return {
    interpretation_id: "demo-interpretation-id",
    version,
    title: version === "pro" ? "一梳 Pro 版入口预览" : "一镜 Lite 版预览",
    overall_impression:
      "画面中心聚拢、外圈舒展，呈现出一种从收束走向打开的心理动作。",
    structured: {
      title: "一镜 Lite 版预览",
      overall_impression:
        "你当前的表达像是在试着把注意力从外部噪音收回来，先回到自己的中心。",
      visual_elements_rendered:
        "中心颜色密度更高，外围线条更轻，说明你正在把主要能量压缩到一个更可控的范围里。",
      emotion_portrait_rendered:
        "既有想进一步整理内在感受的需求，也保留了对外部变化的敏感度，因此画面同时出现稳住与扩张的张力。",
      pro_teaser:
        "如果想看更完整的层次拆解，后续可以从现有入口继续进入一梳 Pro 版路径。",
    },
    report:
      "这是一份本地预览报告，用来支撑 mobile-web 页面开发。\n\n它不代表最终解读文案，只负责让布局、层次和状态在开发壳里先稳定下来。",
    ai_qa_context: null,
    can_upgrade: true,
    upgrade_price: 49,
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
      theme: "career",
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
): MobileWebAppProps {
  const baseFlowState = {
    step: "liteReady" as const,
    selectedImage: {
      imagePath: draft.imagePath,
    },
    detection: createMockDetection(),
    geometry: createMockDetection().geometry_suggestion ?? null,
    interpretation: createMockInterpretation(),
    status: createMockStatus(),
    report: createMockReport(),
    lastError: null,
  };

  switch (route) {
    case "upload":
      return {
        route,
        uploadDraft: draft,
      };

    case "loading":
      return {
        route,
        flowState: {
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
        flowState: baseFlowState,
      };

    case "history":
      return {
        route,
        records: createMockRecords(),
      };

    case "upgrade":
      return {
        route,
        flowState: {
          ...baseFlowState,
          step: "upgradePlaceholder",
          report: createMockReport("pro"),
        },
      };
  }
}
