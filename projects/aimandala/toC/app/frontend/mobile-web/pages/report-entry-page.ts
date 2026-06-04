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
    title: isProUpgrade ? "确认升级到 Pro 深度解读" : "确认支付 Lite 解读",
    description: isProUpgrade
      ? "补齐这一步后，会继续生成 Pro 完整报告。"
      : "支付完成后，会进入 Lite 解读生成流程。",
    themeLabel,
    footnote: isProUpgrade
      ? "这一步会沿用刚才同一幅画作与同一议题继续升级，不需要重新上传或重新识别。"
      : "",
    heroHint: isProUpgrade
      ? "这一步不是重新开始，而是在刚才那份 Lite 解读基础上继续深入。"
      : "这一步会先用刚才选的 Lite 版本，支付之后无法再改动。",
    redeemHint: isProUpgrade
      ? "系统会在升级前校验兑换码；升级成功后会继续生成 Pro 完整报告。"
      : "兑换码已填写，支付时会一起校验。",
    cards: isProUpgrade
      ? [
          {
            id: "pro",
            title: "Pro",
            description: "在 Lite 基础上继续深入，解锁完整报告与追问能力。",
            bullets: [
              "会展开更完整的状态解释链与现实连接",
              "可继续看到三圈能量、失衡诊断与更深层建议",
            ],
            cta: "确认支付",
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
            bullets: [
              "重点描述这次画面最突出的状态与气氛",
              "阅读简短，适合先快速看清这次解读",
              "适合快速进入；之后想深入，可在 Lite 基础上升级 Pro",
            ],
            cta: "确认支付",
            note: "",
            priceLabel: "9.9 元",
            tone: "lite",
            availability: "available",
          },
        ],
  };
}
