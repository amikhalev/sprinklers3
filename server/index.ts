import { Server } from "http";
import log, { setLogger } from "../common/logger";
import app from "./app";

setLogger(log.child({ name: "sprinklers3/server" }));

import * as mqtt from "../common/mqtt";

const mqttClient = new mqtt.MqttApiClient("mqtt://localhost:1882");

mqttClient.start();

const server = new Server(app);

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
    log.info(`listening at ${host}:${port}`);
});
