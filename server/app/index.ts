import * as express from "express";

import serveApp from "./serveApp";

const app = express();

serveApp(app);

export default app;
