// tslint:disable:interface-over-type-literal
export type DefaultRequestTypes = {};
export type DefaultResponseTypes = {};
export type DefaultErrorType = {
  code: number;
  message: string;
  data?: any;
};
export type DefaultNotificationTypes = {};
// tslint:enable:interface-over-type-literal

// export interface RpcTypes {
//     RequestTypes: DefaultRequestTypes;
//     ResponseTypes: DefaultResponseTypes;
//     NotificationTypes: DefaultNotificationTypes;
//     ErrorType: DefaultErrorType;
// }

export interface Request<
  RequestTypes = DefaultRequestTypes,
  Method extends keyof RequestTypes = keyof RequestTypes
> {
  type: "request";
  id: number;
  method: Method;
  params: RequestTypes[Method];
}

export interface ResponseBase<Method> {
  type: "response";
  id: number;
  method: Method;
}

export interface SuccessData<ResponseType> {
  result: "success";
  data: ResponseType;
}

export interface ErrorData<ErrorType> {
  result: "error";
  error: ErrorType;
}

export type ResponseData<
  ResponseTypes,
  ErrorType,
  Method extends keyof ResponseTypes = keyof ResponseTypes
> = SuccessData<ResponseTypes[Method]> | ErrorData<ErrorType>;

export type Response<
  ResponseTypes,
  ErrorType = DefaultErrorType,
  Method extends keyof ResponseTypes = keyof ResponseTypes
> = ResponseBase<Method> & ResponseData<ResponseTypes, ErrorType, Method>;

export interface Notification<
  NotificationTypes = DefaultNotificationTypes,
  Method extends keyof NotificationTypes = keyof NotificationTypes
> {
  type: "notification";
  method: Method;
  data: NotificationTypes[Method];
}

export type Message<
  RequestTypes = DefaultRequestTypes,
  ResponseTypes = DefaultResponseTypes,
  ErrorType = DefaultErrorType,
  NotificationTypes = DefaultNotificationTypes
> =
  | Request<RequestTypes>
  | Response<ResponseTypes, ErrorType>
  | Notification<NotificationTypes>;

// export type TypesMessage<Types extends RpcTypes = RpcTypes> =
//     Message<Types["RequestTypes"], Types["ResponseTypes"], Types["ErrorType"], Types["NotificationTypes"]>;

export function isRequestMethod<
  Method extends keyof RequestTypes,
  RequestTypes
>(
  message: Request<RequestTypes>,
  method: Method
): message is Request<RequestTypes, Method> {
  return message.method === method;
}

export function isResponseMethod<
  Method extends keyof ResponseTypes,
  ErrorType,
  ResponseTypes
>(
  message: Response<ResponseTypes, ErrorType>,
  method: Method
): message is Response<ResponseTypes, ErrorType, Method> {
  return message.method === method;
}

export function isNotificationMethod<
  Method extends keyof NotificationTypes,
  NotificationTypes = any
>(
  message: Notification<NotificationTypes>,
  method: Method
): message is Notification<NotificationTypes, Method> {
  return message.method === method;
}

export type IRequestHandler<
  RequestTypes,
  ResponseTypes extends { [M in Method]: any },
  ErrorType,
  Method extends keyof RequestTypes
> = (
  request: RequestTypes[Method]
) => Promise<ResponseData<ResponseTypes, ErrorType, Method>>;

export type RequestHandlers<
  RequestTypes,
  ResponseTypes extends { [M in keyof RequestTypes]: any },
  ErrorType
> = {
  [Method in keyof RequestTypes]: IRequestHandler<
    RequestTypes,
    ResponseTypes,
    ErrorType,
    Method
  >
};

export type IResponseHandler<
  ResponseTypes,
  ErrorType,
  Method extends keyof ResponseTypes = keyof ResponseTypes
> = (response: ResponseData<ResponseTypes, ErrorType, Method>) => void;

export interface ResponseHandlers<
  ResponseTypes = DefaultResponseTypes,
  ErrorType = DefaultErrorType
> {
  [id: number]: IResponseHandler<ResponseTypes, ErrorType>;
}

export type NotificationHandler<
  NotificationTypes,
  Method extends keyof NotificationTypes
> = (notification: NotificationTypes[Method]) => void;

export type NotificationHandlers<NotificationTypes> = {
  [Method in keyof NotificationTypes]: NotificationHandler<
    NotificationTypes,
    Method
  >
};

export function listRequestHandlerMethods<
  RequestTypes,
  ResponseTypes extends { [Method in keyof RequestTypes]: any },
  ErrorType
>(
  handlers: RequestHandlers<RequestTypes, ResponseTypes, ErrorType>
): Array<keyof RequestTypes> {
  return Object.keys(handlers) as any;
}

export function listNotificationHandlerMethods<NotificationTypes>(
  handlers: NotificationHandlers<NotificationTypes>
): Array<keyof NotificationTypes> {
  return Object.keys(handlers) as any;
}

export async function handleRequest<
  RequestTypes,
  ResponseTypes extends { [Method in keyof RequestTypes]: any },
  ErrorType
>(
  handlers: RequestHandlers<RequestTypes, ResponseTypes, ErrorType>,
  message: Request<RequestTypes>,
  thisParam?: any
): Promise<ResponseData<ResponseTypes, ErrorType>> {
  const handler = handlers[message.method];
  if (!handler) {
    throw new Error("No handler for request method " + message.method);
  }
  return handler.call(thisParam, message.params);
}

export function handleResponse<ResponseTypes, ErrorType>(
  handlers: ResponseHandlers<ResponseTypes, ErrorType>,
  message: Response<ResponseTypes, ErrorType>,
  thisParam?: any
) {
  const handler = handlers[message.id];
  if (!handler) {
    return;
  }
  return handler.call(thisParam, message);
}

export function handleNotification<NotificationTypes>(
  handlers: NotificationHandlers<NotificationTypes>,
  message: Notification<NotificationTypes>,
  thisParam?: any
) {
  const handler = handlers[message.method];
  if (!handler) {
    throw new Error("No handler for notification method " + message.method);
  }
  return handler.call(thisParam, message.data);
}
