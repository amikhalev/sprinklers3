import { Express } from "express";
import * as webpack from "webpack";
import * as webpackMiddleware from "webpack-dev-middleware";
import * as webpackHotMiddleware from "webpack-hot-middleware";

/* tslint:disable-next-line:no-var-requires */
const webpackConfig = require("../../app/webpack/config.js");

type Logger = (message?: any, ...optionalParams: any[]) => void;

function makeLogFunction(fn: Logger = console.log): Logger {
    return (m, ...args) => fn("[webpack] " + m, ...args);
}

export default function serveApp(app: Express) {
    const compiler = webpack(webpackConfig);
    app.use(webpackMiddleware(compiler,
        {
            noInfo: true,
            publicPath: webpackConfig.output.publicPath,
            log: makeLogFunction(),
            warn: makeLogFunction(console.warn),
            error: makeLogFunction(console.error),
        },
    ));
    app.use(webpackHotMiddleware(compiler,
        {
            log: makeLogFunction(),
        }));
}
