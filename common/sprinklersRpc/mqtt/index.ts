import { autorun, observable } from "mobx";
import * as mqtt from "mqtt";

import { ErrorCode } from "@common/ErrorCode";
import logger from "@common/logger";
import * as s from "@common/sprinklersRpc";
import * as requests from "@common/sprinklersRpc/deviceRequests";
import { RpcError } from "@common/sprinklersRpc/RpcError";
import { seralizeRequest } from "@common/sprinklersRpc/schema/requests";
import { getRandomId } from "@common/utils";

import { MqttProgram } from "./MqttProgram";
import { MqttSection } from "./MqttSection";
import { MqttSectionRunner } from "./MqttSectionRunner";

const log = logger.child({ source: "mqtt" });

interface WithRid {
    rid: number;
}

export const DEVICE_PREFIX = "devices";
const REQUEST_TIMEOUT = 5000;

export interface MqttRpcClientOptions {
    mqttUri: string;
    username?: string;
    password?: string;
}

export class MqttRpcClient extends s.SprinklersRPC implements MqttRpcClientOptions {
    get connected(): boolean {
        return this.connectionState.isServerConnected || false;
    }

    private static newClientId() {
        return "sprinklers3-MqttApiClient-" + getRandomId();
    }

    mqttUri!: string;
    username?: string;
    password?: string;

    client!: mqtt.Client;
    @observable connectionState: s.ConnectionState = new s.ConnectionState();
    devices: Map<string, MqttSprinklersDevice> = new Map();

    constructor(opts: MqttRpcClientOptions) {
        super();
        Object.assign(this, opts);
        this.connectionState.serverToBroker = false;
    }

    start() {
        const clientId = MqttRpcClient.newClientId();
        const mqttUri = this.mqttUri;
        log.info({ mqttUri, clientId }, "connecting to mqtt broker with client id");
        this.client = mqtt.connect(mqttUri, {
            clientId, connectTimeout: 5000, reconnectPeriod: 5000,
            username: this.username, password: this.password,
        });
        this.client.on("message", this.onMessageArrived.bind(this));
        this.client.on("close", () => {
            logger.warn("mqtt disconnected");
            this.connectionState.serverToBroker = false;
        });
        this.client.on("error", (err) => {
            log.error({ err }, "mqtt error");
        });
        this.client.on("connect", () => {
            log.info("mqtt connected");
            this.connectionState.serverToBroker = true;
        });
    }

    releaseDevice(id: string) {
        const device = this.devices.get(id);
        if (!device) {
            return;
        }
        device.doUnsubscribe();
        this.devices.delete(id);
    }

    protected getDevice(id: string): s.SprinklersDevice {
        if (/\//.test(id)) {
            throw new Error("Device id cannot contain a /");
        }
        let device = this.devices.get(id);
        if (!device) {
            this.devices.set(id, device = new MqttSprinklersDevice(this, id));
            if (this.connected) {
                device.doSubscribe();
            }
        }
        return device;
    }

    private onMessageArrived(topic: string, payload: Buffer, packet: mqtt.Packet) {
        try {
            this.processMessage(topic, payload, packet);
        } catch (err) {
            log.error({ err }, "error while processing mqtt message");
        }
    }

    private processMessage(topic: string, payloadBuf: Buffer, packet: mqtt.Packet) {
        const payload = payloadBuf.toString("utf8");
        log.trace({ topic, payload }, "message arrived: ");
        const regexp = new RegExp(`^${DEVICE_PREFIX}\\/([^\\/]+)\\/?(.*)$`);
        const matches = regexp.exec(topic);
        if (!matches) {
            return log.warn({ topic }, "received message on invalid topic");
        }
        const id = matches[1];
        const topicSuffix = matches[2];
        const device = this.devices.get(id);
        if (!device) {
            log.debug({ id }, "received message for unknown device");
            return;
        }
        device.onMessage(topicSuffix, payload);
    }
}

type ResponseCallback = (response: requests.Response) => void;

const subscriptions = [
    "/connected",
    "/sections",
    "/sections/+/#",
    "/programs",
    "/programs/+/#",
    "/responses",
    "/section_runner",
];

type IHandler = (payload: any, ...matches: string[]) => void;

interface IHandlerEntry {
    test: RegExp;
    handler: IHandler;
}

const handler = (test: RegExp) =>
    (target: MqttSprinklersDevice, propertyKey: string, descriptor: TypedPropertyDescriptor<IHandler>) => {
        if (typeof descriptor.value === "function") {
            const entry = {
                test, handler: descriptor.value,
            };
            (target.handlers || (target.handlers = [])).push(entry);
        }
    };

class MqttSprinklersDevice extends s.SprinklersDevice {
    readonly apiClient: MqttRpcClient;

    handlers!: IHandlerEntry[];
    private subscriptions: string[];
    private nextRequestId: number = Math.floor(Math.random() * 1000000000);
    private responseCallbacks: Map<number, ResponseCallback> = new Map();

