import { createBrowserRouter } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { UploadPage } from "./components/UploadPage";
import { LoadingPage } from "./components/LoadingPage";
import { ReportLitePage } from "./components/ReportLitePage";
import { ReportProPage } from "./components/ReportProPage";
import { HistoryPage } from "./components/HistoryPage";
import { SelectPlanPage } from "./components/SelectPlanPage";
import { ConfirmPaymentPage } from "./components/ConfirmPaymentPage";
import { HistoryRecordDetailPage } from "./components/HistoryRecordDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/upload",
    Component: UploadPage,
  },
  {
    path: "/loading",
    Component: LoadingPage,
  },
  {
    path: "/report",
    Component: ReportLitePage,
  },
  {
    path: "/report/lite",
    Component: ReportLitePage,
  },
  {
    path: "/report/pro",
    Component: ReportProPage,
  },
  {
    path: "/history",
    Component: HistoryPage,
  },
  {
    path: "/select-plan",
    Component: SelectPlanPage,
  },
  {
    path: "/confirm-payment",
    Component: ConfirmPaymentPage,
  },
  {
    path: "/history-record-detail/not-upgraded",
    Component: HistoryRecordDetailPage,
  },
  {
    path: "/history-record-detail/generating",
    Component: HistoryRecordDetailPage,
  },
  {
    path: "/history-record-detail/viewable",
    Component: HistoryRecordDetailPage,
  },
]);