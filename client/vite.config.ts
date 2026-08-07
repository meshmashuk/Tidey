import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import os from "node:os";
import path from "node:path";

const apiProxy = {
  "/api": {
    target: "http://localhost:8787",
    changeOrigin: true,
  },
};

// Keep Vite's dependency-optimization cache OUT of the project's node_modules.
// This repo lives in a Dropbox-synced folder, and Dropbox locks
// `node_modules/.vite`, which makes Vite's atomic `deps_temp → deps` rename fail
// with `EBUSY` during dep optimization. A temp-dir cache sidesteps the lock and
// is fully disposable (Vite just rebuilds it if it's cleared).
const cacheDir = path.join(os.tmpdir(), "tidey-vite-cache");

export default defineConfig({
  cacheDir,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
});
