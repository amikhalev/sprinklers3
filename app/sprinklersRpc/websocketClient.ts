import { action, autorun, observable, when } from "mobx";
import { update } from "serializr";

import { TokenStore } from "@app/state/TokenStore";
import { ErrorCode } from "@common/ErrorCode";
import * as rpc from "@common/jsonRpc";
import logger from "@common/logger";
import * as deviceRequests from "@common/sprinklersRpc/deviceRequests";
import * as s from "@common/sprinklersRpc/index";
import * as schema from "@common/sprinklersRpc/schema/index";
import { seralizeRequest } from "@common/sprinklersRpc/schema/requests";
import * as ws from "@common/sprinklersRpc/websocketData";

const log = logger.child({ source: "websocket" });

const TIMEOUT_MS = 5000;
const RECONNECT_TIMEOUT_MS = 5000;

const isDev = process.env.NODE_ENV === "development";
const websocketProtocol = (location.protocol === "https:") ? "wss:" : "ws:";
const websocketPort = isDev ? 8080 : location.port;

const DEFAULT_URL = `${websocketProtocol}//${location.hostname}:${websocketPort}`;

// tslint:disable:member-ordering

export class WSSprinklersDevice extends s.SprinklersDevice {
    readonly api: WebSocketRpcClient;

    private _id: string;

    constructor(api: WebSocketRpcClient, id: string) {
        super();
        this.api = api;
        this._id = id;

        autorun(() => {
            this.connectionState.clientToServer = this.api.connectionState.clientToServer;
            this.connectionState.serverToBroker = this.api.connectionState.serverToBroker;
        });
        this.waitSubscribe();
    }

    get id() {
        return this._id;
    }

    async subscribe() {
        const subscribeRequest: ws.IDeviceSubscribeRequest = {
            deviceId: this.id,
        };
        try {
            await this.api.makeRequest("deviceSubscribe", subscribeRequest);
            this.connectionState.brokerToDevice = true;
        } catch (err) {
            this.connectionState.brokerToDevice = false;
            if ((err as ws.IError).code === ErrorCode.NoPermission) {
                this.connectionState.hasPermission = false;
            } else {
                log.error({ err });
            }
        }
    }

    makeRequest(request: deviceRequests.Request): Promise<deviceRequests.Response> {
        return this.api.makeDeviceCall(this.id, request);
    }

    waitSubscribe = () => {
        when(() => this.api.authenticated, () => {
            this.subscribe();
            when(() => !this.api.authenticated, this.waitSubscribe);
        });
    }
}

export class WebSocketRpcClient implements s.SprinklersRPC {
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

    get connected(): boolean {
        return this.connectionState.isConnected || false;
    }

    constructor(tokenStore: TokenStore, webSocketUrl: string = DEFAULT_URL) {
        this.webSocketUrl = webSocketUrl;
        this.tokenStore = tokenStore;
        this.connectionState.clientToServer = false;
        this.connectionState.serverToBroker = false;
    }

    start() {
        log.debug({ url: this.webSocketUrl }, "connecting to websocket");
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

    getDevice(id: string): s.SprinklersDevice {
        let device = this.devices.get(id);
        if (!device) {
            device = new WSSprinklersDevice(this, id);
            this.devices.set(id, device);
        }
        return device;
    }

    removeDevice(id: string) {
        // NOT IMPLEMENTED
    }

    async authenticate(accessToken: string): Promise<ws.IAuthenticateResponse> {
        return this.makeRequest("authenticate", { accessToken });
    }

    async tryAuthenticate() {
        when(() => this.connectionState.clientToServer === true
            && this.tokenStore.accessToken.isValid, async () => {
            try {
                await this.authenticate(this.tokenStore.accessToken.token!);
                this.authenticated = true;
            } catch (err) {
                logger.error({ err }, "error authenticating websocket connection");
                // TODO message?
                this.authenticated = false;
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
            throw error;
        }
        const requestData = seralizeRequest(request);
        const data: ws.IDeviceCallRequest = { deviceId, data: requestData };
        const resData = await this.makeRequest("deviceCall", data);
        if (resData.data.result === "error") {
            throw {
                code: resData.data.code,
                message: resData.data.message,
                data: resData.data,
            };
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
                    reject(response.error);
                }
            };
            timeoutHandle = window.setTimeout(() => {
                delete this.responseCallbacks[id];
                const res: ws.ErrorData = {
                    result: "error", error: {
                        code: ErrorCode.Timeout,
                        message: "the request timed out",
                    },
                };
                reject(res);
            }, TIMEOUT_MS);
            this.sendRequest(id, method, params);
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
        this.socket = new WebSocket(this.webSocketUrl);
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
    }

    private onOpen() {
        log.info("established websocket connection");
        this.connectionState.clientToServer = true;
        this.authenticated = false;
        this.tryAuthenticate();
    }

    /* tslint:disable-next-line:member-ordering */
    private onDisconnect = action(() => {
        this.connectionState.serverToBroker = null;
        this.connectionState.clientToServer = false;
        this.authenticated = false;
    });

    private onClose(event: CloseEvent) {
        log.info({ reason: event.reason, wasClean: event.wasClean },
            "disconnected from websocket");
        this.onDisconnect();
        this.reconnectTimer = window.setTimeout(this._reconnect, RECONNECT_TIMEOUT_MS);
    }

    private onError(event: Event) {
        log.error({ event }, "websocket error");
        action(() => {
            this.connectionState.serverToBroker = null;
            this.connectionState.clientToServer = false;
        });
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
            logger.error({ err }, "error handling server notification");
        }
    }

    private onResponse(data: ws.ServerResponse) {
        try {
            rpc.handleResponse(this.responseCallbacks, data);
        } catch (err) {
            log.error({ err }, "error handling server response");
        }
    }

    private notificationHandlers: ws.ServerNotificationHandlers = {
        brokerConnectionUpdate: (data: ws.IBrokerConnectionUpdate) => {
            this.connectionState.serverToBroker = data.brokerConnected;
        },
        deviceUpdate: (data: ws.IDeviceUpdate) => {
            const device = this.devices.get(data.deviceId);
            if (!device) {
                return log.warn({ data }, "invalid deviceUpdate received");
            }
            update(schema.sprinklersDevice, device, data.data);
        },
        error: (data: ws.IError) => {
            log.warn({ err: data }, "server error");
        },
    };
}
