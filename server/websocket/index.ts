import log from "@common/logger";
import * as requests from "@common/sprinklers/requests";
import * as schema from "@common/sprinklers/schema";
import * as ws from "@common/sprinklers/websocketData";
import { autorun } from "mobx";
import { serialize } from "serializr";
import * as WebSocket from "ws";
import { ServerState } from "../state";

export class WebSocketApi {
    state: ServerState;

    constructor(state: ServerState) {
        this.state = state;
    }

    handleConnection = (socket: WebSocket) => {
        const disposers = [
            autorun(() => {
                const json = serialize(schema.sprinklersDevice, this.state.device);
                log.trace({ device: json });
                const data: ws.IDeviceUpdate = { type: "deviceUpdate", name: "grinklers", data: json };
                socket.send(JSON.stringify(data));
            }, { delay: 100 }),
            autorun(() => {
                const data: ws.IBrokerConnectionUpdate  = {
                    type: "brokerConnectionUpdate",
                    brokerConnected: this.state.mqttClient.connected,
                };
                socket.send(JSON.stringify(data));
            }),
        ];
        const stop = () => {
            disposers.forEach((disposer) => disposer());
        };
        socket.on("message", this.handleSocketMessage);
        socket.on("close", () => stop());
    }

    private handleSocketMessage = (socket: WebSocket, socketData: WebSocket.Data) => {
        if (typeof socketData !== "string") {
            return log.error({ type: typeof socketData }, "received invalid socket data type from client");
        }
        let data: ws.IClientMessage;
        try {
            data = JSON.parse(socketData);
        } catch (err) {
            return log.error({ event, err }, "received invalid websocket message from client");
        }
        switch (data.type) {
            case "deviceCallRequest":
                this.deviceCallRequest(socket, data);
                break;
            default:
                return log.warn({ data }, "received invalid client message type");
        }
    }

    private async deviceCallRequest(socket: WebSocket, data: ws.IDeviceCallRequest): Promise<void> {
        let response: requests.Response | false;
        try {
            response = await this.doDeviceCallRequest(data);
        } catch (err) {
            response = err;
        }
        if (response) {
            const resData: ws.IDeviceCallResponse = {
                type: "deviceCallResponse",
                id: data.id,
                data: response,
            };
            socket.send(JSON.stringify(resData));
        }
    }

    private async doDeviceCallRequest(requestData: ws.IDeviceCallRequest): Promise<requests.Response | false> {
        const { deviceName, data } = requestData;
        if (deviceName !== "grinklers") {
            // error handling? or just get the right device
            return false;
        }
        const request = schema.requests.deserializeRequest(data);
        return this.state.device.makeRequest(request);
    }
}
