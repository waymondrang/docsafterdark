const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const fs = require("fs");

module.exports = (env, argv) => {
    const packageJSON = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const isProduction = JSON.stringify(argv.mode === "production");

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
                __IS_PRODUCTION__: isProduction,

                // Note: When passing string values, they should be wrapped in
                //       quotes. i.e. 0.0.0 vs "0.0.0"
                __VERSION__: JSON.stringify(packageJSON.version),
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
                        transform(content, path) {
                            const manifest = JSON.parse(content.toString());
                            manifest.version = packageJSON.version;
                            return JSON.stringify(manifest, null, 2);
                        },
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
