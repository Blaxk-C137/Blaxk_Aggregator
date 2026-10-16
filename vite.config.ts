import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

