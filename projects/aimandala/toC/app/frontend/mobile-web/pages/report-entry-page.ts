import { getThemeDisplayName } from "../../shared/core";
import type {
  MobileWebReportProductType,
  MobileWebUploadDraft,
} from "../state";

export type ReportEntryAvailability = "available";

export interface ReportEntryCardDescriptor {
  id: MobileWebReportProductType;
  title: string;
  description: string;
  bulletsTitle?: string;
  bullets: string[];
  cta: string;
  note: string;
  priceLabel: string;
  tone: "lite" | "pro";
  availability: ReportEntryAvailability;
}

export interface ReportEntryPageDescriptor {
  statusLabel: string;
  title: string;
  description: string;
  themeLabel: string;
  footnote: string;
  heroHint: string;
  redeemHint: string;
  cards: ReportEntryCardDescriptor[];
}

export function createReportEntryPageDescriptor(
  draft: Pick<MobileWebUploadDraft, "theme" | "reportType" | "reportVariant">,
): ReportEntryPageDescriptor {
  const themeLabel = getThemeDisplayName(draft.theme) ?? "财富关系";
  const isProUpgrade =
    (draft.reportType ?? draft.reportVariant) === "pro";

  return {
    statusLabel: isProUpgrade ? "Lite 解读已完成" : "作品识别完成",
    title: isProUpgrade ? "升级到 Pro 深度解读" : "开始 Lite 解读",
    description: isProUpgrade
      ? "点击升级后，会直接跳过 Pro 支付确认，继续生成 Pro 完整报告。"
      : "点击开始后，会直接生成 Lite 解读报告。",
    themeLabel,
    footnote: isProUpgrade
      ? "这一步会沿用刚才同一幅画作与同一议题继续升级，不需要重新上传或重新识别。"
      : "",
    heroHint: isProUpgrade
      ? "这一步不是重新开始，而是在刚才那份 Lite 解读基础上继续深入。"
      : "这一步会使用刚才选择的 Lite 版本，当前先跳过真实支付。",
    redeemHint: isProUpgrade
      ? "兑换码会先保留在表单里；当前 MVP 生成链路不会校验支付。"
      : "兑换码会先保留在表单里；当前 MVP 生成链路不会校验支付。",
    cards: isProUpgrade
      ? [
          {
            id: "pro",
            title: "Pro",
            description: "在 Lite 基础上继续深入，解锁完整报告与追问能力。",
            bulletsTitle: "Pro 会继续展开",
            bullets: [
              "会展开更完整的状态解释链与现实连接",
              "可继续看到三圈能量、失衡诊断与更深层建议",
            ],
            cta: "升级 Pro版",
            note: "适合已经读完 Lite，想继续看清这幅画更深层结构的人。",
            priceLabel: "再付 29 元升级",
            tone: "pro",
            availability: "available",
          },
        ]
      : [
          {
            id: "lite",
            title: "Lite",
            description: "",
            bulletsTitle: "落笔成心，照见此刻的自己",
            bullets: [
              "从线条与色彩中，看见你当下的真实心境",
              "帮你梳理近期的压力来源与内心期待",
              "发现你身上被自己忽略的力量与闪光点",
              "给出适合你当下的简单自我关照方向",
              "让你在忙碌中，拥有片刻与自己相处的宁静",
            ],
            cta: "确认解读",
            note: "",
            priceLabel: "9.9 元",
            tone: "lite",
            availability: "available",
          },
        ],
  };
}
