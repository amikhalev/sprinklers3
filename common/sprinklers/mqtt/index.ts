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
    devices: { [prefix: string]: MqttSprinklersDevice } = {};

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
            for (const prefix of Object.keys(this.devices)) {
                const device = this.devices[prefix];
                device.doSubscribe();
            }
        });
    }

    getDevice(prefix: string): s.SprinklersDevice {
        if (/\//.test(prefix)) {
            throw new Error("Prefix cannot contain a /");
        }
        if (!this.devices[prefix]) {
            const device = this.devices[prefix] = new MqttSprinklersDevice(this, prefix);
            if (this.connected) {
                device.doSubscribe();
            }
        }
        return this.devices[prefix];
    }

    removeDevice(prefix: string) {
        const device = this.devices[prefix];
        if (!device) {
            return;
        }
        device.doUnsubscribe();
        delete this.devices[prefix];
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
        const device = this.devices[prefix];
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

class MqttSprinklersDevice extends s.SprinklersDevice {
    readonly apiClient: MqttApiClient;
    readonly prefix: string;

    private responseCallbacks: {
        [rid: number]: ResponseCallback;
    } = {};

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

    /**
     * Updates this device with the specified message
     * @param topic The topic, with prefix removed
     * @param payload The payload buffer
     */
    onMessage(topic: string, payload: string) {
        if (topic === "connected") {
            this.connected = (payload === "true");
            log.trace(`MqttSprinklersDevice with prefix ${this.prefix}: ${this.connected}`);
            return;
        }
        let matches = topic.match(/^sections(?:\/(\d+)(?:\/?(.+))?)?$/);
        if (matches != null) {
            //noinspection JSUnusedLocalSymbols
            /* tslint:disable-next-line:no-unused-variable */
            const [_topic, secStr, subTopic] = matches;
            log.trace({ section: secStr, topic: subTopic, payload });
            if (!secStr) { // new number of sections
                this.sections.length = Number(payload);
            } else {
                const secNum = Number(secStr);
                let section = this.sections[secNum];
                if (!section) {
                    this.sections[secNum] = section = new MqttSection(this, secNum);
                }
                (section as MqttSection).onMessage(subTopic, payload);
            }
            return;
        }
        matches = topic.match(/^programs(?:\/(\d+)(?:\/?(.+))?)?$/);
        if (matches != null) {
            //noinspection JSUnusedLocalSymbols
            /* tslint:disable-next-line:no-unused-variable */
            const [_topic, progStr, subTopic] = matches;
            log.trace({ program: progStr, topic: subTopic, payload });
            if (!progStr) { // new number of programs
                this.programs.length = Number(payload);
            } else {
                const progNum = Number(progStr);
                let program = this.programs[progNum];
                if (!program) {
                    this.programs[progNum] = program = new MqttProgram(this, progNum);
                }
                (program as MqttProgram).onMessage(subTopic, payload);
            }
            return;
        }
        matches = topic.match(/^section_runner$/);
        if (matches != null) {
            (this.sectionRunner as MqttSectionRunner).onMessage(payload);
            return;
        }
        matches = topic.match(/^responses\/(\d+)$/);
        if (matches != null) {
            //noinspection JSUnusedLocalSymbols
            /* tslint:disable-next-line:no-unused-variable */
            const [_topic, respIdStr] = matches;
            log.trace({ response: respIdStr });
            const respId = parseInt(respIdStr, 10);
            const data = JSON.parse(payload) as IResponseData;
            const cb = this.responseCallbacks[respId];
            if (typeof cb === "function") {
                cb(data);
            }
            return;
        }
        log.warn({ topic }, "MqttSprinklersDevice recieved invalid message");
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

    //noinspection JSMethodCanBeStatic
    private nextRequestId(): number {
        return Math.floor(Math.random() * 1000000000);
    }

    private makeRequest(topic: string, payload: any = {}): Promise<IResponseData> {
        return new Promise<IResponseData>((resolve, reject) => {
            const requestId = payload.rid = this.nextRequestId();
            const payloadStr = JSON.stringify(payload);
            const fullTopic = this.prefix + "/" + topic;
            this.responseCallbacks[requestId] = (data) => {
                if (data.error != null) {
                    reject(data);
                } else {
                    resolve(data);
                }
            };
            this.apiClient.client.publish(fullTopic, payloadStr, { qos: 1 });
        });

    }
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
    onMessage(topic: string, payload: string) {
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
    onMessage(topic: string, payload: string) {
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
