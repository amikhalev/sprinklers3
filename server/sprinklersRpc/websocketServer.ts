import { autorun } from "mobx";
import { serialize } from "serializr";
import * as WebSocket from "ws";

import { ErrorCode } from "@common/ErrorCode";
import * as rpc from "@common/jsonRpc";
import log from "@common/logger";
import * as deviceRequests from "@common/sprinklersRpc/deviceRequests";
import * as schema from "@common/sprinklersRpc/schema";
import * as ws from "@common/sprinklersRpc/websocketData";
import { User } from "@server/entities";
import { TokenClaims, verifyToken } from "@server/express/authentication";
import { ServerState } from "@server/state";

// tslint:disable:member-ordering

export class WebSocketClient {
    api: WebSocketApi;
    socket: WebSocket;

    disposers: Array<() => void> = [];
    deviceSubscriptions: string[] = [];

    /// This shall be the user id if the client has been authenticated, null otherwise
    userId: number | null = null;
    user: User | null = null;

    get state() {
        return this.api.state;
    }

    constructor(api: WebSocketApi, socket: WebSocket) {
        this.api = api;
        this.socket = socket;
    }

    start() {
        this.socket.on("message", this.handleSocketMessage);
        this.socket.on("close", this.stop);
    }

    stop = () => {
        this.disposers.forEach((disposer) => disposer());
        this.api.removeClient(this);
    }

    private subscribeBrokerConnection() {
        this.disposers.push(autorun(() => {
            const updateData: ws.IBrokerConnectionUpdate = {
                brokerConnected: this.state.mqttClient.connected,
            };
            this.sendNotification("brokerConnectionUpdate", updateData);
        }));
    }

    private checkAuthorization() {
        if (!this.userId || !this.user) {
            throw new ws.RpcError("this WebSocket session has not been authenticated",
                ErrorCode.Unauthorized);
        }
    }

    private checkDevice(devId: string) {
        const userDevice = this.user!.devices!.find((dev) => dev.deviceId === devId);
        if (userDevice == null) {
            throw new ws.RpcError("you do not have permission to subscribe to this device",
                ErrorCode.NoPermission);
        }
        const deviceId = userDevice.deviceId;
        if (!deviceId) {
            throw new ws.RpcError("device has no associated device prefix", ErrorCode.BadRequest);
        }
        return userDevice;
    }

    private requestHandlers: ws.ClientRequestHandlers = {
        authenticate: async (data: ws.IAuthenticateRequest) => {
            if (!data.accessToken) {
                throw new ws.RpcError("no token specified", ErrorCode.BadRequest);
            }
            let decoded: TokenClaims;
            try {
                decoded = await verifyToken(data.accessToken);
            } catch (e) {
                throw new ws.RpcError("invalid token", ErrorCode.BadToken, e);
            }
            if (decoded.type !== "access") {
                throw new ws.RpcError("not an access token", ErrorCode.BadToken);
            }
            this.userId = decoded.aud;
            this.user = await this.state.database.users.
                findById(this.userId, { devices: true }) || null;
            log.info({ userId: decoded.aud, name: decoded.name }, "authenticated websocket client");
            this.subscribeBrokerConnection();
            return {
                result: "success",
                data: { authenticated: true, message: "authenticated", user: this.user!.toJSON() },
            };
        },
        deviceSubscribe: async (data: ws.IDeviceSubscribeRequest) => {
            this.checkAuthorization();
            const userDevice = this.checkDevice(data.deviceId);
            const deviceId = userDevice.deviceId!;
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
            this.checkAuthorization();
            try {
                const response = await this.doDeviceCallRequest(data);
                const resData: ws.IDeviceCallResponse = {
                    data: response,
                };
                return { result: "success", data: resData };
            } catch (err) {
                const e: deviceRequests.ErrorResponseData = err;
                throw new ws.RpcError(e.message, e.code, e);
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
        try {
            if (!this.requestHandlers[request.method]) {
                // noinspection ExceptionCaughtLocallyJS
                throw new ws.RpcError("received invalid client request method");
            }
            response = await rpc.handleRequest(this.requestHandlers, request);
        } catch (err) {
            if (err instanceof ws.RpcError) {
                log.debug({ err }, "rpc error");
                response = { result: "error", error: err.toJSON() };
            } else {
                log.error({ method: request.method, err }, "unhandled error during processing of client request");
                response = {
                    result: "error", error: {
                        code: ErrorCode.Internal, message: "unhandled error during processing of client request",
                        data: err.toString(),
                    },
                };
            }
        }
        this.sendResponse(request.method, request.id, response);
    }

    private onError(data: any, message: string, code: number = ErrorCode.Internal) {
        log.error(data, message);
        const errorData: ws.IError = { code, message, data };
        this.sendNotification("error", errorData);
    }

    private async doDeviceCallRequest(requestData: ws.IDeviceCallRequest): Promise<deviceRequests.Response> {
        const userDevice = this.checkDevice(requestData.deviceId);
        const deviceId = userDevice.deviceId!;
        const device = this.state.mqttClient.getDevice(deviceId);
        const request = schema.requests.deserializeRequest(requestData.data);
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
