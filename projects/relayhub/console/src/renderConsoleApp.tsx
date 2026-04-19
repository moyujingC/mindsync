import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/AppRoutes";
import { getConsoleRouterBasename } from "./app/consoleRouter";

export function renderConsoleApp(basePath?: string) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter basename={getConsoleRouterBasename(basePath)}>
        <AppRoutes />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
