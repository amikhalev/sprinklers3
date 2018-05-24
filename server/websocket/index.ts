import { autorun } from "mobx";
import { serialize } from "serializr";
import * as WebSocket from "ws";

import log from "@common/logger";
import * as requests from "@common/sprinklers/requests";
import * as schema from "@common/sprinklers/schema";
import * as ws from "@common/sprinklers/websocketData";

import {state} from "../state";

async function doDeviceCallRequest(requestData: ws.IDeviceCallRequest) {
    const { deviceName, data } = requestData;
    if (deviceName !== "grinklers") {
        // error handling? or just get the right device
        return false;
    }
    const request = schema.requests.deserializeRequest(data);
    return state.device.makeRequest(request);
}

async function deviceCallRequest(socket: WebSocket, data: ws.IDeviceCallRequest): Promise<void> {
    let response: requests.Response | false;
    try {
        response = await doDeviceCallRequest(data);
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

export function handler(socket: WebSocket) {
    const stop = autorun(() => {
        const json = serialize(schema.sprinklersDevice, state.device);
        log.trace({ device: json });
        const data = { type: "deviceUpdate", name: "grinklers", data: json };
        socket.send(JSON.stringify(data));
    }, { delay: 100 });
    socket.on("message", (socketData: WebSocket.Data) => {
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
                deviceCallRequest(socket, data);
                break;
            default:
                return log.warn({ data }, "received invalid client message type");
        }
    });
    socket.on("close", () => stop());
}
