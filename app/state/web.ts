import { MqttApiClient } from "@common/sprinklers/mqtt";
import StateBase from "./StateBase";
import { WebApiClient } from "./websocket";

const isDev = process.env.NODE_ENV === "development";
const websocketPort = isDev ? 8080 : location.port;

export class MqttApiState extends StateBase {
    sprinklersApi = new MqttApiClient(`ws://${location.hostname}:1884`);
}

export class WebApiState extends StateBase {
    sprinklersApi = new WebApiClient(`ws://${location.hostname}:${websocketPort}`);
}
