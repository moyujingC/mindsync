import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { MandalaFlowState } from "../types";
import {
  SharedHistoryRecordsList,
  SharedLoadingProgressCard,
  SharedReportEntrySelectionPage,
  SharedUploadChecklistCard,
  SharedUploadDetectionCard,
  SharedUploadDraftSummaryCard,
  resolveReportEntryRedeemResult,
} from "./index";

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
    auto_detected: false,
    can_upgrade: true,
  },
  report: null,
  lastError: null,
};

describe("shared ui", () => {
  it("渲染 loading progress card", () => {
    const html = renderToStaticMarkup(
      <SharedLoadingProgressCard state={flowState} />,
    );

    expect(html).toContain("正在生成新版解读报告");
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
            theme: "intimate_relationship",
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
          statusLabel: "待支付",
          title: "开始 Lite 解读",
          description: "点击开始后，会立即进入 Lite 解读生成页。",
          themeLabel: "亲密关系",
          footnote: "本次会先生成 Lite 报告；看完后，再决定要不要升级。",
          heroHint: "这一步会先帮你拿到第一份 Lite 解读。",
          redeemHint: "兑换码会先保留在表单里；当前 MVP 生成链路不会校验支付。",
          cards: [
            {
              id: "lite",
              title: "Lite",
              description: "先快速看清这次画面最明显的状态主线。",
              bulletsTitle: "读完你会更清楚",
              bullets: ["重点接住状态主线"],
              cta: "确认解读",
              note: "适合快速进入。",
              priceLabel: "9.9 元",
              tone: "lite",
              availability: "available",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("确认解读");
    expect(html).toContain("优惠券 / 兑换码");
    expect(html).toContain("读完你会更清楚");
  });

  it("渲染 Pro 支付等待态并禁用 CTA", () => {
    const html = renderToStaticMarkup(
      <SharedReportEntrySelectionPage
        descriptor={{
          statusLabel: "等待支付确认",
          title: "升级到 Pro 深度解读",
          description: "支付确认前不会展示 Pro 权益内容。",
          themeLabel: "财富关系",
          footnote: "这一步会沿用刚才同一幅画作与同一议题继续升级。",
          heroHint: "这一步不是重新开始。",
          redeemHint: "Pro 权益只在支付或授权确认后解锁。",
          paymentHint:
            "支付已发起，正在等待回调确认。请不要重复支付，可以稍后从历史记录恢复。",
          paymentState: "pending",
          cards: [
            {
              id: "pro",
              title: "Pro",
              description: "在 Lite 基础上继续深入。",
              bulletsTitle: "Pro 会继续展开",
              bullets: ["完整报告与追问能力"],
              cta: "等待确认中",
              note: "适合已经读完 Lite 的用户。",
              priceLabel: "再付 29 元升级",
              tone: "pro",
              availability: "available",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("等待支付确认");
    expect(html).toContain("正在等待回调确认");
    expect(html).toContain('disabled=""');
  });

  it("计算 report-entry 兑换结果", () => {
    expect(
      resolveReportEntryRedeemResult({
        cardId: "lite",
        code: "MVP_LITE",
        priceLabel: "9.9 元",
      }),
    ).toEqual({
      state: "success",
      message: "兑换成功：MVP 体验券已应用。",
      discountLabel: "9.9 元",
      payableLabel: "0 元",
    });
    expect(
      resolveReportEntryRedeemResult({
        cardId: "pro",
        code: "mvp-pro",
        priceLabel: "再付 29 元升级",
      }),
    ).toEqual({
      state: "success",
      message: "兑换成功：MVP 体验券已应用。",
      discountLabel: "29 元",
      payableLabel: "0 元",
    });
    expect(
      resolveReportEntryRedeemResult({
        cardId: "lite",
        code: "",
        priceLabel: "9.9 元",
      }),
    ).toEqual({
      state: "empty",
      message: "请先输入优惠券或兑换码。",
    });
    expect(
      resolveReportEntryRedeemResult({
        cardId: "lite",
        code: "MVP_PRO",
        priceLabel: "9.9 元",
      }),
    ).toEqual({
      state: "error",
      message: "兑换失败：兑换码无效或不适用于当前解读版本。",
    });
  });

  it("渲染 upload shared cards", () => {
    const html = renderToStaticMarkup(
      <>
        <SharedUploadChecklistCard
          checklist={[
            { id: "asset", label: "上传画作", status: "done" },
            { id: "detect", label: "确认三圈边界", status: "pending" },
          ]}
        />
        <SharedUploadDetectionCard
          detection={null}
          section={{
            id: "circles",
            title: "三圈人工确认",
            description: "请在画作上手动调整内中圈和中外圈边界。",
          }}
        />
        <SharedUploadDraftSummaryCard
          section={{
            id: "theme",
            title: "议题与补充信息",
            description: "当前先展示共享摘要内容。",
          }}
          fields={[
            { label: "解读议题", value: "亲密关系" },
            { label: "创作感受", value: "有一点保护，也有一点想靠近。" },
          ]}
        />
      </>,
    );

    expect(html).toContain("迁移期推荐流程");
    expect(html).toContain("三圈人工确认");
    expect(html).toContain("议题与补充信息");
  });
});
