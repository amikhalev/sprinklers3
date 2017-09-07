const webpackMerge = require("webpack-merge");
const base = require("./base.config");

module.exports = webpackMerge.strategy({})(base, {
    devtool: "none",
    plugins: []
});
