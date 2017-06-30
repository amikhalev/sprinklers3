const webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const base = require("./base.config");

module.exports = webpackMerge.smart(base, {
    entry: [
        "react-hot-loader/patch",
        "webpack-dev-server/client?http://localhost:8080",
        "webpack/hot/only-dev-server",
        "core-js",
        "./app/script/index.tsx"
    ],
    devtool: "inline-source-map",
    plugins: [
        new webpack.NamedModulesPlugin(),
        // new webpack.HotModuleReplacementPlugin(),
    ],
    devServer: {
        hot: true
    }
});
