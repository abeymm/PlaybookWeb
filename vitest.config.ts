import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Root-level suites plus co-located lib/handler tests under src/.
    include: ["__tests__/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/legal.ts", "Scripts/build-legal-assets.ts", "src/lib/book/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
