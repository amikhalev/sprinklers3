import { Server } from "http";
import app from "./app";
import log from "./log";

import * as mqtt from "mqtt";

const mqttClient = mqtt.connect("mqtt://localhost:1882");
mqttClient.on("connect", () => {
    log.info("mqtt connected");
});
mqttClient.on("error", (err) => {
    log.error("mqtt error: ", err);
});

const server = new Server(app);

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
    log.info(`listening at ${host}:${port}`);
});
