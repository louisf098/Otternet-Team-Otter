import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist-react",
  },
  server: {
    proxy: {
      "/getPublicIP": {
        target: "http://localhost:9378", // Replace with your backend address
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/getPublicIP/, "/getPublicIP"),
      },
    },
  },
});
