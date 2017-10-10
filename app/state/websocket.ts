import { update } from "serializr";

import logger from "@common/logger";
import * as s from "@common/sprinklers";
import * as schema from "@common/sprinklers/schema";
import * as ws from "@common/sprinklers/websocketData";
import { checkedIndexOf } from "@common/utils";

const log = logger.child({ source: "websocket" });

export class WebSprinklersDevice extends s.SprinklersDevice {
    readonly api: WebApiClient;

    constructor(api: WebApiClient) {
        super();
        this.api = api;
    }

    get id() {
        return "grinklers";
    }

    runSection(section: number | s.Section, duration: s.Duration): Promise<{}> {
        const secNum = checkedIndexOf(section, this.sections, "Section");
        const dur = duration.toSeconds();
        return this.makeCall("runSection", secNum, dur);
    }
    async runProgram(program: number | s.Program): Promise<{}> {
        return {};
    }
    async cancelSectionRunById(id: number): Promise<{}> {
        return {};
    }
    async pauseSectionRunner(): Promise<{}> {
        return {};
    }
    async unpauseSectionRunner(): Promise<{}> {
        return {};
    }

    private makeCall(method: string, ...args: any[]) {
        return this.api.makeDeviceCall(this.id, method, ...args);
    }
}

export class WebApiClient implements s.ISprinklersApi {
    readonly webSocketUrl: string;
    socket: WebSocket;
    device: WebSprinklersDevice;

    nextDeviceRequestId = Math.round(Math.random() * 1000000);
    deviceResponseCallbacks: { [id: number]: (res: ws.IDeviceCallResponse) => void | undefined; } = {};

    constructor(webSocketUrl: string) {
        this.webSocketUrl = webSocketUrl;
        this.device = new WebSprinklersDevice(this);
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
    makeDeviceCall(deviceName: string, method: string, ...args: any[]): Promise<any> {
        const id = this.nextDeviceRequestId++;
        const data: ws.IDeviceCallRequest = {
            type: "deviceCallRequest",
            id, deviceName, method, args,
        };
        const promise = new Promise((resolve, reject) => {
            this.deviceResponseCallbacks[id] = (resData) => {
                if (resData.result === "success") {
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
    }

    private onClose(event: CloseEvent) {
        log.info({ reason: event.reason, wasClean: event.wasClean },
            "disconnected from websocket");
    }

    private onError(event: Event) {
        log.error(event, "websocket error");
    }

    private onMessage(event: MessageEvent) {
        log.trace({ event }, "websocket message");
        let data: ws.IServerMessage;
        try {
            data = JSON.parse(event.data);
        } catch (err) {
            return log.error({ event, err }, "received invalid websocket message");
        }
        switch (data.type) {
            case "deviceUpdate":
                this.onDeviceUpdate(data);
                break;
            case "deviceCallResponse":
                this.onDeviceCallResponse(data);
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
}
