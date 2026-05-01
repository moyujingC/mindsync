import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.RELAYHUB_CONSOLE_BASE_PATH ?? "/",
  envPrefix: ["VITE_", "RELAYHUB_"],
  plugins: [react()],
  server: {
    proxy: {
      "/api/control-plane": {
        target: "http://127.0.0.1:4318",
        changeOrigin: true,
      },
      "/claude": {
        target: "http://127.0.0.1:4319",
        changeOrigin: true,
      },
    },
  },
  build: mode === "trial"
    ? {
        rollupOptions: {
          input: {
            index: "trial.html",
          },
        },
      }
    : undefined,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
}));
