const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    devtool: "inline-source-map",
    output: {
        path: path.resolve(__dirname, "..", "build"),
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            app: path.resolve(__dirname, "..", "app")
        }
    },
    module: {
        rules: [
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.(ttf|eot|svg|woff(2)?|png|jpg)(\?[a-z0-9=&.]+)?$/, loader: "file-loader" }
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
