import { action, observable, when } from "mobx";
import { update } from "serializr";

import logger from "@common/logger";
import { ErrorCode } from "@common/sprinklers/ErrorCode";
import * as s from "@common/sprinklers/index";
import * as requests from "@common/sprinklers/requests";
import * as schema from "@common/sprinklers/schema/index";
import { seralizeRequest } from "@common/sprinklers/schema/requests";
import * as ws from "@common/sprinklers/websocketData";

const log = logger.child({ source: "websocket" });

const TIMEOUT_MS = 5000;
const RECONNECT_TIMEOUT_MS = 5000;

export class WSSprinklersDevice extends s.SprinklersDevice {
    readonly api: WebSocketApiClient;

    private _id: string;

    constructor(api: WebSocketApiClient, id: string) {
        super();
        this.api = api;
        this._id = id;
        when(() => api.connectionState.isConnected || false, () => {
            this.subscribe();
        });
    }

    get id() {
        return this._id;
    }

    subscribe() {
        if (!this.api.socket) {
            throw new Error("WebSocket not connected");
        }
        const subscribeRequest: ws.IDeviceSubscribeRequest = {
            type: "deviceSubscribeRequest",
            deviceId: this.id,
        };
        this.api.socket.send(JSON.stringify(subscribeRequest));
    }

    onSubscribeResponse(data: ws.IDeviceSubscribeResponse) {
        this.connectionState.serverToBroker = true;
        this.connectionState.clientToServer = true;
        if (data.result === "success") {
            this.connectionState.hasPermission = true;
            this.connectionState.brokerToDevice = false;
        } else if (data.result === "noPermission") {
            this.connectionState.hasPermission = false;
        }
    }

    makeRequest(request: requests.Request): Promise<requests.Response> {
        return this.api.makeDeviceCall(this.id, request);
    }
}

export class WebSocketApiClient implements s.ISprinklersApi {
    readonly webSocketUrl: string;

    devices: Map<string, WSSprinklersDevice> = new Map();

    nextDeviceRequestId = Math.round(Math.random() * 1000000);
    deviceResponseCallbacks: { [id: number]: (res: ws.IDeviceCallResponse) => void | undefined; } = {};

    @observable connectionState: s.ConnectionState = new s.ConnectionState();

    socket: WebSocket | null = null;
    private reconnectTimer: number | null = null;

    get connected(): boolean {
        return this.connectionState.isConnected || false;
    }

    constructor(webSocketUrl: string) {
        this.webSocketUrl = webSocketUrl;
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

    // args must all be JSON serializable
    makeDeviceCall(deviceId: string, request: requests.Request): Promise<requests.Response> {
        if (this.socket == null) {
            const res: requests.Response = {
                type: request.type,
                result: "error",
                code: ErrorCode.ServerDisconnected,
                message: "the server is not connected",
            };
            throw res;
        }
        const requestData = seralizeRequest(request);
        const id = this.nextDeviceRequestId++;
        const data: ws.IDeviceCallRequest = {
            type: "deviceCallRequest",
            requestId: id, deviceId, data: requestData,
        };
        const promise = new Promise<requests.Response>((resolve, reject) => {
            let timeoutHandle: number;
            this.deviceResponseCallbacks[id] = (resData) => {
                clearTimeout(timeoutHandle);
                delete this.deviceResponseCallbacks[id];
                if (resData.data.result === "success") {
                    resolve(resData.data);
                } else {
                    reject(resData.data);
                }
            };
            timeoutHandle = window.setTimeout(() => {
                delete this.deviceResponseCallbacks[id];
                const res: requests.Response = {
                    type: request.type,
                    result: "error",
                    code: ErrorCode.Timeout,
                    message: "the request timed out",
                };
                reject(res);
            }, TIMEOUT_MS);
        });
        this.socket.send(JSON.stringify(data));
        return promise;
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
    }

    /* tslint:disable-next-line:member-ordering */
    private onDisconnect = action(() => {
        this.connectionState.serverToBroker = null;
        this.connectionState.clientToServer = false;
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
        let data: ws.IServerMessage;
        try {
            data = JSON.parse(event.data);
        } catch (err) {
            return log.error({ event, err }, "received invalid websocket message");
        }
        log.trace({ data }, "websocket message");
        switch (data.type) {
            case "deviceSubscribeResponse":
                this.onDeviceSubscribeResponse(data);
                break;
            case "deviceUpdate":
                this.onDeviceUpdate(data);
                break;
            case "deviceCallResponse":
                this.onDeviceCallResponse(data);
                break;
            case "brokerConnectionUpdate":
                this.onBrokerConnectionUpdate(data);
                break;
            default:
                log.warn({ data }, "unsupported event type received");
        }
    }

    private onDeviceSubscribeResponse(data: ws.IDeviceSubscribeResponse) {
        const device = this.devices.get(data.deviceId);
        if (!device) {
            return log.warn({ data }, "invalid deviceSubscribeResponse received");
        }
        device.onSubscribeResponse(data);
    }

    private onDeviceUpdate(data: ws.IDeviceUpdate) {
        const device = this.devices.get(data.deviceId);
        if (!device) {
            return log.warn({ data }, "invalid deviceUpdate received");
        }
        update(schema.sprinklersDevice, device, data.data);
    }

    private onDeviceCallResponse(data: ws.IDeviceCallResponse) {
        const cb = this.deviceResponseCallbacks[data.requestId];
        if (typeof cb === "function") {
            cb(data);
        }
    }

    private onBrokerConnectionUpdate(data: ws.IBrokerConnectionUpdate) {
        this.connectionState.serverToBroker = data.brokerConnected;
    }
}
