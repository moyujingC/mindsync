import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/AppRoutes";
import { bootstrapDefaultConsoleBrowserDeploymentRuntime } from "./app/consoleBrowserDeploymentRuntime";
import "./styles.css";

bootstrapDefaultConsoleBrowserDeploymentRuntime();

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
