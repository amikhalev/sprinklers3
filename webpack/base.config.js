const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    devtool: "eval-source-map",
    output: {
        path: path.resolve(__dirname, "..", "build"),
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            app: path.resolve(__dirname, "..", "app"),
            common: path.resolve(__dirname, "..", "common"),
        }
    },
    module: {
        rules: [
            { test: /\.css$/, use: "style-loader!css-loader" },
            { test: /\.(ttf|eot|svg|woff(2)?|png|jpg)(\?[a-z0-9=&.]+)?$/, use: "file-loader" },
            {
                test: /\.tsx?$/, use: {
                    loader: "awesome-typescript-loader",
                    options: { configFileName: path.resolve(__dirname, "..", "app", "tsconfig.json") }
                },
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./app/index.html"
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    devServer: {
        hot: true
    }
};
