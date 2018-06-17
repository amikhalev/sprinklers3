import {SprinklersDevice} from "@common/sprinklers";
import * as mqtt from "@common/sprinklers/mqtt";

export class State {
    mqttClient!: mqtt.MqttApiClient;
    device!: SprinklersDevice;

    start() {
        const mqttUrl = process.env.MQTT_URL;
        if (!mqttUrl) {
            throw new Error("Must specify a MQTT_URL to connect to");
        }
        this.mqttClient = new mqtt.MqttApiClient(mqttUrl);
        this.device = this.mqttClient.getDevice("grinklers");

        this.mqttClient.start();
    }
}

export const state: State = new State();
