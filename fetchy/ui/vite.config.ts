import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
      dedupe: [
        "@codemirror/state",
        "@codemirror/view",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/commands",
        "@codemirror/search",
        "@codemirror/autocomplete",
        "@codemirror/theme-one-dark",
        "codemirror",
      ],
    },
    optimizeDeps: {
      include: [
        "@codemirror/lang-json",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/state",
        "@codemirror/view",
      ],
    },
    server: {
      port: Number(env.PORT) || 5173,
      host: env.HOST || true,
    },
  };
});
