import { Response as ResponseData } from "@common/sprinklers/requests";

export interface IDeviceUpdate {
    type: "deviceUpdate";
    name: string;
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

export type IServerMessage = IDeviceUpdate | IDeviceCallResponse | IBrokerConnectionUpdate;

export interface IDeviceCallRequest {
    type: "deviceCallRequest";
    id: number;
    deviceName: string;
    data: any;
}

export type IClientMessage = IDeviceCallRequest;
