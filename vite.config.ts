import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (
              /[\\/]node_modules[\\/](react|react-dom|scheduler|use-sync-external-store|prop-types)[\\/]/i.test(
                id,
              )
            ) {
              return "vendor-react";
            }
            if (/[\\/]node_modules[\\/]gsap[\\/]/i.test(id)) {
              return "vendor-gsap";
            }
            if (/[\\/]node_modules[\\/]motion[\\/]/i.test(id)) {
              return "vendor-motion";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
