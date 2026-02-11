const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const { execSync } = require("child_process");
const fs = require("fs");

let commitHash = execSync("git rev-parse HEAD", {
    encoding: "utf8",
}).trim();

const packageJSON = JSON.parse(fs.readFileSync("package.json", "utf8"));

const config = {
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

module.exports = (env, argv) => {
    if (argv.mode === "development") {
        config.devtool = "source-map";
    }

    config.plugins.push(
        new webpack.DefinePlugin({
            // See: https://webpack.js.org/configuration/mode/
            __IS_PRODUCTION__: JSON.stringify(argv.mode === "production"),
            __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
            __BUILD_COMMIT__: JSON.stringify(commitHash),
        })
    );

    return config;
};
