import { MqttApiClient } from "@common/sprinklers/mqtt";
import { WebSocketApiClient } from "../sprinklers/websocket";
import StateBase from "./StateBase";

const isDev = process.env.NODE_ENV === "development";
const websocketPort = isDev ? 8080 : location.port;

export class MqttApiState extends StateBase {
    sprinklersApi = new MqttApiClient(`ws://${location.hostname}:1884`);
}

export class WebApiState extends StateBase {
    sprinklersApi = new WebSocketApiClient(`ws://${location.hostname}:${websocketPort}`);
}
