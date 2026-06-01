import { createBrowserRouter } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { UploadPage } from "./components/UploadPage";
import { LoadingPage } from "./components/LoadingPage";
import { ReportPage } from "./components/ReportPage";
import { HistoryPage } from "./components/HistoryPage";
import { SelectPlanPage } from "./components/SelectPlanPage";

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
    Component: ReportPage,
  },
  {
    path: "/history",
    Component: HistoryPage,
  },
  {
    path: "/select-plan",
    Component: SelectPlanPage,
  },
]);