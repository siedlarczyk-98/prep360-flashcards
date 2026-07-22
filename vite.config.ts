import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/questoes": {
        target: process.env.PREP360_API_TARGET || "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/api/simulados": {
        target: process.env.PREP360_API_TARGET || "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/api": {
        target: "https://prep360.up.railway.app",
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: "https://admin.paciente360.com.br",
          Referer: "https://admin.paciente360.com.br/",
        },
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
