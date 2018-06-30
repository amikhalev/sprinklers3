import { autorun } from "mobx";
import { serialize } from "serializr";
import * as WebSocket from "ws";

import log from "@common/logger";
import * as requests from "@common/sprinklers/requests";
import * as schema from "@common/sprinklers/schema";
import * as ws from "@common/sprinklers/websocketData";
import { ServerState } from "../state";

export class WebSocketClient {
    api: WebSocketApi;
    socket: WebSocket;

    disposers: Array<() => void> = [];
    deviceSubscriptions: string[] = [];

    /// This shall be the user id if the client has been authenticated, null otherwise
    userId: string | null = null;

    get state() {
        return this.api.state;
    }

    constructor(api: WebSocketApi, socket: WebSocket) {
        this.api = api;
        this.socket = socket;
    }

    start() {
        this.disposers.push(autorun(() => {
            const updateData: ws.IBrokerConnectionUpdate = {
                type: "brokerConnectionUpdate",
                brokerConnected: this.state.mqttClient.connected,
            };
            this.socket.send(JSON.stringify(updateData));
        }));
        this.socket.on("message", this.handleSocketMessage);
        this.socket.on("close", this.stop);
    }

    stop = () => {
        this.disposers.forEach((disposer) => disposer());
        this.api.removeClient(this);
    }

    private handleSocketMessage = (socketData: WebSocket.Data) => {
        this.doHandleSocketMessage(socketData)
            .catch((err) => {
                this.onError({ err }, "unhandled error on handling socket message");
            });
    }

    private async doHandleSocketMessage(socketData: WebSocket.Data) {
        if (typeof socketData !== "string") {
            return this.onError({ type: typeof socketData }, "received invalid socket data type from client");
        }
        let data: ws.IClientMessage;
        try {
            data = JSON.parse(socketData);
        } catch (err) {
            return this.onError({ event, err }, "received invalid websocket message from client");
        }
        switch (data.type) {
            case "deviceSubscribeRequest":
                this.deviceSubscribeRequest(data);
                break;
            case "deviceCallRequest":
                await this.deviceCallRequest(data);
                break;
            default:
                return this.onError({ data }, "received invalid client message type");
        }
    }

    private onError(data: any, message: string) {
        log.error(data, message);
        const errorData: ws.IError = {
            type: "error", message, data,
        };
        this.socket.send(JSON.stringify(errorData));
    }

    private deviceSubscribeRequest(data: ws.IDeviceSubscribeRequest) {
        const deviceId = data.deviceId;
        let result: ws.IDeviceSubscribeResponse["result"];
        if (deviceId !== "grinklers") { // TODO: somehow validate this device id?
            result = "noPermission";
        } else {
            if (this.deviceSubscriptions.indexOf(deviceId) !== -1) {
                return;
            }
            this.deviceSubscriptions.push(deviceId);
            const device = this.state.mqttClient.getDevice(deviceId);
            log.debug({ deviceId, userId: this.userId }, "websocket client subscribed to device");
            this.disposers.push(autorun(() => {
                const json = serialize(schema.sprinklersDevice, device);
                log.trace({ device: json });
                const updateData: ws.IDeviceUpdate = { type: "deviceUpdate", deviceId, data: json };
                this.socket.send(JSON.stringify(updateData));
            }, { delay: 100 }));
            result = "success";
        }
        const response: ws.IDeviceSubscribeResponse = {
            type: "deviceSubscribeResponse", deviceId, result,
        };
        this.socket.send(JSON.stringify(response));
    }

    private async deviceCallRequest(data: ws.IDeviceCallRequest): Promise<void> {
        let response: requests.Response | false;
        try {
            response = await this.doDeviceCallRequest(data);
        } catch (err) {
            response = err;
        }
        if (response) {
            const resData: ws.IDeviceCallResponse = {
                type: "deviceCallResponse",
                id: data.id,
                data: response,
            };
            this.socket.send(JSON.stringify(resData));
        }
    }

    private async doDeviceCallRequest(requestData: ws.IDeviceCallRequest): Promise<requests.Response | false> {
        const { deviceId, data } = requestData;
        if (deviceId !== "grinklers") {
            // error handling? or just get the right device
            return false;
        }
        const request = schema.requests.deserializeRequest(data);
        return this.state.device.makeRequest(request);
    }
}

export class WebSocketApi {
    state: ServerState;
    clients: WebSocketClient[] = [];

    constructor(state: ServerState) {
        this.state = state;
    }

    listen(webSocketServer: WebSocket.Server) {
        webSocketServer.on("connection", this.handleConnection);
    }

    handleConnection = (socket: WebSocket) => {
        const client = new WebSocketClient(this, socket);
        client.start();
        this.clients.push(client);
    }

    removeClient(client: WebSocketClient) {
        const idx = this.clients.indexOf(client);
        if (idx !== -1) {
            this.clients.splice(idx, 1);
        }
    }
}
