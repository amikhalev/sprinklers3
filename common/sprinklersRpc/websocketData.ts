import * as rpc from "../jsonRpc/index";

import { ErrorCode } from "@common/ErrorCode";
import { Response as ResponseData } from "@common/sprinklersRpc/deviceRequests";

export interface IAuthenticateRequest {
    accessToken: string;
}

export interface IDeviceSubscribeRequest {
    deviceId: string;
}

export interface IDeviceCallRequest {
    deviceId: string;
    data: any;
}

export interface IClientRequestTypes {
    "authenticate": IAuthenticateRequest;
    "deviceSubscribe": IDeviceSubscribeRequest;
    "deviceCall": IDeviceCallRequest;
}

export interface IAuthenticateResponse {
    authenticated: boolean;
    message: string;
    data?: any;
}

export interface IDeviceSubscribeResponse {
    deviceId: string;
}

export interface IDeviceCallResponse {
    data: ResponseData;
}

export interface IServerResponseTypes {
    "authenticate": IAuthenticateResponse;
    "deviceSubscribe": IDeviceSubscribeResponse;
    "deviceCall": IDeviceCallResponse;
}

export type ClientRequestMethods = keyof IClientRequestTypes;

export interface IBrokerConnectionUpdate {
    brokerConnected: boolean;
}

export interface IDeviceUpdate {
    deviceId: string;
    data: any;
}

export interface IServerNotificationTypes {
    "brokerConnectionUpdate": IBrokerConnectionUpdate;
    "deviceUpdate": IDeviceUpdate;
    "error": IError;
}
export type ServerNotificationMethod = keyof IServerNotificationTypes;

export type IError = rpc.DefaultErrorType;
export type ErrorData = rpc.ErrorData<IError>;

export class RpcError extends Error implements IError {
    name = "RpcError";
    code: number;
    data: any;

    constructor(message: string, code: number = ErrorCode.BadRequest, data: any = {}) {
        super(message);
        this.code = code;
        if (data instanceof Error) {
            this.data = data.toString();
        }
        this.data = data;
    }

    toJSON(): IError {
        return { code: this.code, message: this.message, data: this.data };
    }
}

export type ServerMessage = rpc.Message<{}, IServerResponseTypes, IError, IServerNotificationTypes>;
export type ServerNotification = rpc.Notification<IServerNotificationTypes>;
export type ServerResponse = rpc.Response<IServerResponseTypes, IError>;
export type ServerResponseData<Method extends keyof IServerResponseTypes = keyof IServerResponseTypes> =
    rpc.ResponseData<IServerResponseTypes, IError, Method>;
export type ServerResponseHandlers = rpc.ResponseHandlers<IServerResponseTypes, IError>;
export type ServerNotificationHandlers = rpc.NotificationHandlers<IServerNotificationTypes>;

export type ClientRequest<Method extends keyof IClientRequestTypes = keyof IClientRequestTypes> =
    rpc.Request<IClientRequestTypes, Method>;
export type ClientMessage = rpc.Message<IClientRequestTypes, {}, IError, {}>;
export type ClientRequestHandlers = rpc.RequestHandlers<IClientRequestTypes, IServerResponseTypes, IError>;
