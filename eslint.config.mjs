import typescriptEslintEslintPlugin from "@typescript-eslint/eslint-plugin";
import stylisticPlugin from "@stylistic/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    files: ["**/*.ts"],
  },
  ...compat.extends(
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ),
  stylisticPlugin.configs["disable-legacy"],
  {
    plugins: {
      "@typescript-eslint": typescriptEslintEslintPlugin,
      stylistic: stylisticPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "module",

      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    rules: {
      "@typescript-eslint/adjacent-overload-signatures": "warn",

      "@typescript-eslint/array-type": [
        "warn",
        {
          default: "array-simple",
        },
      ],

      "@typescript-eslint/no-wrapper-object-types": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/consistent-type-assertions": "warn",
      "@typescript-eslint/consistent-type-definitions": "warn",
      "@typescript-eslint/dot-notation": "warn",

      "@typescript-eslint/explicit-member-accessibility": [
        "warn",
        {
          accessibility: "explicit",
        },
      ],

      "stylistic/member-delimiter-style": [
        "warn",
        {
          multiline: {
            delimiter: "semi",
            requireLast: true,
          },

          singleline: {
            delimiter: "semi",
            requireLast: false,
          },
        },
      ],

      "@typescript-eslint/member-ordering": [
        "warn",
        {
          default: {
            memberTypes: [
              "signature",
              "public-static-field",
              "public-decorated-field",
              "public-instance-field",
              "public-abstract-field",
              "protected-static-field",
              "private-static-field",
              "protected-decorated-field",
              "private-decorated-field",
              "protected-instance-field",
              "private-instance-field",
              "protected-abstract-field",
              "public-static-method",
              "public-constructor",
              "protected-constructor",
              "private-constructor",
              "public-method",
              "protected-method",
              "private-method",
            ],
          },
        },
      ],

      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "interface",
          format: ["PascalCase"],
          prefix: ["I"],
        },
      ],

      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-misused-new": "warn",
      "@typescript-eslint/no-namespace": "warn",
      "@typescript-eslint/no-parameter-properties": "off",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/prefer-function-type": "warn",
      "@typescript-eslint/prefer-namespace-keyword": "warn",
      "@/semi": ["warn", "always"],

      "@typescript-eslint/triple-slash-reference": [
        "warn",
        {
          path: "always",
          types: "prefer-import",
          lib: "always",
        },
      ],

      "stylistic/type-annotation-spacing": "warn",
      "@typescript-eslint/unbound-method": "warn",
      "@typescript-eslint/unified-signatures": "warn",

      "array-bracket-spacing": [
        "error",
        "always",
        {
          singleValue: false,
          objectsInArrays: false,
          arraysInArrays: false,
        },
      ],

      "arrow-body-style": "warn",
      "arrow-parens": ["warn", "as-needed"],
      "arrow-spacing": "error",
      "brace-style": ["error", "1tbs"],
      camelcase: "warn",
      "comma-dangle": ["warn", "always-multiline"],
      "comma-spacing": "error",
      complexity: "off",
      "computed-property-spacing": "error",
      "constructor-super": "warn",
      curly: "error",
      "eol-last": "warn",
      eqeqeq: ["warn", "smart"],
      "func-call-spacing": "error",
      "guard-for-in": "warn",

      "id-blacklist": [
        "warn",
        "any",
        "Number",
        "number",
        "String",
        "string",
        "Boolean",
        "boolean",
        "Undefined",
        "undefined",
      ],

      "id-match": "warn",

      indent: [
        "warn",
        2,
        {
          FunctionDeclaration: {
            body: 1,
            parameters: 2,
          },

          FunctionExpression: {
            body: 1,
            parameters: 2,
          },
        },
      ],

      "key-spacing": "error",
      "keyword-spacing": "error",
      "max-classes-per-file": ["warn", 1],

      "max-len": [
        "warn",
        {
          code: 120,
        },
      ],

      "new-parens": "warn",
      "no-bitwise": "off",
      "no-caller": "warn",
      "no-cond-assign": "warn",
      "no-console": "warn",
      "no-debugger": "warn",
      "no-empty": "warn",
      "no-eval": "warn",
      "no-fallthrough": "off",
      "no-invalid-this": "off",
      "no-multiple-empty-lines": "warn",
      "no-multi-spaces": "error",
      "no-new-wrappers": "warn",
      "no-shadow": "off",
      "no-throw-literal": "warn",
      "no-trailing-spaces": "error",
      "no-undef-init": "warn",
      "no-underscore-dangle": "warn",
      "no-unsafe-finally": "warn",
      "no-unused-labels": "warn",
      "no-var": "warn",
      "object-shorthand": "warn",

      "object-curly-spacing": [
        "warn",
        "always",
        {
          objectsInObjects: false,
        },
      ],

      "one-var": ["warn", "never"],
      "prefer-arrow-callback": "warn",
      "prefer-const": "warn",

      quotes: [
        "error",
        "double",
        {
          avoidEscape: true,
        },
      ],

      "quote-props": ["warn", "consistent-as-needed"],
      radix: "warn",
      "semi-spacing": "error",

      "sort-imports": [
        "error",
        {
          ignoreCase: true,
        },
      ],

      "sort-keys": [
        "warn",
        "asc",
        {
          caseSensitive: true,
          natural: true,
        },
      ],

      "space-before-blocks": "error",

      "space-before-function-paren": [
        "warn",
        {
          anonymous: "never",
          asyncArrow: "always",
          named: "never",
        },
      ],

      "space-infix-ops": "error",
      "space-in-parens": ["error", "never"],
      "space-unary-ops": "error",

      "spaced-comment": [
        "warn",
        "always",
        {
          markers: ["/"],
        },
      ],

      "switch-colon-spacing": "error",
      "use-isnan": "warn",
      "valid-typeof": "off",
    },
  },
  {
    files: ["**/test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];
