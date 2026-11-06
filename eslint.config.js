import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * ESLint configuration: the recommended JavaScript rules plus typescript-eslint's strict and
 * stylistic type-checked rules, typed through `tsconfig.json`, which also covers this file. The
 * Figma typings check lives in its own tsconfig, which the project service does not look for, so
 * it names that project explicitly.
 */
export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["test/figma-typings.test-d.ts"],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: "./tsconfig.figma.json",
      },
    },
  },
);
