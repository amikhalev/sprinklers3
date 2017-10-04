import "./configureAlias";

import "env";

import log from "@common/logger";
import * as mqtt from "@common/sprinklers/mqtt";
import { Server } from "http";
import app from "./app";

const mqttClient = new mqtt.MqttApiClient("mqtt://localhost:1883");

mqttClient.start();

import { autorun } from "mobx";
const device = mqttClient.getDevice("grinklers");
autorun(() => log.info("device: ", device.toString()));

import * as json from "@common/sprinklers/json";

app.get("/grinklers", (req, res) => {
    const j = json.sprinklersDeviceToJSON(device);
    console.dir(device);
    res.send(j);
});

const server = new Server(app);

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
    log.info(`listening at ${host}:${port}`);
});
