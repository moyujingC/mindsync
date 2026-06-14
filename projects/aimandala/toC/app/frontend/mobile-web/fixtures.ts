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
        records.find(
          (record) =>
            record.version_purchased.includes("lite") &&
            !record.version_purchased.includes("pro"),
        ) ?? records[0]
      );
    case "historyRecordDetailGenerating":
      return (
        records.find(
          (record) =>
            record.version_purchased.includes("pro") &&
            record.generation_stage === "generating_pro",
        ) ?? records[0]
      );
    case "historyRecordDetailViewable":
      return (
        records.find(
          (record) =>
            record.version_purchased.includes("pro") &&
            record.status === "completed",
        ) ?? records[0]
      );
    default:
      return records[0];
  }
}

function createMockReport(version: "lite" | "pro" = "lite"): ReportResponse {
  return {
    interpretation_id: "demo-interpretation-id",
    version,
    title: version === "pro" ? "一镜：冰封的太阳 - Pro版" : "冰封的太阳",
    overall_impression:
      "这是一幅充满生命力的画作，像春日里急切绽放的花朵，带着想要被世界看见的渴望。色彩浓烈却排列有序，暗示着一个在严格框架中燃烧着热情的灵魂。",
    structured:
      version === "pro"
        ? {
            title: "一镜：冰封的太阳 - Pro版",
            summary:
              "这幅画的深层主线，是一场关于「被看见」的拉扯——你既渴望释放炽热的自我，又用秩序把它牢牢冻结。太阳被冰封，不是因为没有热，而是热被层层保护了起来。",
            report_mode: version,
            generated_at: "2026-03-08T10:00:00+08:00",
            modules: [
              {
                id: "mainline",
                type: "mainline",
                order: 1,
                title: "深层主线",
                body: "这幅画的深层主线，是一场关于「被看见」的拉扯——你既渴望释放炽热的自我，又用秩序把它牢牢冻结。太阳被冰封，不是因为没有热，而是热被层层保护了起来。",
                accent: "#D4A054",
              },
              {
                id: "deep-reading",
                type: "deep_reading",
                order: 2,
                title: "深度解读",
                accent: "#C87850",
                items: [
                  {
                    id: "color",
                    label: "色彩语言",
                    content:
                      "浓烈的暖色集中在中心，冷色与留白被推向外圈——这是一种「热在内、冷在外」的能量分布。你把最真实、最有温度的部分藏在最里层，只让外界看到克制和秩序。",
                  },
                  {
                    id: "shape",
                    label: "形状结构",
                    content:
                      "规整的几何边框包裹着自由生长的中心图案。框架代表你为自己设定的「应该」，而中心的生命力，是你真正想要的「想要」。两者长期并存，构成了内在的张力。",
                  },
                  {
                    id: "space",
                    label: "空间留白",
                    content:
                      "外圈大面积的冷色留白，是你与他人之间的安全距离。它保护了你，也在不经意间，把想要靠近你的人挡在了门外。",
                  },
                ],
              },
              {
                id: "three-circles",
                type: "three_circles",
                order: 3,
                title: "三圈能量",
                accent: "#4A7FB5",
                items: [
                  {
                    id: "inner",
                    label: "内在",
                    color: "#C25B56",
                    content:
                      "核心是充沛而炽热的，你对生活有强烈的热情与创造欲，但这股能量目前更多向内燃烧，缺少安全的出口。",
                  },
                  {
                    id: "relation",
                    label: "关系",
                    color: "#D4883E",
                    content:
                      "你在关系中习惯做给予的一方，用照顾换取连接。你给得多、要得少，长期下来容易感到「我懂别人，却没人真的懂我」。",
                  },
                  {
                    id: "outer",
                    label: "外在",
                    color: "#4A7FB5",
                    content:
                      "对外你呈现出可靠、有条理的形象，边界清晰甚至略显疏离。这层外壳让你被信任，却也让真实的脆弱难以流动出来。",
                  },
                ],
              },
              {
                id: "origin",
                type: "formation_reason",
                order: 4,
                title: "模式形成的原因",
                body: "这套「热在内、冷在外」的模式，往往形成于一段需要你「懂事、稳定、不添麻烦」的早期经历。当展现真实情绪没有得到温柔回应时，你学会了把热情收进秩序里——它曾经保护过你，只是如今，它也开始限制你。",
                accent: "#8B6AAE",
              },
              {
                id: "adjustments",
                type: "practice_suggestion",
                order: 5,
                title: "调节建议",
                accent: "#5B8C5A",
                items: [
                  {
                    id: "a1",
                    label: "松动边界",
                    icon: "🌿",
                    content:
                      "练习在安全的关系里，做一次小小的「示弱」——说出一个你平时会自己扛下的需要，观察对方的回应。",
                  },
                  {
                    id: "a2",
                    label: "向外释放",
                    icon: "🌿",
                    content:
                      "为内在的热找一个出口：一项不追求结果的创造性活动（涂鸦、写字、唱歌），让能量有处可去。",
                  },
                  {
                    id: "a3",
                    label: "接住自己",
                    icon: "🌿",
                    content:
                      "当「完美化」防御又启动时，试着对自己说一句：「不完美也没关系，我已经做得足够好了。」",
                  },
                ],
              },
            ],
          }
        : {
            title: "冰封的太阳",
            summary:
              "这是一幅充满生命力的画作，像春日里急切绽放的花朵，带着想要被世界看见的渴望。色彩浓烈却排列有序，暗示着一个在严格框架中燃烧着热情的灵魂。",
            report_mode: version,
            generated_at: "2026-03-08T10:00:00+08:00",
            modules: [
              {
                id: "summary",
                type: "summary",
                order: 1,
                title: "整体印象",
                body: "这是一幅充满生命力的画作，像春日里急切绽放的花朵，带着想要被世界看见的渴望。色彩浓烈却排列有序，暗示着一个在严格框架中燃烧着热情的灵魂。",
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
                    icon: "🎨",
                    color: "#5B8C5A",
                    content:
                      "你的本质是温暖而敏感的，像春天的泥土——看似沉默，内部却孕育着无数种子。你拥有强大的共情能力和细腻的感知力，能捕捉到他人忽略的微妙情绪变化。",
                  },
                  {
                    id: "conflict",
                    label: "你的矛盾",
                    icon: "⚡",
                    color: "#D4883E",
                    content:
                      "你渴望被看见和认可，同时又害怕暴露真实的自己。画中明亮的中心与压抑的外圈形成对比，揭示出你在“展现自我”和“保护自我”之间反复拉扯的核心矛盾。",
                  },
                  {
                    id: "pattern",
                    label: "你的模式",
                    icon: "🔄",
                    color: "#4A7FB5",
                    content:
                      "你习惯性地在关系中成为照顾者——倾听、共情、给予。但你很少允许别人走进你的内心。这种“付出型”模式让你获得安全感，也让你持续感到疲惫和不被理解。",
                  },
                  {
                    id: "defense",
                    label: "你的防御",
                    icon: "🛡️",
                    color: "#8B6AAE",
                    content:
                      "当感到威胁时，你会启动“完美化”防御——确保一切都在掌控中，用忙碌和效率来回避内心的不安。你的秩序感是一座精致的盾牌，保护着深处那个害怕犯错的孩子。",
                  },
                  {
                    id: "stuck",
                    label: "你的卡点",
                    icon: "💫",
                    color: "#C25B56",
                    content:
                      "你目前感到一种说不清的停滞感——明明很努力，却好像原地打转。这种卡顿的核心在于：你一直在向外寻求答案，却忽略了内心那个微小但清晰的声音。",
                  },
                  {
                    id: "light",
                    label: "你的光",
                    icon: "✨",
                    color: "#C8A066",
                    content:
                      "画作中隐藏着一股温柔而坚定的力量——你拥有罕见的自愈能力和创造力。当你允许自己不完美、允许自己休息时，你的光会自然绽放，照亮自己，也温暖他人。",
                  },
                ],
              },
              {
                id: "experiment",
                type: "practice_suggestion",
                order: 3,
                title: "一个小实验",
                action:
                  "这周尝试一次“不完美的展现”：发朋友圈时，不P图、不斟酌文案，直接发一张随手拍。",
                observe:
                  "观察：世界崩塌了吗？还是其实没人注意到“不完美”？你内心的感受是什么？",
                body: "这周尝试一次“不完美的展现”：发朋友圈时，不P图、不斟酌文案，直接发一张随手拍。\n观察：世界崩塌了吗？还是其实没人注意到“不完美”？你内心的感受是什么？",
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
    createHistoryRecord(
      "r1-pro-intimate",
      "intimate_relationship",
      "2026-06-08T09:30:00+08:00",
      {
        versionPurchased: ["lite", "pro"],
        canUpgrade: false,
        radii: { inner: 0.26, middle: 0.6 },
        imageIndex: 0,
        upgradeAt: "2026-06-08T10:12:00+08:00",
        proReadyAt: "2026-06-08T10:34:00+08:00",
      },
    ),
    createHistoryRecord(
      "r2-lite-wealth-career",
      "wealth",
      "2026-06-05T14:22:00+08:00",
      {
        versionPurchased: ["lite"],
        canUpgrade: true,
        radii: { inner: 0.29, middle: 0.62 },
        imageIndex: 1,
      },
    ),
    createHistoryRecord(
      "r3-pro-personal-growth",
      "personal_growth",
      "2026-06-02T20:10:00+08:00",
      {
        status: "processing",
        generationStage: "generating_pro",
        generationProgress: 95,
        versionPurchased: ["lite", "pro"],
        canUpgrade: false,
        radii: { inner: 0.35, middle: 0.7 },
        imageIndex: 0,
        upgradeAt: "2026-06-02T20:22:00+08:00",
      },
    ),
    createHistoryRecord(
      "r4-pro-parent-child",
      "parent_child_relationship",
      "2026-05-20T17:40:00+08:00",
      {
        versionPurchased: ["lite", "pro"],
        canUpgrade: false,
        radii: { inner: 0.33, middle: 0.68 },
        imageIndex: 1,
        upgradeAt: "2026-05-20T18:08:00+08:00",
        proReadyAt: "2026-05-20T18:26:00+08:00",
      },
    ),
    createHistoryRecord(
      "r5-lite-father",
      "father_relationship",
      "2026-05-12T08:15:00+08:00",
      {
        versionPurchased: ["lite"],
        canUpgrade: true,
        autoDetected: true,
        radii: { inner: 0.32, middle: 0.66 },
        imageIndex: 0,
      },
    ),
    createHistoryRecord(
      "r6-lite-mother",
      "mother_relationship",
      "2026-05-28T11:05:00+08:00",
      {
        versionPurchased: ["lite"],
        canUpgrade: true,
        radii: { inner: 0.28, middle: 0.61 },
        imageIndex: 1,
      },
    ),
    createHistoryRecord(
      "r7-lite-body",
      "body_health",
      "2026-04-22T19:10:00+08:00",
      {
        versionPurchased: ["lite"],
        canUpgrade: true,
        radii: { inner: 0.27, middle: 0.59 },
        imageIndex: 0,
      },
    ),
    createHistoryRecord(
      "r8-pro-intimate-older",
      "intimate_relationship",
      "2026-04-08T16:40:00+08:00",
      {
        versionPurchased: ["lite", "pro"],
        canUpgrade: false,
        radii: { inner: 0.25, middle: 0.57 },
        imageIndex: 1,
      },
    ),
    createHistoryRecord(
      "r9-lite-wealth-older",
      "wealth",
      "2026-03-20T10:25:00+08:00",
      {
        versionPurchased: ["lite"],
        canUpgrade: true,
        autoDetected: true,
        radii: { inner: 0.3, middle: 0.63 },
        imageIndex: 0,
      },
    ),
    createHistoryRecord(
      "r10-lite-parent-child-older",
      "parent_child_relationship",
      "2026-03-05T18:12:00+08:00",
      {
        versionPurchased: ["lite"],
        canUpgrade: true,
        radii: { inner: 0.31, middle: 0.65 },
        imageIndex: 1,
      },
    ),
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
