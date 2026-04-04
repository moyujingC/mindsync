import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { MobileWebBrowserShell } from "./browser-shell";
import "./styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Missing root container for mobile-web runtime");
}

createRoot(container).render(
  <StrictMode>
    <MobileWebBrowserShell />
  </StrictMode>,
);
