import * as bodyParser from "body-parser";
import * as express from "express";

import { ServerState } from "@server/state";
import createApi from "./api";
import errorHandler from "./errorHandler";
import requestLogger from "./requestLogger";
import serveApp from "./serveApp";

export function createApp(state: ServerState) {
  const app = express();

  app.use(requestLogger);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use("/api", createApi(state));

  serveApp(app);

  app.use(errorHandler);

  return app;
}
