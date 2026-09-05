import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const shims = here("./shims.tsx");

export default defineConfig({
  root: here("./"),
  envDir: false,
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
  css: { postcss: here("../../") },
  resolve: { alias: [
    { find: /^next\/link$/, replacement: here("./link.tsx") },
    { find: /^next\/image$/, replacement: here("./image.tsx") },
    { find: /^@\/lib\/(db|household)$/, replacement: here("./fixtures.ts") },
    { find: /^@\/actions\//, replacement: "preview-actions/" },
    { find: /^next\/navigation$/, replacement: shims },
    { find: /^@clerk\/nextjs$/, replacement: shims },
    { find: "@", replacement: here("../../src") },
  ] },
  plugins: [{
    name: "read-only-preview-boundaries",
    resolveId(id) {
      if (id.startsWith("preview-actions/")) return shims;
    },
  }],
});
