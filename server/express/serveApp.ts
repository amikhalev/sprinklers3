import { Express } from "express";
import * as path from "path";
import * as serveStatic from "serve-static";

// tslint:disable-next-line:no-var-requires
const paths = require("paths");

const staticDir = path.resolve(paths.publicDir, "static");
const index = path.join(paths.publicDir, "index.html");

export default function serveApp(app: Express) {
  app.use("/static", serveStatic(staticDir, { fallthrough: false }));
  app.get("/*", (req, res) => {
    res.sendFile(index);
  });
}
