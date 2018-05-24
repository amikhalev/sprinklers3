import {SprinklersDevice} from "@common/sprinklers";
import * as mqtt from "@common/sprinklers/mqtt";

export class State {
    mqttClient!: mqtt.MqttApiClient;
    device!: SprinklersDevice;

    start() {
        this.mqttClient = new mqtt.MqttApiClient("mqtt://localhost:1883");
        this.device = this.mqttClient.getDevice("grinklers");

        this.mqttClient.start();
    }
}

export const state: State = new State();
