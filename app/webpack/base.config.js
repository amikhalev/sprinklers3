const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const rootDir = path.resolve(__dirname, "..", "..");

module.exports = {
    entry: [
        "core-js",
        "./app/index.tsx"
    ],
    output: {
        path: path.resolve(rootDir, "public"),
        filename: "bundle.js",
        publicPath: "/",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
        alias: {
            "@app": path.resolve(rootDir, "app"),
            "@common": path.resolve(rootDir, "common"),
        }
    },
    module: {
        rules: [
            { test: /\.css$/, use: ["style-loader", "css-loader"] },
            { test: /\.(ttf|eot|svg|woff(2)?|png|jpg)(\?[a-z0-9=&.]+)?$/, use: "file-loader" },
            {
                test: /\.tsx?$/, use: {
                    loader: "awesome-typescript-loader",
                    options: { configFileName: path.resolve(rootDir, "app", "tsconfig.json") }
                },
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./app/index.html"
        }),
    ],
};
