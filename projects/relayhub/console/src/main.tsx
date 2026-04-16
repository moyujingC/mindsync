import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/AppRoutes";
import { bootstrapConsoleAppRuntime } from "./app/consoleAppRuntime";
import "./styles.css";

bootstrapConsoleAppRuntime();

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
