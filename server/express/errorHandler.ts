import * as express from "express";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";

const isDev = process.env.NODE_ENV === "development";

const errorHandler: express.ErrorRequestHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (err instanceof ApiError) {
    // TODO: different content-type?
    res.status(err.statusCode).json(err.toJSON(isDev));
  } else if (err) {
    const internalError = new ApiError(
      "An internal server error has occurred",
      ErrorCode.Internal,
      err.stack ? err.stack : err
    );
    errorHandler(internalError, req, res, next);
  }
  next();
};

export default errorHandler;
