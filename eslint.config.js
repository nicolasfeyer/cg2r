import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";
import i18next from "eslint-plugin-i18next";

export default tseslint.config(
    { ignores: ["dist"] },
    {
        files: ["**/*.{ts,tsx}"],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            "react": react,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            "i18next": i18next,
        },
        settings: {
            react: {
                version: "detect", // automatically detects the installed React version
            },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs["jsx-runtime"].rules, // disables rules not needed with the new JSX transform
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            "i18next/no-literal-string": [
                "warn",
                {
                    markupOnly: false,
                    ignoreAttribute: [
                        "className",
                        "style",
                        "type",
                        "id",
                        "name",
                        "htmlFor",
                        "key",
                        "role",
                        "data-testid",
                        "href",
                        "target",
                        "rel",
                        "src",
                        "alt",
                        "placeholder",
                        "defaultValue",
                        "value",
                    ],
                },
            ],
        },
    }
);
