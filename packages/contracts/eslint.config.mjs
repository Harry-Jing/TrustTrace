// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginTsdoc from "eslint-plugin-tsdoc";
import skipFormatting from "eslint-config-prettier/flat";

// Contracts sit on the app boundary, so typed linting stays strict even for tests.
export default defineConfig(
  globalIgnores(["**/dist/**", "**/coverage/**", "**/*.config.mjs"], "contracts/global-ignores"),

  {
    name: "contracts/linter-options",
    // Inline ESLint comments must change behavior; stale suppressions fail CI.
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    name: "contracts/strict-code-standards",
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        // Required for type-aware schema checks; this package is small enough.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      tsdoc: pluginTsdoc,
    },
    rules: {
      // Checks existing docs only; CLI treats warnings as failures.
      "tsdoc/syntax": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      // Boundary schemas keep strict condition checks; backend test relaxations do not apply.
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
    },
  },

  skipFormatting,
);
