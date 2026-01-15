const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
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
            ],
        }),
    ],
};
