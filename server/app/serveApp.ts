import { Express } from "express";
import * as webpack from "webpack";
import * as webpackMiddleware from "webpack-dev-middleware";
import * as webpackHotMiddleware from "webpack-hot-middleware";

import logger from "../log";
const log = logger.child({ source: "webpack" });

/* tslint:disable-next-line:no-var-requires */
const webpackConfig = require("../../app/webpack/config.js");

export default function serveApp(app: Express) {
    const compiler = webpack(webpackConfig);
    app.use(webpackMiddleware(compiler,
        {
            noInfo: true,
            publicPath: webpackConfig.output.publicPath,
            log: log.info.bind(log),
            warn: log.warn.bind(log),
            error: log.error.bind(log),
        },
    ));
    app.use(webpackHotMiddleware(compiler,
        {
            log: log.info.bind(log),
        }));
}
