import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type {
  LiteStructuredReport,
  MandalaFlowState,
  ProStructuredReport,
} from "../types";
import {
  SharedHistoryRecordsList,
  SharedLoadingProgressCard,
  SharedProStructuredReportCards,
  SharedReportEntrySelectionPage,
  SharedStructuredReportCards,
  SharedUploadChecklistCard,
  SharedUploadDetectionCard,
  SharedUploadDraftSummaryCard,
} from "./index";

const structured: LiteStructuredReport = {
  title: "Lite 报告",
  overall_impression: "你最近在慢慢收拢自己的注意力。",
  visual_elements_rendered: "中心更稳，外围更轻。",
  emotion_portrait_rendered: "你在想靠近与想退后之间摆动。",
  lite_healing_guidance: {
    directions: [
      {
        title: "先稳住自己",
        content: "先把注意力放回到自己此刻最想守住的部分。",
      },
    ],
    micro_practices: [
      {
        title: "一句真实感受",
        content: "先说出一句真实感受，而不是立刻解释。",
      },
    ],
  },
  pro_report_entry: {
    title: "另一份更深的独立报告",
    summary: "如果你希望从更深层结构继续理解这张画，可以看看 Pro 报告。",
    product_note: "Pro 不是 Lite 的升级版，而是另一份独立购买的完整解读。",
  },
  pro_teaser: "可以继续查看 Pro 解读。",
  self_understanding_blocks: {
    opening_hit: "你正在先稳住自己，再决定要不要继续往前。",
    visual_evidence: {
      summary: "中心颜色更浓，外围留白更多。",
    },
    state_interpretation: {
      current_state: "你在回收注意力。",
      emotional_tension: "同时又还保留一点试探。",
      explanation_chain: "于是画面看起来既收又放。",
    },
    pattern_naming: {
      pattern_name: "先靠近再缩回",
      pattern_description: "你会先有表达冲动，然后又迅速回撤。",
      protective_logic: "这样能先保住安全感。",
    },
    reality_connection: {
      life_dimension: "关系",
      typical_scene: "一段关系更靠近时会先暂停一下。",
      current_impact: "对方会感到你忽近忽远。",
    },
    next_step: {
      direction: "先不急着解释自己。",
      action: "先说出一句真实感受。",
    },
  },
};

const proStructured: ProStructuredReport = {
  first_impression: "你正在把原本分散的注意力重新拉回中心。",
  core_insight_table: {
    current_state: "外松内紧",
    relationship_pattern: "想靠近又想保留退路",
  },
  three_circles_detailed: {
    inner: {
      label: "内圈",
      reading: "核心感受已经很浓，但暂时不想完全暴露出来。",
    },
  },
  micro_analysis_detailed: {
    adjacent: "相邻区域贴得较近，说明感受之间正在互相牵动。",
  },
  imbalance_confirmed: {
    primary: "边界过紧",
    evidence: "外围张力仍然比较明显。",
  },
  root_cause: {
    core: "担心主动表达之后失去掌控感。",
  },
  healing_suggestions: [
    {
      phase: "第一阶段",
      focus: "先辨认自己最想守住的是什么。",
      practice: "每天写下一句最真实的担心。",
    },
  ],
};

const flowState: MandalaFlowState = {
  step: "liteGenerating",
  selectedImage: null,
  detection: null,
  geometry: null,
  interpretation: null,
  status: {
    interpretation_id: "ipt-1",
    status: "processing",
    generation_stage: "generating",
    generation_progress: 62,
    report_ready: false,
    version_purchased: ["lite"],
    three_circles: {
      inner_radius: 0.28,
      middle_radius: 0.63,
    },
    auto_detected: true,
    can_upgrade: true,
  },
  report: null,
  lastError: null,
};

describe("shared ui", () => {
  it("渲染 structured report cards", () => {
    const html = renderToStaticMarkup(
      <SharedStructuredReportCards structured={structured} />,
    );

    expect(html).toContain("模式命名");
    expect(html).toContain("一个下一步");
    expect(html).toContain("轻量调节方向");
    expect(html).toContain("现在可以先做的小练习");
    expect(html).toContain("独立产品入口");
  });

  it("渲染 pro structured report cards", () => {
    const html = renderToStaticMarkup(
      <SharedProStructuredReportCards structured={proStructured} />,
    );

    expect(html).toContain("第一眼直觉");
    expect(html).toContain("三圈深度诊断");
    expect(html).toContain("疗愈建议");
  });

  it("渲染 loading progress card", () => {
    const html = renderToStaticMarkup(
      <SharedLoadingProgressCard state={flowState} />,
    );

    expect(html).toContain("正在生成一镜 Lite 版");
    expect(html).toContain("62%");
  });

  it("渲染 history records list", () => {
    const html = renderToStaticMarkup(
      <SharedHistoryRecordsList
        items={[
          {
            interpretationId: "ipt-history-1",
            title: "关系主题 · Pro",
            subtitle: "创建于 04/12 16:20",
            recordReady: false,
            availableReportTypes: ["lite", "pro"],
            focusReportType: "pro",
            versionSummary: "Lite / Pro",
            statusLabel: "Pro 生成中",
            statusDetail: "仍在后台生成。",
            actionLabel: "查看详情与进度",
            statusTone: "proPending",
            helperNote: "无需一直停留在等待页。",
            stageLabel: "正在生成 Lite 解读",
            progressLabel: "约 52%",
            themeLabel: "亲密关系",
          },
        ]}
        activeFilter="all"
      />,
    );

    expect(html).toContain("Pro 生成中");
    expect(html).toContain("查看详情与进度");
    expect(html).toContain("Interpretation ID");
  });

  it("渲染 report-entry selection page", () => {
    const html = renderToStaticMarkup(
      <SharedReportEntrySelectionPage
        descriptor={{
          statusLabel: "作品识别完成",
          title: "这次你想用哪种方式开始解读？",
          description: "先选这次想看的深度，再进入对应的解读生成页。",
          themeLabel: "亲密关系",
          footnote: "两种都会基于这次上传的同一幅作品继续解读。",
          cards: [
            {
              id: "lite",
              title: "Lite",
              description: "先快速看清这次画面最明显的状态主线。",
              bullets: ["重点接住状态主线"],
              cta: "选择 Lite",
              note: "适合快速进入。",
              priceLabel: "9.9 元",
              tone: "lite",
              availability: "available",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("选择 Lite");
    expect(html).toContain("温柔提示");
    expect(html).toContain("当前主题");
  });

  it("渲染 upload shared cards", () => {
    const html = renderToStaticMarkup(
      <>
        <SharedUploadChecklistCard
          checklist={[
            { id: "asset", label: "上传画作", status: "done" },
            { id: "detect", label: "等待三圈检测", status: "pending" },
          ]}
        />
        <SharedUploadDetectionCard
          detection={null}
          section={{
            id: "circles",
            title: "三圈检测",
            description: "等待调用 detect-circles 获取三圈建议。",
          }}
        />
        <SharedUploadDraftSummaryCard
          section={{
            id: "theme",
            title: "主题与补充信息",
            description: "当前先展示共享摘要内容。",
          }}
          fields={[
            { label: "解读主题", value: "亲密关系" },
            { label: "创作感受", value: "有一点保护，也有一点想靠近。" },
          ]}
        />
      </>,
    );

    expect(html).toContain("迁移期推荐流程");
    expect(html).toContain("触发三圈检测");
    expect(html).toContain("主题与补充信息");
  });
});
