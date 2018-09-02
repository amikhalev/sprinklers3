import { autorun } from "mobx";
import { serialize } from "serializr";
import * as WebSocket from "ws";

import { ErrorCode } from "@common/ErrorCode";
import * as rpc from "@common/jsonRpc";
import log from "@common/logger";
import { RpcError } from "@common/sprinklersRpc";
import * as deviceRequests from "@common/sprinklersRpc/deviceRequests";
import * as schema from "@common/sprinklersRpc/schema";
import * as ws from "@common/sprinklersRpc/websocketData";
import { AccessToken } from "@common/TokenClaims";
import { verifyToken } from "@server/authentication";
import { User } from "@server/entities";

import { WebSocketApi } from "./WebSocketApi";

type Disposer = () => void;

export class WebSocketConnection {
  api: WebSocketApi;
  socket: WebSocket;

  disposers: Array<() => void> = [];
  // map of device id to disposer function
  deviceSubscriptions: Map<string, Disposer> = new Map();

  /// This shall be the user id if the client has been authenticated, null otherwise
  userId: number | null = null;
  user: User | null = null;

  private requestHandlers: ws.ClientRequestHandlers = new WebSocketRequestHandlers();

  get state() {
    return this.api.state;
  }

  constructor(api: WebSocketApi, socket: WebSocket) {
    this.api = api;
    this.socket = socket;

    this.socket.on("message", this.handleSocketMessage);
    this.socket.on("close", this.onClose);
  }

  stop = () => {
    this.socket.close();
  };

  onClose = (code: number, reason: string) => {
    log.debug({ code, reason }, "WebSocketConnection closing");
    this.disposers.forEach(disposer => disposer());
    this.deviceSubscriptions.forEach(disposer => disposer());
    this.api.removeClient(this);
  };

  subscribeBrokerConnection() {
    this.disposers.push(
      autorun(() => {
        const updateData: ws.IBrokerConnectionUpdate = {
          brokerConnected: this.state.mqttClient.connected
        };
        this.sendNotification("brokerConnectionUpdate", updateData);
      })
    );
  }

  checkAuthorization() {
    if (!this.userId || !this.user) {
      throw new RpcError(
        "this WebSocket session has not been authenticated",
        ErrorCode.Unauthorized
      );
    }
  }

  checkDevice(devId: string) {
    const userDevice = this.user!.devices!.find(dev => dev.deviceId === devId);
    if (userDevice == null) {
      throw new RpcError(
        "you do not have permission to subscribe to device",
        ErrorCode.NoPermission,
        { id: devId }
      );
    }
    const deviceId = userDevice.deviceId;
    if (!deviceId) {
      throw new RpcError(
        "device has no associated device prefix",
        ErrorCode.Internal
      );
    }
    return userDevice;
  }

  sendMessage(data: ws.ServerMessage) {
    this.socket.send(JSON.stringify(data));
  }

  sendNotification<Method extends ws.ServerNotificationMethod>(
    method: Method,
    data: ws.IServerNotificationTypes[Method]
  ) {
    this.sendMessage({ type: "notification", method, data });
  }

  sendResponse<Method extends ws.ClientRequestMethods>(
    method: Method,
    id: number,
    data: ws.ServerResponseData<Method>
  ) {
    this.sendMessage({ type: "response", method, id, ...data });
  }

  handleSocketMessage = (socketData: WebSocket.Data) => {
    this.doHandleSocketMessage(socketData).catch(err => {
      this.onError({ err }, "unhandled error on handling socket message");
    });
  };

  async doDeviceCallRequest(
    requestData: ws.IDeviceCallRequest
  ): Promise<deviceRequests.Response> {
    const userDevice = this.checkDevice(requestData.deviceId);
    const deviceId = userDevice.deviceId!;
    const device = this.state.mqttClient.acquireDevice(deviceId);
    try {
      const request = schema.requests.deserializeRequest(requestData.data);
      return await device.makeRequest(request);
    } finally {
      device.release();
    }
  }

  private async doHandleSocketMessage(socketData: WebSocket.Data) {
    if (typeof socketData !== "string") {
      return this.onError(
        { type: typeof socketData },
        "received invalid socket data type from client",
        ErrorCode.Parse
      );
    }
    let data: ws.ClientMessage;
    try {
      data = JSON.parse(socketData);
    } catch (err) {
      return this.onError(
        { socketData, err },
        "received invalid websocket message from client",
        ErrorCode.Parse
      );
    }
    switch (data.type) {
      case "request":
        await this.handleRequest(data);
        break;
      default:
        return this.onError(
          { data },
          "received invalid message type from client",
          ErrorCode.BadRequest
        );
    }
  }

