import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: true,

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});