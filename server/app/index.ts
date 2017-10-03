import * as express from "express";

import logger from "./logger";
import serveApp from "./serveApp";

const app = express();

app.use(logger);
serveApp(app);

export default app;
