import { Express } from "express";
import * as serveStatic from "serve-static";

import * as paths from "paths";

export default function serveApp(app: Express) {
    app.use(serveStatic(paths.appBuildDir));
}
