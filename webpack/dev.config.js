const webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const base = require("./base.config");

module.exports = webpackMerge.strategy({
    entry: "prepend",
})(base, {
    devtool: "eval-source-map",
    entry: [
        "react-hot-loader/patch",
        "webpack-dev-server/client?http://localhost:8080",
        "webpack/hot/only-dev-server",
    ],
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
    ],
    devServer: {
        hot: true
    }
});
