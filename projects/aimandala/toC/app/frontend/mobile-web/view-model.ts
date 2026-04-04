import { getLiteStructuredReport } from "../shared/core";
import type { MandalaFlowState } from "../shared/types";

export interface MobileWebPageViewModel {
  step: string;
  primaryActionLabel: string;
  title: string;
  subtitle: string;
  reportMarkdown: string | null;
  interpretationId: string | null;
  lastError: string | null;
}

export function createMobileWebPageViewModel(
  state: MandalaFlowState,
  primaryActionLabel: string,
): MobileWebPageViewModel {
  const structured = getLiteStructuredReport(state.report);

  if (state.lastError) {
    return {
      step: state.step,
      primaryActionLabel,
      title: "当前流程发生错误",
      subtitle: state.lastError,
      reportMarkdown: null,
      interpretationId: state.interpretation?.interpretation_id ?? null,
      lastError: state.lastError,
    };
  }

  if (structured) {
    return {
      step: state.step,
      primaryActionLabel,
      title: structured.title,
      subtitle: structured.overall_impression,
      reportMarkdown: state.report?.report ?? null,
      interpretationId: state.interpretation?.interpretation_id ?? null,
      lastError: null,
    };
  }

  return {
    step: state.step,
    primaryActionLabel,
    title: "一镜 Lite 版准备中",
    subtitle: "当前正在准备迁移期的最小主路径结果。",
    reportMarkdown: state.report?.report ?? null,
    interpretationId: state.interpretation?.interpretation_id ?? null,
    lastError: null,
  };
}
