import type { MobileWebPageViewModel } from "../view-model";

export interface ReportPageSection {
  id: string;
  heading: string;
  body: string;
}

export interface ReportPageMetric {
  label: string;
  value: string;
}

export interface ReportPageDescriptor {
  pageId: "report-page";
  title: string;
  subtitle: string;
  primaryActionLabel: string;
  sections: ReportPageSection[];
  metrics: ReportPageMetric[];
}

export function createReportPageDescriptor(
  viewModel: MobileWebPageViewModel,
): ReportPageDescriptor {
  return {
    pageId: "report-page",
    title: viewModel.title,
    subtitle: viewModel.subtitle,
    primaryActionLabel: viewModel.primaryActionLabel,
    sections: [
      {
        id: "status",
        heading: "当前流程状态",
        body: `当前步骤：${viewModel.step}`,
      },
      {
        id: "report",
        heading: "报告内容",
        body: viewModel.reportMarkdown || "当前还没有可展示的报告正文。",
      },
    ],
    metrics: [
      {
        label: "当前步骤",
        value: viewModel.step,
      },
      {
        label: "报告状态",
        value: viewModel.reportMarkdown ? "已就绪" : "准备中",
      },
      {
        label: "Interpretation ID",
        value: viewModel.interpretationId || "暂未生成",
      },
    ],
  };
}
