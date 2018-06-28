export class ApiError extends Error {
    name = "ApiError";
    statusCode: number;
    cause?: Error;

    constructor(statusCode: number, message: string, cause?: Error) {
        super(message);
        this.statusCode = statusCode;
        this.cause = cause;
    }
}
