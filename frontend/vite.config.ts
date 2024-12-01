import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    nodePolyfills({
      protocolImports: true, // Polyfills for Node.js-specific APIs like Buffer
    }),
  ],
  define: {
    global: {},
  },
  base: "./",
  build: {
    outDir: "dist-react",
  },
});
