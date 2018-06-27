import logger from "@common/logger";
import {SprinklersDevice} from "@common/sprinklers";
import * as mqtt from "@common/sprinklers/mqtt";
import { Database } from "./models/Database";

export class ServerState {
    mqttClient: mqtt.MqttApiClient;
    device: SprinklersDevice;
    database: Database;

    constructor() {
        const mqttUrl = process.env.MQTT_URL;
        if (!mqttUrl) {
            throw new Error("Must specify a MQTT_URL to connect to");
        }
        this.mqttClient = new mqtt.MqttApiClient(mqttUrl);
        this.device = this.mqttClient.getDevice("grinklers");
        this.database = new Database();
    }

    async start() {
        await this.database.connect();
        await this.database.createAll();
        logger.info("created database and tables");

        this.mqttClient.start();
    }
}
