import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["server/index.ts"],
  format: ["esm"], // IMPORTANT: use ESM, not CJS
  outDir: "dist",
  target: "node18",
  splitting: false,
  sourcemap: false,
  clean: false,
  tsconfig: "tsconfig.server.json",
  bundle: true,
  external: [
    "vite",
    "@vitejs",
    "tailwindcss",
    "@tailwindcss",
    "@replit/vite-plugin-cartographer",
    "@replit/vite-plugin-dev-banner",
    "@replit/vite-plugin-runtime-error-modal",
  ],
});
