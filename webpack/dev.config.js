const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: [
        "react-hot-loader/patch",
        "webpack-dev-server/client?http://localhost:8080",
        "webpack/hot/only-dev-server",
        "./app/script/index.tsx"
    ],
    devtool: "inline-source-map",
    output: {
        path: path.resolve(__dirname, "../build"),
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            app: path.resolve("./app")
        }
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loaders: ["react-hot-loader/webpack", "awesome-typescript-loader"] },
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
