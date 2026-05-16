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
  cards: ReportEntryCardDescriptor[];
}

export function createReportEntryPageDescriptor(
  draft: Pick<MobileWebUploadDraft, "theme">,
): ReportEntryPageDescriptor {
  const themeLabel = getThemeDisplayName(draft.theme) ?? "财富议题";

  return {
    statusLabel: "作品识别完成",
    title: "这次你想用哪种方式开始解读？",
    description: "先选这次想看的深度，再进入对应的解读生成页。",
    themeLabel,
    footnote: "两种都会基于这次上传的同一幅作品继续解读，不会重新识别。",
    cards: [
      {
        id: "lite",
        title: "Lite",
        description: "先快速看清这次画面最明显的状态主线。",
        bullets: [
          "重点接住这次最突出的状态与气氛",
          "阅读更轻，适合先进入这次解读",
        ],
        cta: "选择 Lite",
        note: "适合先快速进入，再决定要不要继续看得更深。",
        priceLabel: "9.9 元",
        tone: "lite",
        availability: "available",
      },
      {
        id: "pro",
        title: "Pro",
        description: "一次更完整地看懂这次画在表达什么。",
        bullets: [
          "会展开更完整的状态解释链与现实连接",
          "适合想一次看得更深入、更具体的人",
        ],
        cta: "选择 Pro",
        note: "适合已经准备好认真读完这一份完整报告的人。",
        priceLabel: "39 元",
        tone: "pro",
        availability: "available",
      },
    ],
  };
}
