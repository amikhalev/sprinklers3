import { ErrorCode } from "@common/ErrorCode";
import { IError } from "./websocketData";

export class RpcError extends Error implements IError {
  name = "RpcError";
  code: number;
  data: any;

  constructor(
    message: string,
    code: number = ErrorCode.BadRequest,
    data: any = {}
  ) {
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
