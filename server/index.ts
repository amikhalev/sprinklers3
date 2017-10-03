import * as moduleAlias from "module-alias";
import * as path from "path";
moduleAlias.addAlias("@common", path.resolve(__dirname, "..", "common"));
moduleAlias.addAlias("@server", __dirname);
moduleAlias.addAlias("paths", require.resolve("../paths"));

import log, { setLogger } from "@common/logger";
import * as mqtt from "@common/mqtt";
import { Server } from "http";
import app from "./app";

setLogger(log.child({ name: "sprinklers3/server", level: "trace" }));

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
