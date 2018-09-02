import { ErrorCode, toHttpStatus } from "@common/ErrorCode";

export default class ApiError extends Error {
  name = "ApiError";
  statusCode: number;
  code: ErrorCode;
  data: any;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.BadRequest,
    data: any = {}
  ) {
    super(message);
    this.statusCode = toHttpStatus(code);
    this.code = code;
    // tslint:disable-next-line:prefer-conditional-expression
    if (data instanceof Error) {
      this.data = data.toString();
    } else {
      this.data = data;
    }
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      data: this.data
    };
  }
}
