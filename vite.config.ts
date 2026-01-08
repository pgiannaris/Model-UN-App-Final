import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import flowbiteReact from "flowbite-react/plugin/vite";

export default defineConfig({
  base: "/Model-UN-App-Final/", // <-- GitHub Pages base path
  plugins: [
    react(),
    flowbiteReact()
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://apr2025-team5.pockethost.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
