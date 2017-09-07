import * as webpack from "webpack";
import * as webpackMiddleware from "webpack-dev-middleware";

/* tslint:disable-next-line:no-var-requires */
const webpackConfig = require("../../app/webpack/config.js");

export default function serveApp() {
    return webpackMiddleware(
        webpack(webpackConfig),
    );
}
