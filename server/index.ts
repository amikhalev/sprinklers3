/* tslint:disable:ordered-imports */
import "./configureAlias";
import "env";
import "./configureLogger";

import log from "@common/logger";
import {Server} from "http";
import * as WebSocket from "ws";

import { ServerState } from "./state";
import { createApp } from "./app";
import { WebSocketApi } from "./websocket";

const state = new ServerState();
const app = createApp(state);
const webSocketApi = new WebSocketApi(state);

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

const server = new Server(app);
const webSocketServer = new WebSocket.Server({server});
webSocketServer.on("connection", webSocketApi.handleConnection);

state.start();
server.listen(port, host, () => {
    log.info(`listening at ${host}:${port}`);
});