    constructor(apiClient: MqttRpcClient, id: string) {
        super(apiClient, id);
        this.sectionConstructor = MqttSection;
        this.sectionRunnerConstructor = MqttSectionRunner;
        this.programConstructor = MqttProgram;
        this.apiClient = apiClient;
        this.sectionRunner = new MqttSectionRunner(this);
        this.subscriptions = subscriptions.map((filter) => this.prefix + filter);

        autorun(() => {
            const brokerConnected = apiClient.connected;
            this.connectionState.serverToBroker = brokerConnected;
            if (brokerConnected) {
                if (this.connectionState.brokerToDevice == null) {
                    this.connectionState.brokerToDevice = false;
                }
                this.doSubscribe();
            } else {
                this.connectionState.brokerToDevice = false;
            }
        });
    }

    get prefix(): string {
        return DEVICE_PREFIX + "/" + this.id;
    }

    doSubscribe() {
        this.apiClient.client.subscribe(this.subscriptions, { qos: 1 }, (err) => {
            if (err) {
                log.error({ err, id: this.id }, "error subscribing to device");
            } else {
                log.debug({ id: this.id }, "subscribed to device");
            }
        });
    }

    doUnsubscribe() {
        this.apiClient.client.unsubscribe(this.subscriptions, (err) => {
            if (err) {
                log.error({ err, id: this.id }, "error unsubscribing to device");
            } else {
                log.debug({ id: this.id }, "unsubscribed to device");
            }
        });
    }

    onMessage(topic: string, payload: string) {
        for (const { test, handler: hndlr } of this.handlers) {
            const matches = topic.match(test);
            if (!matches) {
                continue;
            }
            matches.shift();
            hndlr.call(this, payload, ...matches);
            return;
        }
        log.warn({ topic }, "MqttSprinklersDevice recieved message on invalid topic");
    }

    makeRequest(request: requests.Request): Promise<requests.Response> {
        return new Promise<requests.Response>((resolve, reject) => {
            const topic = this.prefix + "/requests";
            const json = seralizeRequest(request);
            const requestId = json.rid = this.getRequestId();
            const payloadStr = JSON.stringify(json);

            let timeoutHandle: any;
            const callback: ResponseCallback = (data) => {
                if (data.result === "error") {
                    reject(new RpcError(data.message, data.code, data));
                } else {
                    resolve(data);
                }
                this.responseCallbacks.delete(requestId);
                clearTimeout(timeoutHandle);
            };

            timeoutHandle = setTimeout(() => {
                reject(new RpcError("the request has timed out", ErrorCode.Timeout));
                this.responseCallbacks.delete(requestId);
                clearTimeout(timeoutHandle);
            }, REQUEST_TIMEOUT);

            this.responseCallbacks.set(requestId, callback);
            this.apiClient.client.publish(topic, payloadStr, { qos: 1 });
        });
    }

    private getRequestId(): number {
        return this.nextRequestId++;
    }

    /* tslint:disable:no-unused-variable */
    @handler(/^connected$/)
    private handleConnected(payload: string) {
        this.connectionState.brokerToDevice = (payload === "true");
        log.trace(`MqttSprinklersDevice with prefix ${this.prefix}: ${this.connected}`);
        return;
    }

    @handler(/^sections(?:\/(\d+)(?:\/?(.+))?)?$/)
    private handleSectionsUpdate(payload: string, secNumStr?: string, subTopic?: string) {
        log.trace({ section: secNumStr, topic: subTopic, payload }, "handling section update");
        if (!secNumStr) { // new number of sections
            this.sections.length = Number(payload);
        } else {
            const secNum = Number(secNumStr);
            let section = this.sections[secNum];
            if (!section) {
                this.sections[secNum] = section = new MqttSection(this, secNum);
            }
            (section as MqttSection).onMessage(payload, subTopic);
        }
    }

    @handler(/^programs(?:\/(\d+)(?:\/?(.+))?)?$/)
    private handleProgramsUpdate(payload: string, progNumStr?: string, subTopic?: string) {
        log.trace({ program: progNumStr, topic: subTopic, payload }, "handling program update");
        if (!progNumStr) { // new number of programs
            this.programs.length = Number(payload);
        } else {
            const progNum = Number(progNumStr);
            let program = this.programs[progNum];
            if (!program) {
                this.programs[progNum] = program = new MqttProgram(this, progNum);
            }
            (program as MqttProgram).onMessage(payload, subTopic);
        }
    }

    @handler(/^section_runner$/)
    private handleSectionRunnerUpdate(payload: string) {
        (this.sectionRunner as MqttSectionRunner).onMessage(payload);
    }

    @handler(/^responses$/)
    private handleResponse(payload: string) {
        const data = JSON.parse(payload) as requests.Response & WithRid;
        log.trace({ rid: data.rid }, "handling request response");
        const cb = this.responseCallbacks.get(data.rid);
        if (typeof cb === "function") {
            delete data.rid;
            cb(data);
        }
    }

    /* tslint:enable:no-unused-variable */
}
