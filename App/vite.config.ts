import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": proxyTarget(),
      "/auth": proxyTarget(),
      "/profile": proxyTarget(),
      "/collections": proxyTarget(),
      "/saved-places": proxyTarget(),
    },
  },
});

function proxyTarget() {
  return {
    target: "http://localhost:5000",
    changeOrigin: true,
  };
}
