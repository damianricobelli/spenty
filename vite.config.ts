import { paraglideVitePlugin } from "@inlang/paraglide-js";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    allowedHosts: [".local", ".localcan.dev"],
  },
  plugins: [
    devtools(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["url"],
    }),
    tailwindcss(),
    tanstackStart({
      router: {
        enableRouteGeneration: true,
      },
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
});

export default config;
