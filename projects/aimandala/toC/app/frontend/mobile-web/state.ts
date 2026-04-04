import type { MandalaFlowState, StartCreatePayload } from "../shared/types";

export interface MobileWebUploadDraft {
  imagePath: string;
  theme: string;
  paintingIntention: string;
  paintingFeeling: string;
  innerRadius?: number;
  middleRadius?: number;
}

export function toStartCreatePayload(
  draft: MobileWebUploadDraft,
  userId: string,
): StartCreatePayload {
  return {
    userId,
    imagePath: draft.imagePath,
    theme: draft.theme,
    paintingIntention: draft.paintingIntention,
    paintingFeeling: draft.paintingFeeling,
    innerRadius: draft.innerRadius,
    middleRadius: draft.middleRadius,
  };
}

export function getMobileWebPrimaryAction(state: MandalaFlowState): string {
  switch (state.step) {
    case "idle":
      return "选择画作";
    case "detectingCircles":
      return "确认三圈";
    case "liteGenerating":
      return "等待一镜 Lite 版";
    case "liteReady":
      return "查看一镜 Lite 版";
    case "upgradePlaceholder":
      return "查看一梳 Pro 版入口";
    case "error":
      return "重新开始";
    default:
      return "继续";
  }
}
