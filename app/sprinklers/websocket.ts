import { update } from "serializr";

import logger from "@common/logger";
import * as s from "@common/sprinklers/index";
import * as requests from "@common/sprinklers/requests";
import * as schema from "@common/sprinklers/schema/index";
import { seralizeRequest } from "@common/sprinklers/schema/requests";
import * as ws from "@common/sprinklers/websocketData";
import { action, autorun, observable } from "mobx";

const log = logger.child({ source: "websocket" });

export class WSSprinklersDevice extends s.SprinklersDevice {
    readonly api: WebSocketApiClient;

    constructor(api: WebSocketApiClient) {
        super();
        this.api = api;
        autorun(() => {
            this.connectionState.serverToBroker = api.connectionState.serverToBroker;
            this.connectionState.clientToServer = api.connectionState.clientToServer;
            if (!api.connectionState.isConnected) {
                this.connectionState.brokerToDevice = null;
            }
        });
    }

    get id() {
        return "grinklers";
    }

    makeRequest(request: requests.Request): Promise<requests.Response> {
        return this.api.makeDeviceCall(this.id, request);
    }
}

export class WebSocketApiClient implements s.ISprinklersApi {
    readonly webSocketUrl: string;
    socket!: WebSocket;
    device: WSSprinklersDevice;

    nextDeviceRequestId = Math.round(Math.random() * 1000000);
    deviceResponseCallbacks: { [id: number]: (res: ws.IDeviceCallResponse) => void | undefined; } = {};

    @observable connectionState: s.ConnectionState = new s.ConnectionState();

    get connected(): boolean {
        return this.connectionState.isConnected;
    }

    constructor(webSocketUrl: string) {
        this.webSocketUrl = webSocketUrl;
        this.device = new WSSprinklersDevice(this);
        this.connectionState.clientToServer = false;
        this.connectionState.serverToBroker = false;
    }

    start() {
        log.debug({ url: this.webSocketUrl }, "connecting to websocket");
        this.socket = new WebSocket(this.webSocketUrl);
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
    }

    getDevice(name: string): s.SprinklersDevice {
        if (name !== "grinklers") {
            throw new Error("Devices which are not grinklers are not supported yet");
        }
        return this.device;
    }

    removeDevice(name: string) {
        // NOT IMPLEMENTED
    }

    // args must all be JSON serializable
    makeDeviceCall(deviceName: string, request: requests.Request): Promise<requests.Response> {
        const requestData = seralizeRequest(request);
        const id = this.nextDeviceRequestId++;
        const data: ws.IDeviceCallRequest = {
            type: "deviceCallRequest",
            id, deviceName, data: requestData,
        };
        const promise = new Promise<requests.Response>((resolve, reject) => {
            this.deviceResponseCallbacks[id] = (resData) => {
                if (resData.data.result === "success") {
                    resolve(resData.data);
                } else {
                    reject(resData.data);
                }
                delete this.deviceResponseCallbacks[id];
            };
        });
        this.socket.send(JSON.stringify(data));
        return promise;
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

    private onDeviceUpdate(data: ws.IDeviceUpdate) {
        if (data.name !== "grinklers") {
            return log.warn({ data }, "invalid deviceUpdate received");
        }
        update(schema.sprinklersDevice, this.device, data.data);
    }

    private onDeviceCallResponse(data: ws.IDeviceCallResponse) {
        const cb = this.deviceResponseCallbacks[data.id];
        if (typeof cb === "function") {
            cb(data);
        }
    }

    private onBrokerConnectionUpdate(data: ws.IBrokerConnectionUpdate) {
        this.connectionState.serverToBroker = data.brokerConnected;
    }
}
