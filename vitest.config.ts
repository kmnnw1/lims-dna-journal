import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist"],
    globals: true,
    coverage: {
      reporter: ["text", "lcov"],
      provider: "v8",
      exclude: ["**/*.d.ts"],
    },
    reporters: ["default"],
    watch: false,
    clearMocks: true,
  },
});
