import mandalaTest01Url from "../../../../fixtures/toc-mvp/assets/mandala-test-01.JPG?url";
import mandalaTest02Url from "../../../../fixtures/toc-mvp/assets/mandala-test-02.jpeg?url";

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

function getHistoryRecordDetailFixture(
  route: MobileWebRouteId,
  records: InterpretationRecordResponse[],
): InterpretationRecordResponse {
  switch (route) {
    case "historyRecordDetailNotUpgraded":
      return (
        records.find((record) => record.version_purchased.includes("lite") && !record.version_purchased.includes("pro")) ??
        records[0]
      );
    case "historyRecordDetailGenerating":
      return (
        records.find((record) => record.version_purchased.includes("pro") && record.generation_stage === "generating_pro") ??
        records[0]
      );
    case "historyRecordDetailViewable":
      return (
        records.find((record) => record.version_purchased.includes("pro") && record.status === "completed") ??
        records[0]
      );
    default:
      return records[0];
  }
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
  const imageSet = [mandalaTest01Url, mandalaTest02Url];
  const createHistoryRecord = (
    interpretationId: string,
    theme: string,
    createdAt: string,
    options: {
      status?: string;
      generationStage?: string;
      generationProgress?: number;
      versionPurchased?: string[];
      canUpgrade?: boolean;
      autoDetected?: boolean;
      radii?: { inner: number; middle: number };
      imageIndex?: number;
    } = {},
  ): InterpretationRecordResponse => ({
    interpretation_id: interpretationId,
    user_id: "demo-user-id",
    theme,
    status: options.status ?? "completed",
    generation_stage: options.generationStage ?? "report_ready",
    generation_progress: options.generationProgress ?? 100,
    version_purchased: options.versionPurchased ?? ["lite"],
    three_circles: {
      inner_radius: options.radii?.inner ?? 0.3,
      middle_radius: options.radii?.middle ?? 0.64,
    },
    auto_detected: options.autoDetected ?? false,
    can_upgrade: options.canUpgrade ?? true,
    created_at: createdAt,
    image_url: imageSet[options.imageIndex ?? 0] ?? imageSet[0],
  });

  return [
    createHistoryRecord("r1-pro-intimate", "intimate_relationship", "2026-06-08T09:30:00+08:00", {
      versionPurchased: ["lite", "pro"],
      canUpgrade: false,
      radii: { inner: 0.26, middle: 0.6 },
      imageIndex: 0,
    }),
    createHistoryRecord("r2-lite-wealth-career", "wealth", "2026-06-05T14:22:00+08:00", {
      versionPurchased: ["lite"],
      canUpgrade: true,
      radii: { inner: 0.29, middle: 0.62 },
      imageIndex: 1,
    }),
    createHistoryRecord("r3-pro-personal-growth", "personal_growth", "2026-06-02T20:10:00+08:00", {
      status: "processing",
      generationStage: "generating_pro",
      generationProgress: 95,
      versionPurchased: ["lite", "pro"],
      canUpgrade: false,
      radii: { inner: 0.35, middle: 0.7 },
      imageIndex: 0,
    }),
    createHistoryRecord("r4-pro-parent-child", "parent_child_relationship", "2026-05-20T17:40:00+08:00", {
      versionPurchased: ["lite", "pro"],
      canUpgrade: false,
      radii: { inner: 0.33, middle: 0.68 },
      imageIndex: 1,
    }),
    createHistoryRecord("r5-lite-father", "father_relationship", "2026-05-12T08:15:00+08:00", {
      versionPurchased: ["lite"],
      canUpgrade: true,
      autoDetected: true,
      radii: { inner: 0.32, middle: 0.66 },
      imageIndex: 0,
    }),
    createHistoryRecord("r6-lite-mother", "mother_relationship", "2026-05-28T11:05:00+08:00", {
      versionPurchased: ["lite"],
      canUpgrade: true,
      radii: { inner: 0.28, middle: 0.61 },
      imageIndex: 1,
    }),
    createHistoryRecord("r7-lite-body", "body_health", "2026-04-22T19:10:00+08:00", {
      versionPurchased: ["lite"],
      canUpgrade: true,
      radii: { inner: 0.27, middle: 0.59 },
      imageIndex: 0,
    }),
    createHistoryRecord("r8-pro-intimate-older", "intimate_relationship", "2026-04-08T16:40:00+08:00", {
      versionPurchased: ["lite", "pro"],
      canUpgrade: false,
      radii: { inner: 0.25, middle: 0.57 },
      imageIndex: 1,
    }),
    createHistoryRecord("r9-lite-wealth-older", "wealth", "2026-03-20T10:25:00+08:00", {
      versionPurchased: ["lite"],
      canUpgrade: true,
      autoDetected: true,
      radii: { inner: 0.3, middle: 0.63 },
      imageIndex: 0,
    }),
    createHistoryRecord("r10-lite-parent-child-older", "parent_child_relationship", "2026-03-05T18:12:00+08:00", {
      versionPurchased: ["lite"],
      canUpgrade: true,
      radii: { inner: 0.31, middle: 0.65 },
      imageIndex: 1,
    }),
  ];
}

export function createPreviewHistoryRecords(): InterpretationRecordResponse[] {
  return createMockRecords();
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
    case "historyRecordDetailNotUpgraded":
    case "historyRecordDetailGenerating":
    case "historyRecordDetailViewable":
      return {
        route,
        uploadDraft: draft,
        record: getHistoryRecordDetailFixture(
          route,
          historyRecordsOverride ?? createMockRecords(),
        ),
      };
  }
}
