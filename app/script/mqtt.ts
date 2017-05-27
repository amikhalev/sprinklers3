import "paho-mqtt/mqttws31";
import MQTT = Paho.MQTT;

import { EventEmitter } from "events";
import {
    SprinklersDevice, ISprinklersApi, Section, Program, IProgramItem, Schedule, ITimeOfDay, Weekday, Duration,
} from "./sprinklers";

export class MqttApiClient extends EventEmitter implements ISprinklersApi {
    private static newClientId() {
        return "sprinklers3-MqttApiClient-" + Math.round(Math.random() * 1000);
    }

    public client: MQTT.Client;

    public connected: boolean;

    public devices: { [prefix: string]: MqttSprinklersDevice } = {};

    constructor() {
        super();
        this.client = new MQTT.Client(location.hostname, 1884, MqttApiClient.newClientId());
        this.client.onMessageArrived = (m) => this.onMessageArrived(m);
        this.client.onConnectionLost = (e) => this.onConnectionLost(e);
        // (this.client as any).trace = (m => console.log(m));
    }

    public start() {
        console.log("connecting to mqtt with client id %s", this.client.clientId);
        this.client.connect({
            onFailure: (e) => {
                console.log("mqtt error: ", e.errorMessage);
            },
            onSuccess: () => {
                console.log("mqtt connected");
                this.connected = true;
                for (const prefix of Object.keys(this.devices)) {
                    const device = this.devices[prefix];
                    device.doSubscribe();
                }
            },
        });
    }

    public getDevice(prefix: string): SprinklersDevice {
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

    public removeDevice(prefix: string) {
        const device = this.devices[prefix];
        if (!device) {
            return;
        }
        device.doUnsubscribe();
        delete this.devices[prefix];
    }

    private onMessageArrived(m: MQTT.Message) {
        try {
            this.processMessage(m);
        } catch (e) {
            console.error("error while processing mqtt message", e);
        }
    }

    private processMessage(m: MQTT.Message) {
        // console.log("message arrived: ", m);
        const topicIdx = m.destinationName.indexOf("/"); // find the first /
        const prefix = m.destinationName.substr(0, topicIdx); // assume prefix does not contain a /
        const topic = m.destinationName.substr(topicIdx + 1);
        const device = this.devices[prefix];
        if (!device) {
            console.warn(`received message for unknown device. prefix: ${prefix}`);
            return;
        }
        device.onMessage(topic, m.payloadString);
    }

    private onConnectionLost(e: MQTT.MQTTError) {
        this.connected = false;
    }
}

class MqttSprinklersDevice extends SprinklersDevice {
    public readonly apiClient: MqttApiClient;
    public readonly prefix: string;

    constructor(apiClient: MqttApiClient, prefix: string) {
        super();
        this.apiClient = apiClient;
        this.prefix = prefix;
    }

    public doSubscribe() {
        const c = this.apiClient.client;
        this.subscriptions
            .forEach((filter) => c.subscribe(filter, { qos: 1 }));
    }

    public doUnsubscribe() {
        const c = this.apiClient.client;
        this.subscriptions
            .forEach((filter) => c.unsubscribe(filter));
    }

    /**
     * Updates this device with the specified message
     * @param topic The topic, with prefix removed
     * @param payload The payload string
     */
    public onMessage(topic: string, payload: string) {
        if (topic === "connected") {
            this.connected = (payload === "true");
            // console.log(`MqttSprinklersDevice with prefix ${this.prefix}: ${this.connected}`)
            return;
        }
        let matches = topic.match(/^sections(?:\/(\d+)(?:\/?(.+))?)?$/);
        if (matches != null) {
            const [_topic, secStr, subTopic] = matches;
            // console.log(`section: ${secStr}, topic: ${subTopic}, payload: ${payload}`);
            if (!secStr) { // new number of sections
                this.sections.length = Number(payload);
            } else {
                const secNum = Number(secStr);
                let section = this.sections[secNum];
                if (!section) {
                    this.sections[secNum] = section = new MqttSection(this);
                }
                (section as MqttSection).onMessage(subTopic, payload);
            }
            return;
        }
        matches = topic.match(/^programs(?:\/(\d+)(?:\/?(.+))?)?$/);
        if (matches != null) {
            const [_topic, progStr, subTopic] = matches;
            // console.log(`program: ${progStr}, topic: ${subTopic}, payload: ${payload}`);
            if (!progStr) { // new number of programs
                this.programs.length = Number(payload);
            } else {
                const progNum = Number(progStr);
                let program = this.programs[progNum];
                if (!program) {
                    this.programs[progNum] = program = new MqttProgram();
                }
                (program as MqttProgram).onMessage(subTopic, payload);
            }
        } else {
            console.warn(`MqttSprinklersDevice recieved invalid topic: ${topic}`);
        }
    }

    get id(): string {
        return this.prefix;
    }

    public runSection(section: Section | number, duration: Duration) {
        let sectionNum: number;
        if (typeof section === "number") {
            sectionNum = section;
        } else {
            sectionNum = this.sections.indexOf(section);
        }
        if (sectionNum < 0 || sectionNum > this.sections.length) {
            throw new Error(`Invalid section to run: ${section}`);
        }
        const message = new MQTT.Message(JSON.stringify({
            duration: duration.toSeconds(),
        } as IRunSectionJSON));
        message.destinationName = `${this.prefix}/sections/${sectionNum}/run`;
        this.apiClient.client.send(message);
    }

    private get subscriptions() {
        return [
            `${this.prefix}/connected`,
            `${this.prefix}/sections`,
            `${this.prefix}/sections/+/#`,
            `${this.prefix}/programs`,
            `${this.prefix}/programs/+/#`,
        ];
    }
}

interface ISectionJSON {
    name: string;
    pin: number;
}

interface IRunSectionJSON {
    duration: number;
}

class MqttSection extends Section {

    constructor(device: MqttSprinklersDevice) {
        super(device);
    }

    public onMessage(topic: string, payload: string) {
        if (topic === "state") {
            this.state = (payload === "true");
        } else if (topic == null) {
            const json = JSON.parse(payload) as ISectionJSON;
            this.name = json.name;
        }
    }
}

interface IScheduleJSON {
    times: ITimeOfDay[];
    weekdays: number[];
    from?: string;
    to?: string;
}

function scheduleFromJSON(json: IScheduleJSON): Schedule {
    const sched = new Schedule();
    sched.times = json.times;
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
    public onMessage(topic: string, payload: string) {
        if (topic === "running") {
            this.running = (payload === "true");
        } else if (topic == null) {
            const json = JSON.parse(payload) as Partial<IProgramJSON>;
            this.updateFromJSON(json);
        }
    }

    public updateFromJSON(json: Partial<IProgramJSON>) {
        if (json.name != null) {
            this.name = json.name;
        }
        if (json.enabled != null) {
            this.enabled = json.enabled;
        }
        if (json.sequence != null) {
            // tslint:disable:object-literal-sort-keys
            this.sequence = json.sequence.map((item) => ({
                section: item.section,
                duration: Duration.fromSeconds(item.duration),
            }));
        }
        if (json.sched != null) {
            this.schedule = scheduleFromJSON(json.sched);
        }
    }
}
