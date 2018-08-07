import { Express } from "express";
import * as path from "path";
import * as serveStatic from "serve-static";

import * as paths from "@common/paths";

const index = path.join(paths.publicDir, "index.html");

export default function serveApp(app: Express) {
    app.use(serveStatic(paths.clientBuildDir));
    app.get("/*", (req, res) => {
        res.sendFile(index);
    });
}
