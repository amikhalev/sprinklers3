const webpackMerge = require("webpack-merge");
const base = require("./base.config");

module.exports = webpackMerge.smart(base, {
    entry: [
        "./app/script/index.tsx"
    ],
    devtool: "none",
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
        ]
    },
    plugins: [
    ]
});