  private async handleRequest(request: ws.ClientRequest) {
    let response: ws.ServerResponseData;
    try {
      if (!this.requestHandlers[request.method]) {
        // noinspection ExceptionCaughtLocallyJS
        throw new RpcError("received invalid client request method");
      }
      response = await rpc.handleRequest(this.requestHandlers, request, this);
    } catch (err) {
      if (err instanceof RpcError) {
        log.debug({ err }, "rpc error");
        response = { result: "error", error: err.toJSON() };
      } else {
        log.error(
          { method: request.method, err },
          "unhandled error during processing of client request"
        );
        response = {
          result: "error",
          error: {
            code: ErrorCode.Internal,
            message: "unhandled error during processing of client request",
            data: err.toString()
          }
        };
      }
    }
    this.sendResponse(request.method, request.id, response);
  }

  private onError(
    data: any,
    message: string,
    code: number = ErrorCode.Internal
  ) {
    log.error(data, message);
    const errorData: ws.IError = { code, message, data };
    this.sendNotification("error", errorData);
  }
}

class WebSocketRequestHandlers implements ws.ClientRequestHandlers {
  async authenticate(
    this: WebSocketConnection,
    data: ws.IAuthenticateRequest
  ): Promise<ws.ServerResponseData<"authenticate">> {
    if (!data.accessToken) {
      throw new RpcError("no token specified", ErrorCode.BadRequest);
    }
    let claims: AccessToken;
    try {
      claims = await verifyToken<AccessToken>(data.accessToken, "access");
    } catch (e) {
      throw new RpcError("invalid token", ErrorCode.BadToken, e);
    }
    this.userId = claims.aud;
    this.user =
      (await this.state.database.users.findById(this.userId, {
        devices: true
      })) || null;
    if (!this.user) {
      throw new RpcError("user no longer exists", ErrorCode.BadToken);
    }
    log.debug(
      { userId: claims.aud, name: claims.name },
      "authenticated websocket client"
    );
    this.subscribeBrokerConnection();
    return {
      result: "success",
      data: {
        authenticated: true,
        message: "authenticated",
        user: this.user.toJSON()
      }
    };
  }

  async deviceSubscribe(
    this: WebSocketConnection,
    data: ws.IDeviceSubscribeRequest
  ): Promise<ws.ServerResponseData<"deviceSubscribe">> {
    this.checkAuthorization();
    const userDevice = this.checkDevice(data.deviceId);
    const deviceId = userDevice.deviceId!;
    if (!this.deviceSubscriptions.has(deviceId)) {
      const device = this.state.mqttClient.acquireDevice(deviceId);
      log.debug(
        { deviceId, userId: this.userId },
        "websocket client subscribed to device"
      );

      const autorunDisposer = autorun(
        () => {
          const json = serialize(schema.sprinklersDevice, device);
          log.trace({ device: json });
          const updateData: ws.IDeviceUpdate = { deviceId, data: json };
          this.sendNotification("deviceUpdate", updateData);
        },
        { delay: 100 }
      );

      this.deviceSubscriptions.set(deviceId, () => {
        autorunDisposer();
        device.release();
        this.deviceSubscriptions.delete(deviceId);
      });
    }

    const response: ws.IDeviceSubscribeResponse = {
      deviceId
    };
    return { result: "success", data: response };
  }

  async deviceUnsubscribe(
    this: WebSocketConnection,
    data: ws.IDeviceSubscribeRequest
  ): Promise<ws.ServerResponseData<"deviceUnsubscribe">> {
    this.checkAuthorization();
    const userDevice = this.checkDevice(data.deviceId);
    const deviceId = userDevice.deviceId!;
    const disposer = this.deviceSubscriptions.get(deviceId);

    if (disposer) {
      disposer();
    }

    const response: ws.IDeviceSubscribeResponse = {
      deviceId
    };
    return { result: "success", data: response };
  }

  async deviceCall(
    this: WebSocketConnection,
    data: ws.IDeviceCallRequest
  ): Promise<ws.ServerResponseData<"deviceCall">> {
    this.checkAuthorization();
    try {
      const response = await this.doDeviceCallRequest(data);
      const resData: ws.IDeviceCallResponse = {
        data: response
      };
      return { result: "success", data: resData };
    } catch (err) {
      const e: deviceRequests.ErrorResponseData = err;
      throw new RpcError(e.message, e.code, e);
    }
  }
}
