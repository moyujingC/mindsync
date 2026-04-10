import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  assetsInclude: [
    "**/*.jpg",
    "**/*.JPG",
    "**/*.jpeg",
  ],
  server: {
    host: "0.0.0.0",
    port: 4173,
    fs: {
      allow: [
        path.resolve(__dirname, "../../.."),
      ],
    },
    proxy: {
      "/api": {
        target: process.env.AIMANDALA_VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
