import { defineConfig } from "vitest/config";

/** Vitest configuration: runtime tests only; `*.test-d.ts` files are checked by `tsc`. */
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
