import { action, computed, observable, runInAction, when } from "mobx";
import { update } from "serializr";

import { TokenStore } from "@client/state/TokenStore";
import { ErrorCode } from "@common/ErrorCode";
import { IUser } from "@common/httpApi";
import * as rpc from "@common/jsonRpc";
import logger from "@common/logger";
import * as s from "@common/sprinklersRpc";
import * as deviceRequests from "@common/sprinklersRpc/deviceRequests";
import * as schema from "@common/sprinklersRpc/schema/";
import { seralizeRequest } from "@common/sprinklersRpc/schema/requests";
import * as ws from "@common/sprinklersRpc/websocketData";
import { DefaultEvents, TypedEventEmitter, typedEventEmitter } from "@common/TypedEventEmitter";
import { WSSprinklersDevice } from "./WSSprinklersDevice";

export const log = logger.child({ source: "websocket" });

const TIMEOUT_MS = 5000;
const RECONNECT_TIMEOUT_MS = 5000;

const isDev = process.env.NODE_ENV === "development";
const websocketProtocol = (location.protocol === "https:") ? "wss:" : "ws:";
const websocketPort = isDev ? 8080 : location.port;

const DEFAULT_URL = `${websocketProtocol}//${location.hostname}:${websocketPort}`;

export interface WebSocketRpcClientEvents extends DefaultEvents {
    newUserData(userData: IUser): void;
    rpcError(error: s.RpcError): void;
    tokenError(error: s.RpcError): void;
}

// tslint:disable:member-ordering

export interface WebSocketRpcClient extends TypedEventEmitter<WebSocketRpcClientEvents> {
}

@typedEventEmitter
export class WebSocketRpcClient extends s.SprinklersRPC {
    @computed
    get connected(): boolean {
        return this.connectionState.isServerConnected || false;
    }

    readonly webSocketUrl: string;

    devices: Map<string, WSSprinklersDevice> = new Map();
    @observable connectionState: s.ConnectionState = new s.ConnectionState();
    socket: WebSocket | null = null;

    @observable
    authenticated: boolean = false;

    tokenStore: TokenStore;

    private nextRequestId = Math.round(Math.random() * 1000000);
    private responseCallbacks: ws.ServerResponseHandlers = {};
    private reconnectTimer: number | null = null;

    @action
    private onDisconnect = action(() => {
        this.connectionState.serverToBroker = null;
        this.connectionState.clientToServer = false;
        this.authenticated = false;
    });

    private notificationHandlers = new WSClientNotificationHandlers(this);

    constructor(tokenStore: TokenStore, webSocketUrl: string = DEFAULT_URL) {
        super();
        this.webSocketUrl = webSocketUrl;
        this.tokenStore = tokenStore;
        this.connectionState.clientToServer = false;
        this.connectionState.serverToBroker = false;

        this.on("rpcError", (err: s.RpcError) => {
            if (err.code === ErrorCode.BadToken) {
                this.emit("tokenError", err);
            }
        });
    }

    start() {
        this._connect();
    }

    stop() {
        if (this.reconnectTimer != null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket != null) {
            this.socket.close();
            this.socket = null;
        }
    }

    acquireDevice = s.SprinklersRPC.prototype.acquireDevice;

    protected getDevice(id: string): s.SprinklersDevice {
        let device = this.devices.get(id);
        if (!device) {
            device = new WSSprinklersDevice(this, id);
            this.devices.set(id, device);
        }
        return device;
    }

    releaseDevice(id: string): void {
        const device = this.devices.get(id);
        if (!device) return;
        device.unsubscribe()
            .then(() => {
                log.debug({ id }, "released device");
                this.devices.delete(id);
            });
    }

    async authenticate(accessToken: string): Promise<ws.IAuthenticateResponse> {
        return this.makeRequest("authenticate", { accessToken });
    }

    async tryAuthenticate() {
        when(() => this.connectionState.clientToServer === true
            && this.tokenStore.accessToken.isValid, async () => {
            try {
                const res = await this.authenticate(this.tokenStore.accessToken.token!);
                runInAction("authenticateSuccess", () => {
                    this.authenticated = res.authenticated;
                });
                logger.info({ user: res.user }, "authenticated websocket connection");
                this.emit("newUserData", res.user);
            } catch (err) {
                logger.error({ err }, "error authenticating websocket connection");
                // TODO message?
                runInAction("authenticateError", () => {
                    this.authenticated = false;
                });
            }
        });
    }

