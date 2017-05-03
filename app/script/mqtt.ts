import "paho-mqtt/mqttws31";
/// <reference path="./paho-mqtt.d.ts" />
import MQTT = Paho.MQTT;

import { EventEmitter } from "events";
import { SprinklersDevice, SprinklersApi } from "./sprinklers";


export class MqttApiClient extends EventEmitter implements SprinklersApi {
    client: MQTT.Client

    connected: boolean

    devices: { [prefix: string]: MqttSprinklersDevice } = {};

    constructor() {
        super();
        this.client = new Paho.MQTT.Client(location.hostname, 1884, MqttApiClient.newClientId());
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
        for (const prefix in this.devices) {
            const device = this.devices[prefix];
            device.onMessage(m);
        }
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
            `${this.prefix}/connected`
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

    onMessage(m: MQTT.Message) {
        const postfix = m.destinationName.replace(`${this.prefix}/`, "");
        if (postfix === m.destinationName)
            return;
        switch (postfix) {
            case "connected":
                this.connected = (m.payloadString == "true");
                console.log(`MqttSprinklersDevice with prefix ${this.prefix}: ${this.connected}`)
                break;
            default:
                console.warn(`MqttSprinklersDevice recieved invalid message`, m)
        }
    }

    get id(): string {
        return this.prefix;
    }
}