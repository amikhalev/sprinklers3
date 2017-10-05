import * as mqtt from "mqtt";

import logger from "@common/logger";
import {
    Duration,
    ISprinklersApi,
    Program,
    ProgramItem,
    Schedule,
    Section,
    SectionRun,
    SectionRunner,
    SprinklersDevice,
    TimeOfDay,
} from "@common/sprinklers";
import { checkedIndexOf } from "@common/utils";

const log = logger.child({ source: "mqtt" });

export class MqttApiClient implements ISprinklersApi {
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

    getDevice(prefix: string): SprinklersDevice {
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

    private processMessage(topic: string, payload: Buffer, packet: mqtt.Packet) {
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

class MqttSprinklersDevice extends SprinklersDevice {
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
    onMessage(topic: string, payloadBuf: Buffer) {
        const payload = payloadBuf.toString("utf8");
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

    runSection(section: Section | number, duration: Duration) {
        const sectionNum = checkedIndexOf(section, this.sections, "Section");
        const payload: IRunSectionJSON = {
            duration: duration.toSeconds(),
        };
        return this.makeRequest(`sections/${sectionNum}/run`, payload);
    }

    runProgram(program: Program | number) {
        const programNum = checkedIndexOf(program, this.programs, "Program");
        return this.makeRequest(`programs/${programNum}/run`, {});
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

interface ISectionJSON {
    name: string;
    pin: number;
}

interface IRunSectionJSON {
    duration: number;
}

class MqttSection extends Section {
    onMessage(topic: string, payload: string) {
        if (topic === "state") {
            this.state = (payload === "true");
        } else if (topic == null) {
            const json = JSON.parse(payload) as ISectionJSON;
            this.name = json.name;
        }
    }
}

interface ITimeOfDayJSON {
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
}

function timeOfDayFromJSON(json: ITimeOfDayJSON): TimeOfDay {
    return new TimeOfDay(json.hour, json.minute, json.second, json.millisecond);
}

interface IScheduleJSON {
    times: ITimeOfDayJSON[];
    weekdays: number[];
    from?: string;
    to?: string;
}

function scheduleFromJSON(json: IScheduleJSON): Schedule {
    const sched = new Schedule();
    sched.times = json.times.map(timeOfDayFromJSON);
    sched.weekdays = json.weekdays;
    sched.from = json.from == null ? null : new Date(json.from);
    sched.to = json.to == null ? null : new Date(json.to);
    return sched;
}

interface IProgramItemJSON {
    section: number;
    duration: number;
}

interface IProgramJSON {
    name: string;
    enabled: boolean;
    sequence: IProgramItemJSON[];
    sched: IScheduleJSON;
}

class MqttProgram extends Program {
    onMessage(topic: string, payload: string) {
        if (topic === "running") {
            this.running = (payload === "true");
        } else if (topic == null) {
            const json = JSON.parse(payload) as Partial<IProgramJSON>;
            this.updateFromJSON(json);
        }
    }

    updateFromJSON(json: Partial<IProgramJSON>) {
        if (json.name != null) {
            this.name = json.name;
        }
        if (json.enabled != null) {
            this.enabled = json.enabled;
        }
        if (json.sequence != null) {
            this.sequence = json.sequence.map((item) => (new ProgramItem(
                item.section,
                Duration.fromSeconds(item.duration),
            )));
        }
        if (json.sched != null) {
            this.schedule = scheduleFromJSON(json.sched);
        }
    }
}

export interface ISectionRunJSON {
    id: number;
    section: number;
    duration: number;
    startTime?: number;
    pauseTime?: number;
}

function sectionRunFromJSON(json: ISectionRunJSON) {
    const run = new SectionRun(json.id);
    run.section = json.section;
    run.duration = Duration.fromSeconds(json.duration);
    run.startTime = json.startTime == null ? null : new Date(json.startTime);
    run.pauseTime = json.pauseTime == null ? null : new Date(json.pauseTime);
    return run;
}

interface ISectionRunnerJSON {
    queue: ISectionRunJSON[];
    current: ISectionRunJSON | null;
    paused: boolean;
}

class MqttSectionRunner extends SectionRunner {
    onMessage(payload: string) {
        const json = JSON.parse(payload) as ISectionRunnerJSON;
        this.updateFromJSON(json);
    }

    updateFromJSON(json: ISectionRunnerJSON) {
        this.queue.length = 0;
        if (json.queue && json.queue.length) { // null means empty queue
            this.queue.push.apply(this.queue, json.queue.map(sectionRunFromJSON));
        }
        this.current = json.current == null ? null : sectionRunFromJSON(json.current);
        this.paused = json.paused;
    }
}
