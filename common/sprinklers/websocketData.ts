import * as rpc from "../jsonRpc/index";

import { Response as ResponseData } from "@common/sprinklers/deviceRequests";

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
    "error": Error;
}
export type ServerNotificationMethod = keyof IServerNotificationTypes;

export type Error = rpc.DefaultErrorType;
export type ErrorData = rpc.ErrorData<Error>;

export type ServerMessage = rpc.Message<{}, IServerResponseTypes, Error, IServerNotificationTypes>;
export type ServerNotification = rpc.Notification<IServerNotificationTypes>;
export type ServerResponse = rpc.Response<IServerResponseTypes, Error>;
export type ServerResponseData<Method extends keyof IServerResponseTypes = keyof IServerResponseTypes> =
    rpc.ResponseData<IServerResponseTypes, Error, Method>;
export type ServerResponseHandlers = rpc.ResponseHandlers<IServerResponseTypes, Error>;
export type ServerNotificationHandlers = rpc.NotificationHandlers<IServerNotificationTypes>;

export type ClientRequest<Method extends keyof IClientRequestTypes = keyof IClientRequestTypes> =
    rpc.Request<IClientRequestTypes, Method>;
export type ClientMessage = rpc.Message<IClientRequestTypes, {}, Error, {}>;
export type ClientRequestHandlers = rpc.RequestHandlers<IClientRequestTypes, IServerResponseTypes, Error>;
