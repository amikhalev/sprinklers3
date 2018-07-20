export enum ErrorCode {
    BadRequest = 100,
    NotSpecified = 101,
    Parse = 102,
    Range = 103,
    InvalidData = 104,
    BadToken = 105,
    Unauthorized = 106,
    NoPermission = 107,
    NotImplemented = 108,
    NotFound = 109,
    Internal = 200,
    Timeout = 300,
    ServerDisconnected = 301,
    BrokerDisconnected = 302,
}

export function toHttpStatus(errorCode: ErrorCode): number {
    switch (errorCode) {
        case ErrorCode.BadRequest:
        case ErrorCode.NotSpecified:
        case ErrorCode.Parse:
        case ErrorCode.Range:
        case ErrorCode.InvalidData:
            return 400; // Bad request
        case ErrorCode.Unauthorized:
        case ErrorCode.BadToken:
            return 401; // Unauthorized
        case ErrorCode.NoPermission:
            return 403; // Forbidden
        case ErrorCode.NotFound:
            return 404;
        case ErrorCode.NotImplemented:
            return 501;
        case ErrorCode.Internal:
        case ErrorCode.ServerDisconnected:
        case ErrorCode.BrokerDisconnected:
        default:
            return 500;
    }
}
