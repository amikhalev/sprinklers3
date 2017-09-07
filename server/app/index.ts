import * as express from "express";

import serveApp from "./serveApp";

const app = express();

app.use(serveApp());

export default app;
