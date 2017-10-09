export interface IDeviceUpdate {
    type: "deviceUpdate";
    name: string;
    data: any;
}

export interface IDeviceCallResponse {
    type: "deviceCallResponse";
    id: number;
    result: "success" | "error";
    data: any;
}

export type IServerMessage = IDeviceUpdate | IDeviceCallResponse;

export interface IDeviceCallRequest {
    type: "deviceCallRequest";
    id: number;
    deviceName: string;
    method: string;
    args: any[];
}

export type IClientMessage = IDeviceCallRequest;
