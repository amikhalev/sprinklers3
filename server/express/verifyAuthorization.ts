import * as Express from "express";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import * as tok from "@common/TokenClaims";
import { verifyToken } from "@server/authentication";

declare global {
  namespace Express {
    interface Request {
      token?: tok.AccessToken;
    }
  }
}

export interface VerifyAuthorizationOpts {
  type: tok.TokenClaims["type"];
}

export function verifyAuthorization(
  options?: Partial<VerifyAuthorizationOpts>
): Express.RequestHandler {
  const opts: VerifyAuthorizationOpts = {
    type: "access",
    ...options
  };
  return (req, res, next) => {
    const fun = async () => {
      const bearer = req.headers.authorization;
      if (!bearer) {
        throw new ApiError(
          "No Authorization header specified",
          ErrorCode.BadToken
        );
      }
      const matches = /^Bearer (.*)$/.exec(bearer);
      if (!matches || !matches[1]) {
        throw new ApiError(
          "Invalid Authorization header, must be Bearer",
          ErrorCode.BadToken
        );
      }
      const token = matches[1];

      req.token = (await verifyToken(token, opts.type)) as any;
    };
    fun().then(() => next(null), err => next(err));
  };
}
