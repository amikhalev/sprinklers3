import * as mqtt from "mqtt";
import { update } from "serializr";

import logger from "@common/logger";
import * as s from "@common/sprinklers";
import * as requests from "@common/sprinklers/requests";
import * as schema from "@common/sprinklers/schema";
import { seralizeRequest } from "@common/sprinklers/schema/requests";
import { autorun, observable } from "mobx";

const log = logger.child({ source: "mqtt" });

interface WithRid {
    rid: number;
}

export class MqttApiClient implements s.ISprinklersApi {
    readonly mqttUri: string;
    client!: mqtt.Client;
    @observable connectionState: s.ConnectionState = new s.ConnectionState();
    devices: Map<string, MqttSprinklersDevice> = new Map();

    get connected(): boolean {
        return this.connectionState.isConnected;
    }

    constructor(mqttUri: string) {
        this.mqttUri = mqttUri;
        this.connectionState.serverToBroker = false;
    }

    private static newClientId() {
        return "sprinklers3-MqttApiClient-" + Math.round(Math.random() * 1000);
    }

    start() {
        const clientId = MqttApiClient.newClientId();
        log.info({ mqttUri: this.mqttUri, clientId }, "connecting to mqtt broker with client id");
        this.client = mqtt.connect(this.mqttUri, {
            clientId, connectTimeout: 5000, reconnectPeriod: 5000,
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

    getDevice(id: string): s.SprinklersDevice {
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

    removeDevice(id: string) {
        const device = this.devices.get(id);
        if (!device) {
            return;
        }
        device.doUnsubscribe();
        this.devices.delete(id);
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
        const topicIdx = topic.indexOf("/"); // find the first /
        const prefix = topic.substr(0, topicIdx); // assume prefix does not contain a /
        const topicSuffix = topic.substr(topicIdx + 1);
        const device = this.devices.get(prefix);
        if (!device) {
            log.debug({ prefix }, "received message for unknown device");
            return;
        }
        device.onMessage(topicSuffix, payload);
    }
}

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
    readonly apiClient: MqttApiClient;
    readonly prefix: string;

    handlers!: IHandlerEntry[];
    private nextRequestId: number = Math.floor(Math.random() * 1000000000);
    private responseCallbacks: Map<number, ResponseCallback> = new Map();

    constructor(apiClient: MqttApiClient, prefix: string) {
        super();
        this.sectionConstructor = MqttSection;
        this.sectionRunnerConstructor = MqttSectionRunner;
        this.programConstructor = MqttProgram;
        this.apiClient = apiClient;
        this.prefix = prefix;
        this.sectionRunner = new MqttSectionRunner(this);

        autorun(() => {
            const brokerConnected = apiClient.connected;
            this.connectionState.serverToBroker = brokerConnected;
            if (brokerConnected) {
                this.doSubscribe();
            } else {
                this.connectionState.brokerToDevice = false;
            }
        });
    }

    get id(): string {
        return this.prefix;
    }

    doSubscribe() {
        const topics = subscriptions.map((filter) => this.prefix + filter);
        this.apiClient.client.subscribe(topics, { qos: 1 });
    }

    doUnsubscribe() {
        const topics = subscriptions.map((filter) => this.prefix + filter);
        this.apiClient.client.unsubscribe(topics);
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
            this.responseCallbacks.set(requestId, (data) => {
                if (data.result === "error") {
                    reject(data);
                } else {
                    resolve(data);
                }
                this.responseCallbacks.delete(requestId);
            });
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

type ResponseCallback = (response: requests.Response) => void;

class MqttSection extends s.Section {
    onMessage(payload: string, topic: string | undefined) {
        if (topic === "state") {
            this.state = (payload === "true");
        } else if (topic == null) {
            this.updateFromJSON(JSON.parse(payload));
        }
    }

    updateFromJSON(json: any) {
        update(schema.section, this, json);
    }
}

class MqttProgram extends s.Program {
    onMessage(payload: string, topic: string | undefined) {
        if (topic === "running") {
            this.running = (payload === "true");
        } else if (topic == null) {
            this.updateFromJSON(JSON.parse(payload));
        }
    }

    updateFromJSON(json: any) {
        update(schema.program, this, json);
    }
}

class MqttSectionRunner extends s.SectionRunner {
    onMessage(payload: string) {
        this.updateFromJSON(JSON.parse(payload));
    }

    updateFromJSON(json: any) {
        update(schema.sectionRunner, this, json);
    }
}
