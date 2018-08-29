import * as Express from "express";
import Router from "express-promise-router";
import * as jwt from "jsonwebtoken";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import {
    TokenGrantPasswordRequest,
    TokenGrantRefreshRequest,
    TokenGrantRequest,
    TokenGrantResponse,
} from "@common/httpApi";
import * as tok from "@common/TokenClaims";
import { User } from "@server/entities";
import { ServerState } from "@server/state";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
    throw new Error("Must specify JWT_SECRET environment variable");
}

const ISSUER = "sprinklers3";

const ACCESS_TOKEN_LIFETIME = (30 * 60); // 30 minutes
const REFRESH_TOKEN_LIFETIME = (24 * 60 * 60); // 24 hours

function signToken(claims: tok.TokenClaimTypes, opts?: jwt.SignOptions): Promise<string> {
    const options: jwt.SignOptions = {
        issuer: ISSUER,
        ...opts,
    };
    return new Promise((resolve, reject) => {
        jwt.sign(claims, JWT_SECRET, options, (err: Error, encoded: string) => {
            if (err) {
                reject(err);
            } else {
                resolve(encoded);
            }
        });
    });
}

export function verifyToken<TClaims extends tok.TokenClaimTypes = tok.TokenClaimTypes>(
    token: string, type?: TClaims["type"],
): Promise<TClaims & tok.BaseClaims> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SECRET, {
            issuer: ISSUER,
        }, (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    reject(new ApiError("The specified token is expired", ErrorCode.BadToken, err));
                } else if (err.name === "JsonWebTokenError") {
                    reject(new ApiError("Invalid token", ErrorCode.BadToken, err));
                } else {
                    reject(err);
                }
            } else {
                const claims: tok.TokenClaims = decoded as any;
                if (type != null && claims.type !== type) {
                    reject(new ApiError(`Expected a "${type}" token, received a "${claims.type}" token`,
                        ErrorCode.BadToken));
                }
                resolve(claims as TClaims & tok.BaseClaims);
            }
        });
    });
}

export function generateAccessToken(user: User): Promise<string> {
    const access_token_claims: tok.AccessToken = {
        aud: user.id,
        name: user.name,
        type: "access",
    };

    return signToken(access_token_claims, { expiresIn: ACCESS_TOKEN_LIFETIME });
}

export function generateRefreshToken(user: User): Promise<string> {
    const refresh_token_claims: tok.RefreshToken = {
        aud: user.id,
        name: user.name,
        type: "refresh",
    };

    return signToken(refresh_token_claims, { expiresIn: REFRESH_TOKEN_LIFETIME });
}

export function generateDeviceRegistrationToken(): Promise<string> {
    const device_reg_token_claims: tok.DeviceRegistrationToken = {
        type: "device_reg",
    };
    return signToken(device_reg_token_claims);
}

export function generateDeviceToken(id: number, deviceId: string): Promise<string> {
    const device_token_claims: tok.DeviceToken = {
        type: "device",
        aud: deviceId,
        id,
    };
    return signToken(device_token_claims);
}

export function generateSuperuserToken(): Promise<string> {
    const superuser_claims: tok.SuperuserToken = {
        type: "superuser",
    };
    return signToken(superuser_claims);
}
