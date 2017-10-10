import * as mqtt from "mqtt";
import { update } from "serializr";

import logger from "@common/logger";
import * as s from "@common/sprinklers";
import * as schema from "@common/sprinklers/schema";
import { checkedIndexOf } from "@common/utils";

const log = logger.child({ source: "mqtt" });

export class MqttApiClient implements s.ISprinklersApi {
    readonly mqttUri: string;
    client: mqtt.Client;
    connected: boolean;
    devices: Map<string, MqttSprinklersDevice> = new Map();

    constructor(mqttUri: string) {
        this.mqttUri = mqttUri;
    }

    private static newClientId() {
        return "sprinklers3-MqttApiClient-" + Math.round(Math.random() * 1000);
    }

    start() {
        const clientId = MqttApiClient.newClientId();
        log.info({ clientId }, "connecting to mqtt with client id");
        this.client = mqtt.connect(this.mqttUri, {
            clientId,
        });
        this.client.on("message", this.onMessageArrived.bind(this));
        this.client.on("offline", () => {
            this.connected = false;
        });
        this.client.on("error", (err) => {
            log.error({ err }, "mqtt error");
        });
        this.client.on("connect", () => {
            log.info("mqtt connected");
            this.connected = true;
            const values = this.devices.values();
            for (const device of values) {
                device.doSubscribe();
            }
        });
    }

    getDevice(prefix: string): s.SprinklersDevice {
        if (/\//.test(prefix)) {
            throw new Error("Prefix cannot contain a /");
        }
        let device = this.devices.get(prefix);
        if (!device) {
            this.devices.set(prefix, device = new MqttSprinklersDevice(this, prefix));
            if (this.connected) {
                device.doSubscribe();
            }
        }
        return device;
    }

    removeDevice(prefix: string) {
        const device = this.devices.get(prefix);
        if (!device) {
            return;
        }
        device.doUnsubscribe();
        this.devices.delete(prefix);
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
    "/responses/+",
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
            (target.handlers || (target.handlers = [])).push({
                test, handler: descriptor.value,
            });
        }
    };

class MqttSprinklersDevice extends s.SprinklersDevice {
    readonly apiClient: MqttApiClient;
    readonly prefix: string;

    handlers: IHandlerEntry[];
    private nextRequestId: number = Math.floor(Math.random() * 1000000000);
    private responseCallbacks: Map<number, ResponseCallback> = new Map();

    constructor(apiClient: MqttApiClient, prefix: string) {
        super();
        this.apiClient = apiClient;
        this.prefix = prefix;
        this.sectionRunner = new MqttSectionRunner(this);
    }

    get id(): string {
        return this.prefix;
    }

    get sectionConstructor() { return MqttSection; }
    get sectionRunnerConstructor() { return MqttSectionRunner; }
    get programConstructor() { return MqttProgram; }

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

    runSection(section: s.Section | number, duration: s.Duration) {
        const sectionNum = checkedIndexOf(section, this.sections, "Section");
        const payload: IRunSectionJSON = {
            duration: duration.toSeconds(),
        };
        return this.makeRequest(`sections/${sectionNum}/run`, payload);
    }

    runProgram(program: s.Program | number) {
        const programNum = checkedIndexOf(program, this.programs, "Program");
        return this.makeRequest(`programs/${programNum}/run`);
    }

    cancelSectionRunById(id: number) {
        return this.makeRequest(`section_runner/cancel_id`, { id });
    }

    pauseSectionRunner() {
        return this.makeRequest(`section_runner/pause`);
    }

    unpauseSectionRunner() {
        return this.makeRequest(`section_runner/unpause`);
    }

    private getRequestId(): number {
        return this.nextRequestId++;
    }

    private makeRequest(topic: string, payload: any = {}): Promise<IResponseData> {
        return new Promise<IResponseData>((resolve, reject) => {
            const requestId = payload.rid = this.getRequestId();
            const payloadStr = JSON.stringify(payload);
            const fullTopic = this.prefix + "/" + topic;
            this.responseCallbacks.set(requestId, (data) => {
                if (data.error != null) {
                    reject(data);
                } else {
                    resolve(data);
                }
                this.responseCallbacks.delete(requestId);
            });
            this.apiClient.client.publish(fullTopic, payloadStr, { qos: 1 });
        });
    }

    /* tslint:disable:no-unused-variable */
    @handler(/^connected$/)
    private handleConnected(payload: string) {
        this.connected = (payload === "true");
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

    @handler(/^responses\/(\d+)$/)
    private handleResponse(payload: string, responseIdStr: string) {
        log.trace({ response: responseIdStr }, "handling request response");
        const respId = parseInt(responseIdStr, 10);
        const data = JSON.parse(payload) as IResponseData;
        const cb = this.responseCallbacks.get(respId);
        if (typeof cb === "function") {
            cb(data);
        }
    }
    /* tslint:enable:no-unused-variable */
}

interface IResponseData {
    reqTopic: string;
    error?: string;

    [key: string]: any;
}

type ResponseCallback = (data: IResponseData) => void;

interface IRunSectionJSON {
    duration: number;
}

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
