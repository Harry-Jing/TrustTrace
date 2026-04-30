// @ts-check
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import pluginTsdoc from "eslint-plugin-tsdoc";
import skipFormatting from "eslint-config-prettier/flat";

/**
 * Backend ESLint config — async safety + TSDoc validation.
 *
 * Mirrors the frontend's strict-type-checked bar and adds the four
 * async-safety rules that matter most for a Hono server: a forgotten
 * `await` on a `repository.foo()` call is silent data loss, and the
 * default TypeScript checker does not catch it.
 *
 * Type-checked rules require `parserOptions.projectService` to load
 * the workspace `tsconfig.json` — slower than syntax-only lint but
 * the same engine the frontend uses.
 */
export default tseslint.config(
  globalIgnores(["dist/**", "data/**", "**/*.config.mjs"]),

  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    name: "server/strict-code-standards",
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      tsdoc: pluginTsdoc,
    },
    rules: {
      // TSDoc syntax — same level as frontend (`warn`, soft rollout).
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

      // strict-boolean-expressions over-fires on backend `if (record)`
      // patterns where intent is clear; prefer-nullish-coalescing already
      // catches the dangerous shapes. Keep no-unnecessary-condition as
      // `warn` since false positives happen with type narrowing.
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "warn",
    },
  },

  {
    // Test files routinely use shaped fixtures and intentional
    // unsafe casts to exercise edge cases — relax the matching subset
    // of strict rules so test code stays readable.
    name: "server/test-rule-relaxations",
    files: ["src/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/require-await": "off",
      // Bun's `expect(promise).rejects.toThrow(...)` chain is typed as
      // returning void / non-Thenable — both rules over-fire on the
      // canonical async-rejection assertion pattern.
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      // Tests log numbers, booleans, and shaped objects into matcher
      // messages routinely.
      "@typescript-eslint/restrict-template-expressions": "off",
      // Tests may exercise deprecated APIs to verify back-compat.
      "@typescript-eslint/no-deprecated": "off",
      // Test fixtures sometimes import a type that documents intent
      // even when the test body doesn't reference it.
      "@typescript-eslint/no-unused-vars": "off",
      // Style consistency for `Array<T>` vs `T[]` doesn't matter in tests.
      "@typescript-eslint/array-type": "off",
    },
  },

  skipFormatting,
);
