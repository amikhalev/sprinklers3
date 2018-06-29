import { Response as ResponseData } from "@common/sprinklers/requests";

export interface IError {
    type: "error";
    message: string;
    data: any;
}

export interface IDeviceUpdate {
    type: "deviceUpdate";
    deviceId: string;
    data: any;
}

export interface IDeviceCallResponse {
    type: "deviceCallResponse";
    id: number;
    data: ResponseData;
}

export interface IBrokerConnectionUpdate {
    type: "brokerConnectionUpdate";
    brokerConnected: boolean;
}

export type IServerMessage = IError | IDeviceUpdate | IDeviceCallResponse | IBrokerConnectionUpdate;

export type SubscriptionType = "deviceUpdate" | "brokerConnectionUpdate";

export interface IDeviceSubscribeRequest {
    type: "deviceSubscribeRequest";
    deviceId: string;
}

export interface IDeviceCallRequest {
    type: "deviceCallRequest";
    id: number;
    deviceId: string;
    data: any;
}

export type IClientMessage = IDeviceSubscribeRequest | IDeviceCallRequest;
