import { autorun } from "mobx";
import { serialize } from "serializr";
import * as WebSocket from "ws";

import * as rpc from "@common/jsonRpc";
import log from "@common/logger";
import * as deviceRequests from "@common/sprinklers/deviceRequests";
import { ErrorCode } from "@common/sprinklers/ErrorCode";
import * as schema from "@common/sprinklers/schema";
import * as ws from "@common/sprinklers/websocketData";
import { TokenClaims, verifyToken } from "../express/authentication";
import { ServerState } from "../state";

// tslint:disable:member-ordering

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
                brokerConnected: this.state.mqttClient.connected,
            };
            this.sendNotification("brokerConnectionUpdate", updateData);
        }));
        this.socket.on("message", this.handleSocketMessage);
        this.socket.on("close", this.stop);
    }

    stop = () => {
        this.disposers.forEach((disposer) => disposer());
        this.api.removeClient(this);
    }

    private requestHandlers: ws.ClientRequestHandlers = {
        authenticate: async (data: ws.IAuthenticateRequest) => {
            if (!data.accessToken) {
                return {
                    result: "error", error: {
                        code: ErrorCode.BadRequest, message: "no token specified",
                    },
                };
            }
            let decoded: TokenClaims;
            try {
                decoded = await verifyToken(data.accessToken);
            } catch (e) {
                return {
                    result: "error",
                    error: { code: ErrorCode.BadToken, message: "invalid token", data: e },
                };
            }
            this.userId = decoded.aud;
            return {
                result: "success",
                data: { authenticated: true, message: "authenticated" },
            };
        },
        deviceSubscribe: async (data: ws.IDeviceSubscribeRequest) => {
            const deviceId = data.deviceId;
            if (deviceId !== "grinklers") { // TODO: somehow validate this device id?
                return {
                    result: "error", error: {
                        code: ErrorCode.NoPermission,
                        message: "you do not have permission to subscribe to this device",
                    },
                };
            }
            if (this.deviceSubscriptions.indexOf(deviceId) === -1) {
                this.deviceSubscriptions.push(deviceId);
                const device = this.state.mqttClient.getDevice(deviceId);
                log.debug({ deviceId, userId: this.userId }, "websocket client subscribed to device");
                this.disposers.push(autorun(() => {
                    const json = serialize(schema.sprinklersDevice, device);
                    log.trace({ device: json });
                    const updateData: ws.IDeviceUpdate = { deviceId, data: json };
                    this.sendNotification("deviceUpdate", updateData);
                }, { delay: 100 }));
            }

            const response: ws.IDeviceSubscribeResponse = {
                deviceId,
            };
            return { result: "success", data: response };
        },
        deviceCall: async (data: ws.IDeviceCallRequest) => {
            try {
                const response = await this.doDeviceCallRequest(data);
                const resData: ws.IDeviceCallResponse = {
                    data: response,
                };
                return { result: "success", data: resData };
            } catch (err) {
                const e: deviceRequests.ErrorResponseData = err;
                return {
                    result: "error", error: {
                        code: e.code,
                        message: e.message,
                        data: e,
                    },
                };
            }
        },
    };

    private sendMessage(data: ws.ServerMessage) {
        this.socket.send(JSON.stringify(data));
    }

    private sendNotification<Method extends ws.ServerNotificationMethod>(
        method: Method,
        data: ws.IServerNotificationTypes[Method]) {
        this.sendMessage({ type: "notification", method, data });
    }

    private sendResponse<Method extends ws.ClientRequestMethods>(
        method: Method,
        id: number,
        data: ws.ServerResponseData<Method>) {
        this.sendMessage({ type: "response", method, id, ...data });
    }

    private handleSocketMessage = (socketData: WebSocket.Data) => {
        this.doHandleSocketMessage(socketData)
            .catch((err) => {
                this.onError({ err }, "unhandled error on handling socket message");
            });
    }

    private async doHandleSocketMessage(socketData: WebSocket.Data) {
        if (typeof socketData !== "string") {
            return this.onError({ type: typeof socketData },
                "received invalid socket data type from client", ErrorCode.Parse);
        }
        let data: ws.ClientMessage;
        try {
            data = JSON.parse(socketData);
        } catch (err) {
            return this.onError({ socketData, err }, "received invalid websocket message from client",
                ErrorCode.Parse);
        }
        log.debug({ data }, "client message");
        switch (data.type) {
            case "request":
                await this.handleRequest(data);
                break;
            default:
                return this.onError({ data }, "received invalid message type from client",
                    ErrorCode.BadRequest);
        }
    }

    private async handleRequest(request: ws.ClientRequest) {
        let response: ws.ServerResponseData;
        if (!this.requestHandlers[request.method]) {
            log.warn({ method: request.method }, "received invalid client request method");
            response = {
                result: "error", error: {
                    code: ErrorCode.BadRequest, message: "received invalid client request method",
                },
            };
        } else {
            try {
                response = await rpc.handleRequest(this.requestHandlers, request);
            } catch (err) {
                log.error({ method: request.method, err }, "error during processing of client request");
                response = {
                    result: "error", error: {
                        code: ErrorCode.Internal, message: "error during processing of client request",
                        data: err.toString(),
                    },
                };
            }
        }
        this.sendResponse(request.method, request.id, response);
    }

    private onError(data: any, message: string, code: number = ErrorCode.Internal) {
        log.error(data, message);
        const errorData: ws.Error = { code, message, data };
        this.sendNotification("error", errorData);
    }

    private async doDeviceCallRequest(requestData: ws.IDeviceCallRequest): Promise<deviceRequests.Response> {
        const { deviceId, data } = requestData;
        const device = this.state.mqttClient.getDevice(deviceId);
        // TODO: authorize the requests
        const request = schema.requests.deserializeRequest(data);
        return device.makeRequest(request);
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
