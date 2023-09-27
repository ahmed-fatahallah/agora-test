import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "agora-rtc-sdk-ng": resolve(__dirname, "node_modules/agora-rtc-sdk-ng"),
    },
  },
  server: {
    host: true,
    port: 5000,
  },
  base: "/agora-test",
});
