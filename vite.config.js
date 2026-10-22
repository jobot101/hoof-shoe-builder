import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// default build  -> www/        (GitHub Pages web app + Capacitor phone apps)
// --mode artifact -> artifact/  (one self-contained HTML file for Claude)
export default defineConfig(({ mode }) => {
  const artifact = mode === "artifact";
  return {
    base: "./",
    plugins: [
      react(),
      ...(artifact
        ? [
            viteSingleFile({ removeViteModuleLoader: true }),
            {
              name: "strip-pwa-tags",
              transformIndexHtml: (html) => html.replace(/<!--pwa-->[\s\S]*?<!--\/pwa-->/, ""),
            },
          ]
        : []),
    ],
    publicDir: artifact ? false : "public",
    build: {
      outDir: artifact ? "artifact" : "www",
      emptyOutDir: true,
      assetsInlineLimit: artifact ? 100000000 : 4096,
      chunkSizeWarningLimit: 2000,
    },
  };
});
