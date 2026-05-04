import type {
  CreateInterpretationResponse,
  InterpretationRecordResponse,
  InterpretationStatusResponse,
  MandalaFlowState,
  MandalaFlowStep,
} from "../types";

type GenerationSource =
  | Pick<CreateInterpretationResponse, "status" | "generation_stage" | "generation_progress" | "report_ready">
  | Pick<InterpretationStatusResponse, "status" | "generation_stage" | "generation_progress" | "report_ready">
  | (Pick<InterpretationRecordResponse, "status" | "generation_stage" | "generation_progress"> & {
      report_ready?: boolean;
    });

export interface GenerationPresentation {
  isReady: boolean;
  statusLabel: string;
  statusDetail: string;
  stageLabel: string;
  progressLabel: string;
}

function clampProgress(progress: number | null | undefined): number {
  if (typeof progress !== "number" || Number.isNaN(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}

export function isGenerationReady(source: GenerationSource): boolean {
  return Boolean(
    source.report_ready ||
      source.generation_progress >= 100 ||
      source.generation_stage === "report_ready",
  );
}

export function getGenerationPresentation(
  source: GenerationSource,
): GenerationPresentation {
  const progress = clampProgress(source.generation_progress);
  const ready = isGenerationReady(source);

  if (ready) {
    return {
      isReady: true,
      statusLabel: "可查看报告",
      statusDetail: "Lite 解读已完成，可直接进入报告页查看结果。",
      stageLabel: "准备展示结果",
      progressLabel: "100%",
    };
  }

  switch (source.generation_stage) {
    case "starting":
      return {
        isReady: false,
        statusLabel: "准备开始",
        statusDetail: "当前刚进入解读流程，系统正在准备生成 Lite 内容。",
        stageLabel: "已接收画作",
        progressLabel: `约 ${progress}%`,
      };
    case "generating_lite":
      return {
        isReady: false,
        statusLabel: "生成中",
        statusDetail: `Lite 解读正在生成中，当前进度约 ${progress}%。`,
        stageLabel: "正在生成 Lite 解读",
        progressLabel: `约 ${progress}%`,
      };
    case "report_ready":
      return {
        isReady: false,
        statusLabel: "正在整理",
        statusDetail: "结构化报告已经接近完成，正在准备展示结果。",
        stageLabel: "正在整理报告结构",
        progressLabel: `约 ${progress}%`,
      };
    default:
      return {
        isReady: false,
        statusLabel: source.status === "completed" ? "已完成" : "处理中",
        statusDetail: `当前仍在处理中，进度约 ${progress}%。`,
        stageLabel: "正在处理当前解读",
        progressLabel: `约 ${progress}%`,
      };
  }
}

export function getFlowStepLabel(
  state: MandalaFlowState,
): string {
  switch (state.step) {
    case "idle":
      return "待上传";
    case "detectingCircles":
      return "三圈确认中";
    case "liteGenerating":
      return getGenerationPresentation(
        state.status ?? state.interpretation ?? {
          status: "processing",
          generation_stage: "starting",
          generation_progress: 0,
          report_ready: false,
        },
      ).stageLabel;
    case "liteReady":
      return "Lite 结果已就绪";
    case "proReady":
      return "Pro 结果已就绪";
    case "error":
      return "结果拉取失败";
    default:
      return getFallbackStepLabel(state.step);
  }
}

function getFallbackStepLabel(step: MandalaFlowStep): string {
  return step;
}
