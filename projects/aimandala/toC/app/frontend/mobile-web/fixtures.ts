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
    structured: version === "pro"
      ? {
          title: "一镜：冰封的太阳 - Pro版",
          summary: "画面中心聚拢、外圈舒展，呈现出一种从收束走向打开的心理动作。",
          report_mode: version,
        }
      : {
          title: "一镜 Lite 版预览",
          summary: "画面中心聚拢、外圈舒展，呈现出一种从收束走向打开的心理动作。",
          report_mode: version,
          modules: [
            {
              id: "summary",
              type: "summary",
              order: 1,
              title: "整体印象",
              body: "画面中心聚拢、外圈舒展，呈现出一种从收束走向打开的心理动作。你正在把注意力重新放回自己身上，也在尝试让一些更真实的感受慢慢浮出来。",
              accent: "#9EAA9B",
            },
            {
              id: "core-insights",
              type: "insight_list",
              order: 2,
              title: "六个核心看见",
              accent: "#C87850",
              items: [
                {
                  id: "base",
                  label: "你的底色",
                  icon: "○",
                  color: "#5B8C5A",
                  content: "你的画面有温和的秩序感，像是在给内在感受保留一个稳定的位置。",
                },
                {
                  id: "energy",
                  label: "你的能量",
                  icon: "◇",
                  color: "#D4883E",
                  content: "中心区域的聚拢感较强，说明你此刻仍有明确的内在动力，只是表达会先经过筛选。",
                },
                {
                  id: "relationship",
                  label: "你的关系感",
                  icon: "✦",
                  color: "#4A7FB5",
                  content: "中圈的重复线索提示你在靠近关系时，会同时需要连接与安全边界。",
                },
                {
                  id: "protection",
                  label: "你的保护",
                  icon: "△",
                  color: "#8B6AAE",
                  content: "外圈的留白与收束像一层缓冲，让你在不确定时先观察，再决定是否打开。",
                },
                {
                  id: "stuck",
                  label: "你的卡点",
                  icon: "◌",
                  color: "#C25B56",
                  content: "当前的卡点不一定是没有方向，而是想得足够多之后，行动还停在准备阶段。",
                },
                {
                  id: "light",
                  label: "你的光",
                  icon: "✧",
                  color: "#C8A066",
                  content: "画面里仍有向外舒展的力量，说明你具备把感受转成创造和表达的能力。",
                },
              ],
            },
            {
              id: "experiment",
              type: "practice_suggestion",
              order: 3,
              title: "一个小实验",
              action: "这周选一个安全的时刻，说出一个平时会被你放在心里的小需要。",
              observe: "观察：当你把这个需要说出来后，身体是更紧，还是有一点松开。",
              body: "这周选一个安全的时刻，说出一个平时会被你放在心里的小需要。\n观察：当你把这个需要说出来后，身体是更紧，还是有一点松开。",
              accent: "#D4A054",
            },
          ],
        },
    report:
      version === "pro"
        ? "# 一镜：冰封的太阳 - Pro版\n## 深层主线\n你的内在能量很强，但表达端仍带着明显的收束和保护。你不是没有热情，而是热情长期被谨慎包裹。\n\n## 深度解读\n画面里的明亮部分像是想要被看见的生命力，外层的冷色和停顿感则像一层边界。它们共同呈现出一种既想靠近、又会先观察安全感的模式。\n\n## 三圈能量\n内圈更强，说明你对自己的真实感受并不陌生；中外圈的迟疑，更多发生在关系与外界互动层。真正需要先调整的，未必是内在感受，而是它进入关系时的表达方式。\n\n## 模式形成原因\n这个模式更像长期形成的自我保护：你已经习惯先把感受收好，等确认环境足够安全再慢慢释放。它帮助你维持稳定，也让真实需要容易被延后。\n\n## 调节建议\n先做小步表达，少做完美准备。让一个真实动作先发生，比继续在脑内推演更重要。"
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
      upgradeAt?: string;
      proReadyAt?: string;
    } = {},
  ): InterpretationRecordResponse => {
    const record: InterpretationRecordResponse & { pro_ready_at?: string } = {
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
    };

    if (options.upgradeAt) {
      record.upgrade_history = [
        {
          from: "lite",
          to: "pro",
          price_diff: 39,
          at: options.upgradeAt,
        },
      ];
    }
    if (options.proReadyAt) {
      record.pro_ready_at = options.proReadyAt;
    }

    return record;
  };

  return [
    createHistoryRecord("r1-pro-intimate", "intimate_relationship", "2026-06-08T09:30:00+08:00", {
      versionPurchased: ["lite", "pro"],
      canUpgrade: false,
      radii: { inner: 0.26, middle: 0.6 },
      imageIndex: 0,
      upgradeAt: "2026-06-08T10:12:00+08:00",
      proReadyAt: "2026-06-08T10:34:00+08:00",
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
      upgradeAt: "2026-06-02T20:22:00+08:00",
    }),
    createHistoryRecord("r4-pro-parent-child", "parent_child_relationship", "2026-05-20T17:40:00+08:00", {
      versionPurchased: ["lite", "pro"],
      canUpgrade: false,
      radii: { inner: 0.33, middle: 0.68 },
      imageIndex: 1,
      upgradeAt: "2026-05-20T18:08:00+08:00",
      proReadyAt: "2026-05-20T18:26:00+08:00",
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
    case "reportLite":
      return {
        route,
        uploadDraft: draft,
        flowState: flowStateOverride ?? baseFlowState,
      };

    case "reportPro":
      return {
        route,
        uploadDraft: {
          ...draft,
          reportType: "pro",
          reportVariant: "pro",
        },
        flowState: flowStateOverride ?? {
          ...baseFlowState,
          step: "proReady",
          status: {
            ...createMockStatus(),
            version_purchased: ["lite", "pro"],
            can_upgrade: false,
          },
          report: createMockReport("pro"),
        },
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
