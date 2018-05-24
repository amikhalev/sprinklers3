/* tslint:disable:ordered-imports */
import "./configureAlias";
import "env";
import "./configureLogger";

import log from "@common/logger";
import {Server} from "http";
import * as WebSocket from "ws";

import app from "./app";
import {state} from "./state";
import {handler as webSocketHandler} from "./websocket";

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

const server = new Server(app);
const webSocketServer = new WebSocket.Server({server});

webSocketServer.on("connection", webSocketHandler);

state.start();
server.listen(port, host, () => {
    log.info(`listening at ${host}:${port}`);
});
