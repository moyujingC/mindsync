import type { MobileWebPageViewModel } from "../view-model";

export interface ReportPageSection {
  id: string;
  heading: string;
  body: string;
}

export interface ReportPageDescriptor {
  pageId: "report-page";
  title: string;
  subtitle: string;
  primaryActionLabel: string;
  sections: ReportPageSection[];
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
  };
}
