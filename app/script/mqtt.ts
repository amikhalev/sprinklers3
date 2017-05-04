/// <reference path="./paho-mqtt.d.ts" />
import "paho-mqtt/mqttws31";
import MQTT = Paho.MQTT;

import { EventEmitter } from "events";
import { SprinklersDevice, SprinklersApi, Section, Program } from "./sprinklers";


export class MqttApiClient extends EventEmitter implements SprinklersApi {
    client: MQTT.Client

    connected: boolean

    devices: { [prefix: string]: MqttSprinklersDevice } = {};

    constructor() {
        super();
        this.client = new MQTT.Client(location.hostname, 1884, MqttApiClient.newClientId());
        this.client.onMessageArrived = m => this.onMessageArrived(m);
        this.client.onConnectionLost = e => this.onConnectionLost(e);
    }

    static newClientId() {
        return "sprinklers3-MqttApiClient-" + Math.round(Math.random() * 1000);
    }

    start() {
        console.log("connecting to mqtt with client id %s", this.client.clientId);
        this.client.connect({
            onFailure: (e) => {
                console.log("mqtt error: ", e.errorMessage);
            },
            onSuccess: () => {
                console.log("mqtt connected")
                this.connected = true;
                for (const prefix in this.devices) {
                    const device = this.devices[prefix];
                    device.doSubscribe();
                }
            }
        })
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
        if (!device) return;
        device.doUnsubscribe();
        delete this.devices[prefix];
    }

    private onMessageArrived(m: MQTT.Message) {
        // console.log("message arrived: ", m)
        const topicIdx = m.destinationName.indexOf('/'); // find the first /
        const prefix = m.destinationName.substr(0, topicIdx); // assume prefix does not contain a /
        const topic = m.destinationName.substr(topicIdx + 1);
        const device = this.devices[prefix];
        if (!device) {
            console.warn(`recieved message for unknown device. prefix: ${prefix}`);
            return;
        }
        device.onMessage(topic, m.payloadString);
    }

    private onConnectionLost(e: MQTT.MQTTError) {
        this.connected = false;
    }
}

class MqttSprinklersDevice extends SprinklersDevice {
    readonly apiClient: MqttApiClient;
    readonly prefix: string;

    constructor(apiClient: MqttApiClient, prefix: string) {
        super();
        this.apiClient = apiClient;
        this.prefix = prefix;
    }

    private getSubscriptions() {
        return [
            `${this.prefix}/connected`,
            `${this.prefix}/sections`,
            `${this.prefix}/sections/+/#`,
            `${this.prefix}/programs`,
            `${this.prefix}/programs/+/#`
        ];
    }

    doSubscribe() {
        const c = this.apiClient.client;
        this.getSubscriptions()
            .forEach(filter => c.subscribe(filter, { qos: 1 }));

    }

    doUnsubscribe() {
        const c = this.apiClient.client;
        this.getSubscriptions()
            .forEach(filter => c.unsubscribe(filter));
    }

    /**
     * Updates this device with the specified message
     * @param topic The topic, with prefix removed
     * @param payload The payload string
     */
    onMessage(topic: string, payload: string) {
        var matches;
        if (topic == "connected") {
            this.connected = (payload == "true");
            // console.log(`MqttSprinklersDevice with prefix ${this.prefix}: ${this.connected}`)
        } else if ((matches = topic.match(/^sections(?:\/(\d+)(?:\/?(.+))?)?$/)) != null) {
            const [topic, secStr, subTopic] = matches;
            // console.log(`section: ${secStr}, topic: ${subTopic}, payload: ${payload}`);
            if (!secStr) { // new number of sections
                this.sections = new Array(Number(payload));
            } else {
                const secNum = Number(secStr);
                var section = this.sections[secNum];
                if (!section) {
                    this.sections[secNum] = section = new MqttSection();
                }
                (section as MqttSection).onMessage(subTopic, payload);
            }
        } else if ((matches = topic.match(/^programs(?:\/(\d+)(?:\/?(.+))?)?$/)) != null) {
            const [topic, progStr, subTopic] = matches;
            // console.log(`program: ${progStr}, topic: ${subTopic}, payload: ${payload}`);
            if (!progStr) { // new number of programs
                this.programs = new Array(Number(payload));
            } else {
                const progNum = Number(progStr);
                var program = this.programs[progNum];
                if (!program) {
                    this.programs[progNum] = program = new MqttProgram();
                }
                (program as MqttProgram).onMessage(subTopic, payload);
            }
        } else {
            console.warn(`MqttSprinklersDevice recieved invalid topic: ${topic}`)
        }
    }

    get id(): string {
        return this.prefix;
    }
}

interface SectionJSON {
    name: string;
    pin: number;
}

class MqttSection extends Section {
    onMessage(topic: string, payload: string) {
        if (topic == "state") {
            this.state = (payload == "true");
        } else if (topic == null) {
            const json = JSON.parse(payload) as SectionJSON;
            this.name = json.name;
        }
    }
}

interface ProgramJSON {
    name: string;
    enabled: boolean;
    // sequence: Array<ProgramItem>;
    // sched: Schedule;
}

class MqttProgram extends Program {
    onMessage(topic: string, payload: string) {
        if (topic == "running") {
            this.running = (payload == "true");
        } else if (topic == null) {
            const json = JSON.parse(payload) as Partial<ProgramJSON>;
            this.name = json.name;
            this.enabled = json.enabled;
        }
    }
}