    // args must all be JSON serializable
    async makeDeviceCall(deviceId: string, request: deviceRequests.Request): Promise<deviceRequests.Response> {
        if (this.socket == null) {
            const error: ws.IError = {
                code: ErrorCode.ServerDisconnected,
                message: "the server is not connected",
            };
            throw new s.RpcError("the server is not connected", ErrorCode.ServerDisconnected);
        }
        const requestData = seralizeRequest(request);
        const data: ws.IDeviceCallRequest = { deviceId, data: requestData };
        const resData = await this.makeRequest("deviceCall", data);
        if (resData.data.result === "error") {
            throw new s.RpcError(resData.data.message, resData.data.code, resData.data);
        } else {
            return resData.data;
        }
    }

    makeRequest<Method extends ws.ClientRequestMethods>(method: Method, params: ws.IClientRequestTypes[Method]):
        Promise<ws.IServerResponseTypes[Method]> {
        const id = this.nextRequestId++;
        return new Promise<ws.IServerResponseTypes[Method]>((resolve, reject) => {
            let timeoutHandle: number;
            this.responseCallbacks[id] = (response) => {
                clearTimeout(timeoutHandle);
                delete this.responseCallbacks[id];
                if (response.result === "success") {
                    resolve(response.data);
                } else {
                    const { error } = response;
                    reject(new s.RpcError(error.message, error.code, error.data));
                }
            };
            timeoutHandle = window.setTimeout(() => {
                delete this.responseCallbacks[id];
                reject(new s.RpcError("the request timed out", ErrorCode.Timeout));
            }, TIMEOUT_MS);
            this.sendRequest(id, method, params);
        })
            .catch((err) => {
                if (err instanceof s.RpcError) {
                    this.emit("rpcError", err);
                }
                throw err;
            });
    }

    private sendMessage(data: ws.ClientMessage) {
        if (!this.socket) {
            throw new Error("WebSocketApiClient is not connected");
        }
        this.socket.send(JSON.stringify(data));
    }

    private sendRequest<Method extends ws.ClientRequestMethods>(
        id: number, method: Method, params: ws.IClientRequestTypes[Method],
    ) {
        this.sendMessage({ type: "request", id, method, params });
    }

    private _reconnect = () => {
        this._connect();
    }

    private _connect() {
        if (this.socket != null &&
            (this.socket.readyState === WebSocket.OPEN)) {
            this.tryAuthenticate();
            return;
        }
        log.debug({ url: this.webSocketUrl }, "connecting to websocket");
        this.socket = new WebSocket(this.webSocketUrl);
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
    }

    @action
    private onOpen() {
        log.info("established websocket connection");
        this.connectionState.clientToServer = true;
        this.authenticated = false;
        this.tryAuthenticate();
    }

    private onClose(event: CloseEvent) {
        log.info({ event },
            "disconnected from websocket");
        this.onDisconnect();
        this.reconnectTimer = window.setTimeout(this._reconnect, RECONNECT_TIMEOUT_MS);
    }

    @action
    private onError(event: Event) {
        log.error({ event }, "websocket error");
        this.connectionState.serverToBroker = null;
        this.connectionState.clientToServer = false;
        this.onDisconnect();
    }

    private onMessage(event: MessageEvent) {
        let data: ws.ServerMessage;
        try {
            data = JSON.parse(event.data);
        } catch (err) {
            return log.error({ event, err }, "received invalid websocket message");
        }
        log.trace({ data }, "websocket message");
        switch (data.type) {
            case "notification":
                this.onNotification(data);
                break;
            case "response":
                this.onResponse(data);
                break;
            default:
                log.warn({ data }, "unsupported event type received");
        }
    }

    private onNotification(data: ws.ServerNotification) {
        try {
            rpc.handleNotification(this.notificationHandlers, data);
        } catch (err) {
            logger.error(err, "error handling server notification");
        }
    }

    private onResponse(data: ws.ServerResponse) {
        try {
            rpc.handleResponse(this.responseCallbacks, data);
        } catch (err) {
            log.error({ err }, "error handling server response");
        }
    }
}

class WSClientNotificationHandlers implements ws.ServerNotificationHandlers  {
    client: WebSocketRpcClient;

    constructor(client: WebSocketRpcClient) {
        this.client = client;
    }

    @action.bound
    brokerConnectionUpdate(data: ws.IBrokerConnectionUpdate) {
        this.client.connectionState.serverToBroker = data.brokerConnected;
    }

    @action.bound
    deviceUpdate(data: ws.IDeviceUpdate) {
        const device = this.client.devices.get(data.deviceId);
        if (!device) {
            return log.warn({ data }, "invalid deviceUpdate received");
        }
        update(schema.sprinklersDevice, device, data.data);
    }

    error(data: ws.IError) {
        log.warn({ err: data }, "server error");
    }
}
