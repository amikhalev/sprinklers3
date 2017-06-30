const webpackMerge = require("webpack-merge");
const base = require("./base.config");

module.exports = webpackMerge.smart(base, {
    entry: [
        "core-js",
        "./app/script/index.tsx"
    ],
    devtool: "none",
    plugins: [
    ]
});
