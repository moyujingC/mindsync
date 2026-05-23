import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.jpg", "**/*.JPG", "**/*.jpeg"],
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "shared/core/flow.ts",
        "shared/core/identity.ts",
        "shared/core/themes.ts",
        "shared/ui/history.tsx",
        "shared/ui/report-entry.tsx",
        "shared/ui/report.tsx",
        "shared/ui/upload.tsx",
        "mobile-web/app.tsx",
        "mobile-web/browser-debug-panel.tsx",
        "mobile-web/controller.ts",
        "mobile-web/identity.ts",
        "mobile-web/state.ts",
        "mobile-web/pages/history-page.ts",
        "miniapp/app.tsx",
        "mobile-web/pages/report-entry-page.ts",
        "mobile-web/page-shells/history-page.tsx",
        "mobile-web/page-shells/loading-page.tsx",
        "mobile-web/page-shells/report-page.tsx",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        statements: 60,
        branches: 45,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 4173,
    fs: {
      allow: [path.resolve(__dirname, "../../..")],
    },
    proxy: {
      "/api": {
        target:
          process.env.AIMANDALA_VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
