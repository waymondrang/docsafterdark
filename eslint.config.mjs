import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        ignores: ["webpack.config.cjs"],
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            // Note: you must disable the base rule as it can report incorrect errors
            "no-unused-private-class-members": "off",
            "@typescript-eslint/no-unused-private-class-members": "error",
        },
    },
]);
