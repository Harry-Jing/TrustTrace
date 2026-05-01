// @ts-check
import { globalIgnores } from "eslint/config";
import js from "@eslint/js";
import {
  configureVueProject,
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import pluginVitest from "@vitest/eslint-plugin";
import pluginOxlint from "eslint-plugin-oxlint";
import pluginTsdoc from "eslint-plugin-tsdoc";
import skipFormatting from "eslint-config-prettier/flat";

// Anchor Vue's project helper to this workspace inside the monorepo.
configureVueProject({
  rootDir: import.meta.dirname,
});

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{vue,ts,mts,tsx}"],
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"], "app/global-ignores"),

  {
    name: "app/linter-options",
    // Inline ESLint comments must change behavior; stale suppressions fail CI.
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },

  js.configs.recommended,

  ...pluginVue.configs["flat/recommended-error"],
  vueTsConfigs.strictTypeChecked,

  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/*.{test,spec}.{ts,tsx}"],
  },

  {
    name: "app/strict-code-standards",
    files: ["src/**/*.{vue,ts,mts,tsx}"],
    rules: {
      "no-useless-assignment": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "property",
          format: null,
        },
        {
          selector: "objectLiteralProperty",
          format: null,
        },
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
      "vue/component-api-style": ["error", ["script-setup"]],
      "vue/define-emits-declaration": ["error", "type-based"],
      "vue/define-props-declaration": ["error", "type-based"],
      "vue/html-button-has-type": "error",
      "vue/no-static-inline-styles": "error",
      "vue/no-undef-components": ["error", { ignorePatterns: ["RouterView", "RouterLink"] }],
      "vue/require-typed-ref": "error",
    },
  },

  {
    name: "app/test-rule-relaxations",
    files: ["src/**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "vue/one-component-per-file": "off",
    },
  },

  {
    name: "app/tsdoc",
    files: ["src/**/*.{vue,ts,mts,tsx}"],
    plugins: {
      tsdoc: pluginTsdoc,
    },
    rules: {
      // Checks existing /** ... */ docs only; it does not require comments.
      // `warn` stays editor-friendly, while CLI fails via --max-warnings=0.
      "tsdoc/syntax": "warn",
    },
  },

  // Disable ESLint rules that Oxlint already runs so both passes can coexist.
  ...pluginOxlint.buildFromOxlintConfigFile(".oxlintrc.json"),

  skipFormatting,
);
