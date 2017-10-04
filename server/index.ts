import "./configureAlias";

import "env";

import log from "@common/logger";
import * as mqtt from "@common/sprinklers/mqtt";
import { Server } from "http";
import app from "./app";

const mqttClient = new mqtt.MqttApiClient("mqtt://localhost:1883");

mqttClient.start();

import * as sjson from "@common/sprinklers/json";
import { autorun } from "mobx";
const device = mqttClient.getDevice("grinklers");

app.get("/api/grinklers", (req, res) => {
    const j = sjson.sprinklersDeviceToJSON(device);
    log.trace(j);
    res.send(j);
});

const server = new Server(app);

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
    log.info(`listening at ${host}:${port}`);
});
