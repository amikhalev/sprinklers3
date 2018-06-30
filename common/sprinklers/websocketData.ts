import { Response as ResponseData } from "@common/sprinklers/requests";

export interface IError {
    type: "error";
    message: string;
    data: any;
}

export interface IDeviceSubscribeResponse {
    type: "deviceSubscribeResponse";
    deviceId: string;
    result: "success" | "noPermission";
}

export interface IDeviceUpdate {
    type: "deviceUpdate";
    deviceId: string;
    data: any;
}

export interface IDeviceCallResponse {
    type: "deviceCallResponse";
    requestId: number;
    data: ResponseData;
}

export interface IBrokerConnectionUpdate {
    type: "brokerConnectionUpdate";
    brokerConnected: boolean;
}

export type IServerMessage = IError | IDeviceSubscribeResponse | IDeviceUpdate | IDeviceCallResponse |
    IBrokerConnectionUpdate;

export interface IAuthenticateRequest {
    type: "authenticateRequest";
    accessToken: string;
}

export interface IDeviceSubscribeRequest {
    type: "deviceSubscribeRequest";
    deviceId: string;
}

export interface IDeviceCallRequest {
    type: "deviceCallRequest";
    requestId: number;
    deviceId: string;
    data: any;
}

export type IClientMessage = IDeviceSubscribeRequest | IDeviceCallRequest;
