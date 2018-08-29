import * as WebSocket from "ws";

import { ServerState } from "@server/state";
import { WebSocketConnection } from "./WebSocketConnection";

export class WebSocketApi {
    state: ServerState;
    clients: Set<WebSocketConnection> = new Set();

    constructor(state: ServerState) {
        this.state = state;
    }

    listen(webSocketServer: WebSocket.Server) {
        webSocketServer.on("connection", this.handleConnection);
    }

    handleConnection = (socket: WebSocket) => {
        const client = new WebSocketConnection(this, socket);
        this.clients.add(client);
    }

    removeClient(client: WebSocketConnection) {
        return this.clients.delete(client);
    }
}
