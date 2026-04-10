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
  const themeLabel = getThemeDisplayName(draft.theme) ?? "全面解读";

  return {
    statusLabel: "作品识别完成",
    title: "这次你想用哪种方式开始解读？",
    description: "Lite 更轻、更快；Pro 更完整、更深入。",
    themeLabel,
    footnote: "两种都会基于你这次上传的作品继续解读。",
    cards: [
      {
        id: "lite",
        title: "Lite",
        description: "先轻一点地看清这次的状态。",
        bullets: [
          "更轻、更快，适合先进入这次解读",
          "重点看这次画里最明显的状态线索",
          "阅读负担更低，适合先开始",
        ],
        cta: "选择 Lite",
        note: "更适合先快速看清这次画面在回应什么。",
        priceLabel: "9.9 元",
        tone: "lite",
        availability: "available",
      },
      {
        id: "pro",
        title: "Pro",
        description: "更完整地看懂这次画在表达什么。",
        bullets: [
          "更完整地梳理这次状态的解释链",
          "会补上更清楚的现实连接与原因说明",
          "适合想认真看懂这次状态的人",
        ],
        cta: "选择 Pro",
        note: "更适合想一次看得更完整、更深入一些。",
        priceLabel: "39 元",
        tone: "pro",
        availability: "available",
      },
    ],
  };
}
