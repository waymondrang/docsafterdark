const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const { execSync } = require("child_process");

module.exports = (env, argv) => {
    let commitHash = execSync("git rev-parse HEAD", {
        encoding: "utf8",
    }).trim();

    return {
        mode: "production",
        entry: {
            docs: "./src/docs.ts",
            popup: "./src/popup.ts",
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
        output: {
            filename: "[name].bundle.js",
            path: path.resolve(__dirname, "build"),
        },
        plugins: [
            new webpack.DefinePlugin({
                // See: https://webpack.js.org/configuration/mode/
                __IS_PRODUCTION__: JSON.stringify(argv.mode === "production"),
                __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
                __BUILD_COMMIT__: JSON.stringify(commitHash),
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: "src/popup.html",
                        to: "popup.html",
                    },
                    {
                        from: "src/manifest.json",
                        to: "manifest.json",
                    },
                    {
                        from: "src/assets",
                        to: "assets",
                    },
                ],
            }),
        ],
    };
};
