import { Express } from "express";
import * as path from "path";
import * as serveStatic from "serve-static";

import * as paths from "paths";

const index = path.join(paths.publicDir, "index.html");

export default function serveApp(app: Express) {
    app.use(serveStatic(paths.appBuildDir));
    app.get("/*", (req, res) => {
        res.sendFile(index);
    });
}
