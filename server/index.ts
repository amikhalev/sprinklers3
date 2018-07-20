/* tslint:disable:ordered-imports */
import "reflect-metadata";
import "./configureAlias";
import "env";
import "./configureLogger";

import log from "@common/logger";
import {Server} from "http";
import * as WebSocket from "ws";

import { ServerState } from "./state";
import { createApp } from "./express";
import { WebSocketApi } from "./sprinklersRpc/websocketServer";

const state = new ServerState();
const app = createApp(state);
const webSocketApi = new WebSocketApi(state);

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

const server = new Server(app);
const webSocketServer = new WebSocket.Server({server});
webSocketApi.listen(webSocketServer);

state.start()
    .then(() => {
        server.listen(port, host, () => {
            log.info(`listening at ${host}:${port}`);
        });
    })
    .catch((err) => {
        log.error({ err }, "error starting server");
    });
