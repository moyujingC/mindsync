import type { MobileWebAppProps } from "../mobile-web/app";
import type { MobileWebUploadDraft } from "../mobile-web/state";
import type { MiniappRouteId } from "./routes";
import type {
  DetectCirclesResponse,
  InterpretationRecordResponse,
  InterpretationStatusResponse,
  MandalaFlowState,
  ReportResponse,
} from "../shared/types";

export function createMiniappDraft(
  patch: Partial<MobileWebUploadDraft> = {},
): MobileWebUploadDraft {
  return {
    imagePath: "/tmp/miniapp-mandala.png",
    theme: "general",
    reportType: "lite",
    reportVariant: "lite",
    paintingIntention: "想看看最近的状态",
    paintingFeeling: "一边紧，一边想整理清楚",
    ...patch,
  };
}

function createMiniappDetection(): DetectCirclesResponse {
  return {
    inner_radius: 0.34,
    middle_radius: 0.66,
    confidence: 0.94,
    method: "miniapp-fixture",
    geometry_suggestion: {
      shape_type: "circle",
      cx: 0.5,
      cy: 0.5,
      rx: 0.44,
      ry: 0.44,
      rotation: 0,
      inner_t: 0.34,
      middle_t: 0.66,
    },
  };
}

function createMiniappStatus(
  patch: Partial<InterpretationStatusResponse> = {},
): InterpretationStatusResponse {
  return {
    interpretation_id: "miniapp-ipt-1",
    status: "completed",
    generation_stage: "report_ready",
    generation_progress: 100,
    report_ready: true,
    version_purchased: ["lite"],
    three_circles: {
      inner_radius: 0.34,
      middle_radius: 0.66,
    },
    auto_detected: true,
    can_upgrade: true,
    ...patch,
  };
}

function createMiniappReport(version: "lite" | "pro" = "lite"): ReportResponse {
  return {
    interpretation_id: "miniapp-ipt-1",
    version,
    title: version === "pro" ? "一镜一梳 Pro 版预览" : "一镜一梳 Lite 版预览",
    overall_impression: "这是一份供 miniapp 静态壳审阅使用的本地示例。",
    structured: {
      topic_context: {
        topic: "general",
        topic_label: "全面解读",
        report_mode: version,
        orientation: {
          intro: "这份报告会从全面解读这个议题角度看这张画。",
          focus: "这个议题会从整体状态、能量分布、情绪模式和当下可走的一小步来理解这张画。",
          key_terms: [],
        },
      },
      current_reading: "你正在把注意力慢慢收回中心。",
      visual_basis: "中心更聚拢，外围更松开。",
      pattern_interpretation: "你在想整理自己，也在想如何继续往前。",
      life_connection: "先把感受放回一个现实场景里看。",
      lite_healing_guidance: {
        directions: [
          {
            title: "先做轻量调节",
            content: "先让自己停一下，辨认此刻最想守住的感受。",
          },
        ],
        micro_practices: [
          {
            title: "一句记录",
            content: "先写下一句真实感受，不做额外解释。",
          },
        ],
      },
      pro_report_entry: {
        title: "另一份更深的独立报告",
        summary: "如果你希望从更深层结构继续理解这张画，可以查看 Pro 报告。",
        product_note: "Pro 是独立购买、独立成立的深度完整解读。",
      },
    },
    report:
      version === "pro"
        ? "# Miniapp Pro 预览\n\n当前只展示静态壳，不代表真实小程序运行态。"
        : "这是一份 miniapp Lite 静态预览报告，用于页面与 shared/ui 消费审阅。",
    ai_qa_context: version === "pro" ? "示例问答上下文" : null,
    can_upgrade: version !== "pro",
    upgrade_price: version !== "pro" ? 39 : null,
    error: null,
  };
}

function createMiniappFlowState(
  patch: Partial<MandalaFlowState> = {},
): MandalaFlowState {
  return {
    step: "liteReady",
    selectedImage: {
      imagePath: "/tmp/miniapp-mandala.png",
    },
    detection: createMiniappDetection(),
    geometry: createMiniappDetection().geometry_suggestion ?? null,
    interpretation: {
      success: true,
      interpretation_id: "miniapp-ipt-1",
      version: "lite",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      three_circles: {
        inner_radius: 0.34,
        middle_radius: 0.66,
      },
      auto_detected: true,
      existing: false,
      report_ready: true,
    },
    status: createMiniappStatus(),
    report: createMiniappReport("lite"),
    lastError: null,
    ...patch,
  };
}

function createMiniappRecords(): InterpretationRecordResponse[] {
  return [
    {
      interpretation_id: "miniapp-lite-only",
      user_id: "miniapp-user",
      theme: "general",
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
      created_at: "2026-04-15T09:20:00+08:00",
      upgrade_history: [],
    },
    {
      interpretation_id: "miniapp-lite-pro",
      user_id: "miniapp-user",
      theme: "wealth_career",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      version_purchased: ["lite", "pro"],
      three_circles: {
        inner_radius: 0.31,
        middle_radius: 0.64,
      },
      auto_detected: true,
      can_upgrade: false,
      created_at: "2026-04-15T08:10:00+08:00",
      upgrade_history: [
        {
          from: "lite",
          to: "pro",
          price_diff: 39,
          at: "2026-04-15T08:25:00+08:00",
        },
      ],
    },
    {
      interpretation_id: "miniapp-pro-pending",
      user_id: "miniapp-user",
      theme: "intimate_relationship",
      status: "processing",
      generation_stage: "generating",
      generation_progress: 72,
      version_purchased: ["lite", "pro"],
      three_circles: {
        inner_radius: 0.37,
        middle_radius: 0.68,
      },
      auto_detected: true,
      can_upgrade: false,
      created_at: "2026-04-15T07:40:00+08:00",
      upgrade_history: [
        {
          from: "lite",
          to: "pro",
          price_diff: 39,
          at: "2026-04-15T07:55:00+08:00",
        },
      ],
    },
  ];
}

export function createMiniappPreviewProps(
  route: MiniappRouteId,
): MobileWebAppProps {
  const records = createMiniappRecords();

  switch (route) {
    case "landing":
      return {
        route: "landing",
        uploadDraft: createMiniappDraft(),
      };
    case "upload":
      return {
        route: "upload",
        uploadDraft: createMiniappDraft(),
        detection: createMiniappDetection(),
      };
    case "reportEntry":
      return {
        route: "reportEntry",
        uploadDraft: createMiniappDraft(),
      };
    case "loading":
      return {
        route: "loading",
        uploadDraft: createMiniappDraft({
          reportType: "pro",
          reportVariant: "pro",
        }),
        flowState: createMiniappFlowState({
          step: "liteGenerating",
          status: createMiniappStatus({
            status: "processing",
            generation_stage: "generating",
            generation_progress: 58,
            report_ready: false,
            version_purchased: ["lite", "pro"],
          }),
          report: null,
        }),
      };
    case "report":
      return {
        route: "report",
        uploadDraft: createMiniappDraft(),
        flowState: createMiniappFlowState(),
      };
    case "history":
      return {
        route: "history",
        uploadDraft: createMiniappDraft(),
        historyQuery: {
          filter: "all",
          limit: 20,
        },
        records,
        historyStatusLabel: "当前为 miniapp 静态壳预览",
        historyStatusDetail:
          "当前记录和状态都来自本地 fixture，不代表真实小程序运行态。",
        historyStatusTone: "preview",
      };
    case "historyRecordDetail":
      return {
        route: "historyRecordDetail",
        uploadDraft: createMiniappDraft(),
        record: records[1],
      };
  }
}
