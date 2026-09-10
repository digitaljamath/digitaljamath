import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Dev: Vite on :5174, proxy /api → Frappe.
// Build: emit into digital_jamath/public/committee (served at /assets/digital_jamath/committee/).
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/assets/digital_jamath/committee/" : "/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../digital_jamath/public/committee",
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: Number(process.env.DJ_DEV_PORT) || 5174,
    proxy: {
      "/api": {
        target: process.env.DJ_API_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
}));
