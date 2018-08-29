import logger from "@common/logger";
import * as mqtt from "@common/sprinklersRpc/mqtt";
import { generateSuperuserToken } from "@server/authentication";
import { SUPERUSER } from "@server/express/api/mosquitto";
import { Database } from "./Database";

export class ServerState {
    mqttUrl: string;
    mqttClient: mqtt.MqttRpcClient;
    database: Database;

    constructor() {
        const mqttUrl = process.env.MQTT_URL;
        if (!mqttUrl) {
            throw new Error("Must specify a MQTT_URL to connect to");
        }
        this.mqttUrl = mqttUrl;
        this.mqttClient = new mqtt.MqttRpcClient({
            mqttUri: mqttUrl,
        });
        this.database = new Database();
    }

    async start() {
        await this.database.connect();
        await this.database.createAll();
        logger.info("created database and tables");

        this.mqttClient.username = SUPERUSER;
        this.mqttClient.password = await generateSuperuserToken();
        this.mqttClient.start();
    }
}
