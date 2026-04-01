import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"), // ✅ ADD THIS
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@assets": path.resolve(__dirname, "./client/src/assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"), // matches your build system
    emptyOutDir: true,
  },
});