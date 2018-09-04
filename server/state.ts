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
      mqttUri: mqttUrl
    });
    this.database = new Database();
  }

  async startDatabase() {
    await this.database.connect();

    if (process.env.INSERT_TEST_DATA) {
      try {
        await this.database.insertTestData();
        logger.info("inserted test data");
      } catch (e) {
        logger.error(e, "error inserting test data");
      }
    }
  }
  
  async stopDatabase() {
    await this.database.disconnect();
  }

  async startMqtt() {
    this.mqttClient.username = SUPERUSER;
    this.mqttClient.password = await generateSuperuserToken();
    this.mqttClient.start();
  }

  async start() {
    await Promise.all([this.startDatabase(), this.startMqtt()]);
  }
}
