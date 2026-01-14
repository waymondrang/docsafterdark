import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        ignores: ["webpack.config.js", "src/popup.js", "src/word.js"],
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
]);
