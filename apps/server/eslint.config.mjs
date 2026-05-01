// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginTsdoc from "eslint-plugin-tsdoc";
import skipFormatting from "eslint-config-prettier/flat";

// Backend keeps typed linting for async-safety rules that TypeScript alone misses.
export default defineConfig(
  globalIgnores(
    ["**/dist/**", "**/coverage/**", "data/**", "**/*.config.mjs"],
    "server/global-ignores",
  ),

  {
    name: "server/linter-options",
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
    name: "server/strict-code-standards",
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        // Required for async-safety rules; slower than syntax-only lint by design.
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

      // Async safety — forgotten `await` on a repository call silently
      // loses data; misusing a Promise as a boolean always evaluates true.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/require-await": "warn",

      // Type-import discipline (matches frontend).
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // Backend `if (record)` guards are common; still surface redundant conditions.
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "warn",
    },
  },

  {
    name: "server/test-rule-relaxations",
    files: ["src/__tests__/**/*.ts"],
    rules: {
      // Tests use fixtures and casts for edge cases; relax only test ergonomics.
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/require-await": "off",
      // Bun async-rejection matcher chains look void/non-Thenable to TS rules.
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      // Matcher messages routinely stringify fixtures.
      "@typescript-eslint/restrict-template-expressions": "off",
      // Back-compat tests may exercise deprecated APIs.
      "@typescript-eslint/no-deprecated": "off",
      // Fixture-only type imports can document intent.
      "@typescript-eslint/no-unused-vars": "off",
      // `Array<T>` vs `T[]` consistency is noise in fixtures.
      "@typescript-eslint/array-type": "off",
    },
  },

  skipFormatting,
);
