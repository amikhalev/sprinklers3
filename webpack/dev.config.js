const webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const base = require("./base.config");

module.exports = webpackMerge.smart(base, {
    entry: [
        "react-hot-loader/patch",
        "webpack-dev-server/client?http://localhost:8080",
        "webpack/hot/only-dev-server",
        "./app/script/index.tsx"
    ],
    devtool: "inline-source-map",
    module: {
        rules: [
            { test: /\.tsx?$/, loaders: ["react-hot-loader/webpack", "awesome-typescript-loader"] },
        ]
    },
    plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    devServer: {
        hot: true
    }
});
