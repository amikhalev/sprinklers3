import * as express from "express";

import ApiError from "@common/ApiError";

const errorHandler: express.ErrorRequestHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toJSON());
  } else {
    next(err);
  }
};

export default errorHandler;
