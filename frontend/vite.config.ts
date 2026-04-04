import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/** Some static hosts serve 404.html for unknown paths; SPA shell then runs the client router. */
function spaFallback404Plugin(): import("vite").Plugin {
  return {
    name: "spa-fallback-404-html",
    closeBundle() {
      const indexHtml = path.resolve(import.meta.dirname, "dist/index.html");
      const notFound = path.resolve(import.meta.dirname, "dist/404.html");
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, notFound);
      }
    },
  };
}

const port = Number(process.env.PORT ?? 5173);
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    spaFallback404Plugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    // Relative to `root` — outputs to frontend/dist (matches Render staticPublishPath: frontend/dist)
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      // FastAPI extract (must be before /api so it is not sent to Express)
      "/api/v1/extract": {
        target: process.env.VITE_EXTRACT_PROXY_TARGET ?? "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
