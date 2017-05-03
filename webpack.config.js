const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: [
        "react-hot-loader/patch",
        "./app/script/index.tsx"
    ],
    devtool: "sourcemap",
    output: {
        path: path.resolve(__dirname, "dist"),
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
            title: "sprinklers3"
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },
    devServer: {
        hot: true,
        contentBase: "./dist"
    }
};