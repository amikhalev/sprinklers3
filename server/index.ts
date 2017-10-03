import "./configureAlias";

import "env";

import log from "@common/logger";
import * as mqtt from "@common/mqtt";
import { Server } from "http";
import app from "./app";

const mqttClient = new mqtt.MqttApiClient("mqtt://localhost:1882");

mqttClient.start();

import { autorun } from "mobx";
const device = mqttClient.getDevice("grinklers");
autorun(() => log.info("device: ", device.toString()));

const server = new Server(app);

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
    log.info(`listening at ${host}:${port}`);
});
