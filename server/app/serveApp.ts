import { Express } from "express";
import * as serveStatic from "serve-static";

import * as paths from "paths";

export default function serveApp(app: Express) {
    app.use(serveStatic(paths.appBuildDir));
    app.get("/*", (req, res) => {
        res.sendFile(path.join(paths.publicDir, "index.html"));
    });
}
