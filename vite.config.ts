import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  nitro: {
  preset: "vercel",
},

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});