module.exports = {
    "root": true,
    "env": {
        "es6": true,
        "node": true
    },
    "extends": [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
        "prettier/@typescript-eslint"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "./tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint/eslint-plugin"
    ],
    "rules": {
        "@typescript-eslint/adjacent-overload-signatures": "warn",
        "@typescript-eslint/array-type": [
            "warn",
            {
                "default": "array-simple"
            }
        ],
        "@typescript-eslint/ban-types": [
            "warn",
            {
                "types": {
                    "Object": {
                        "message": "Avoid using the `Object` type. Did you mean `object`?"
                    },
                    "Function": {
                        "message": "Avoid using the `Function` type. Prefer a specific function type, like `() => void`."
                    },
                    "Boolean": {
                        "message": "Avoid using the `Boolean` type. Did you mean `boolean`?"
                    },
                    "Number": {
                        "message": "Avoid using the `Number` type. Did you mean `number`?"
                    },
                    "String": {
                        "message": "Avoid using the `String` type. Did you mean `string`?"
                    },
                    "Symbol": {
                        "message": "Avoid using the `Symbol` type. Did you mean `symbol`?"
                    }
                }
            }
        ],
        "@typescript-eslint/consistent-type-assertions": "warn",
        "@typescript-eslint/consistent-type-definitions": "warn",
        "@typescript-eslint/dot-notation": "warn",
        "@typescript-eslint/explicit-member-accessibility": [
            "warn",
            {
                "accessibility": "explicit"
            }
        ],
        "@typescript-eslint/member-delimiter-style": [
            "warn",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/member-ordering": [
          "warn",
          {
            "default": {
              "memberTypes": [
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
                "private-abstract-field",

                "public-static-method",

                "public-constructor",
                "protected-constructor",
                "private-constructor",

                "public-method",
                "protected-method",
                "private-method"
              ]
            }
          }
        ],
        "@typescript-eslint/naming-convention": [
          "error",
          {
            "selector": "typeLike",
            "format": ["PascalCase"]
          },
          {
            "selector": "interface",
            "format": ["PascalCase"],
            "prefix": ["I"]
          }
        ],
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-empty-interface": "warn",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-misused-new": "warn",
        "@typescript-eslint/no-namespace": "warn",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-unused-expressions": "warn",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "warn",
        "@typescript-eslint/prefer-for-of": "warn",
        "@typescript-eslint/prefer-function-type": "warn",
        "@typescript-eslint/prefer-namespace-keyword": "warn",
        "@typescript-eslint/semi": [
            "warn",
            "always"
        ],
        "@typescript-eslint/triple-slash-reference": [
            "warn",
            {
                "path": "always",
                "types": "prefer-import",
                "lib": "always"
            }
        ],
        "@typescript-eslint/type-annotation-spacing": "warn",
        "@typescript-eslint/unbound-method": "warn",
        "@typescript-eslint/unified-signatures": "warn",
        "array-bracket-spacing": [
          "error",
          "always",
          {
            "singleValue": false,
            "objectsInArrays": false,
            "arraysInArrays": false
          }
        ],
        "arrow-body-style": "warn",
        "arrow-parens": [
            "warn",
            "as-needed"
        ],
        "arrow-spacing": "error",
        "brace-style": [
            "error",
            "1tbs"
        ],
        "camelcase": "warn",
        "comma-dangle": [
            "warn",
            "always-multiline"
        ],
        "comma-spacing": "error",
        "complexity": "off",
        "computed-property-spacing": "error",
        "constructor-super": "warn",
        "curly": "error",
        "eol-last": "warn",
        "eqeqeq": [
            "warn",
            "smart"
        ],
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
            "undefined"
        ],
        "id-match": "warn",
        "indent": [
            "warn",
            2,
            {
                "FunctionDeclaration": {
                    "body": 1,
                    "parameters": 2
                },
                "FunctionExpression": {
                    "body": 1,
                    "parameters": 2
                }
            }
        ],
        "key-spacing": "error",
        "keyword-spacing": "error",
        "max-classes-per-file": [
            "warn",
            1
        ],
        "max-len": [
            "warn",
            {
                "code": 120
            }
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
        "no-shadow": [
            "warn",
            {
                "hoist": "all"
            }
        ],
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
            "objectsInObjects": false
          }
        ],
        "one-var": [
            "warn",
            "never"
        ],
        "prefer-arrow-callback": "warn",
        "prefer-const": "warn",
        "quotes": [
            "error",
            "double",
            {
                "avoidEscape": true
            }
        ],
        "quote-props": [
            "warn",
            "consistent-as-needed"
        ],
        "radix": "warn",
        "semi-spacing": "error",
        "sort-imports": [
          "error",
          {
            "ignoreCase": true,
          }
        ],
        "sort-keys": [
          "warn",
          "asc",
          {
            "caseSensitive": true,
            "natural": true
          }
        ],
        "space-before-blocks": "error",
        "space-before-function-paren": [
            "warn",
            {
                "anonymous": "never",
                "asyncArrow": "always",
                "named": "never"
            }
        ],
        "space-infix-ops": "error",
        "space-in-parens": [
          "error",
          "never"
        ],
        "space-unary-ops": "error",
        "spaced-comment": [
            "warn",
            "always",
            {
                "markers": [
                    "/"
                ]
            }
        ],
        "switch-colon-spacing": "error",
        "use-isnan": "warn",
        "valid-typeof": "off"
    }
};
