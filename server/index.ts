/* tslint:disable:ordered-imports */
import "./configureAlias";
import "env";
import "./configureLogger";

import log from "@common/logger";
import * as mqtt from "@common/sprinklers/mqtt";
import { Server } from "http";
import * as WebSocket from "ws";
import app from "./app";

const mqttClient = new mqtt.MqttApiClient("mqtt://localhost:1883");
mqttClient.start();

import * as schema from "@common/sprinklers/schema";
import * as requests from "@common/sprinklers/requests";
import * as ws from "@common/sprinklers/websocketData";
import { autorunAsync } from "mobx";
import { serialize } from "serializr";
const device = mqttClient.getDevice("grinklers");

app.get("/api/grinklers", (req, res) => {
    const j = serialize(schema.sprinklersDevice, device);
    res.send(j);
});

async function doDeviceCallRequest(requestData: ws.IDeviceCallRequest) {
    const { deviceName, data } = requestData;
    if (deviceName !== "grinklers") {
        // error handling? or just get the right device
        return false;
    }
    const request = schema.requests.deserializeRequest(data);
    return device.makeRequest(request);
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

function webSocketHandler(socket: WebSocket) {
    const stop = autorunAsync(() => {
        const json = serialize(schema.sprinklersDevice, device);
        log.trace({ device: json });
        const data = { type: "deviceUpdate", name: "grinklers", data: json };
        socket.send(JSON.stringify(data));
    }, 100);
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

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

const server = new Server(app);
const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on("connection", webSocketHandler);

server.listen(port, host, () => {
    log.info(`listening at ${host}:${port}`);
});
