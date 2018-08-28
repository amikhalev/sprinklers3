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
import { AccessToken, DeviceRegistrationToken, DeviceToken, RefreshToken, TokenClaims, SuperuserToken } from "@common/TokenClaims";
import { User } from "../entities";
import { ServerState } from "../state";

declare global {
    namespace Express {
        interface Request {
            token?: AccessToken;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
    throw new Error("Must specify JWT_SECRET environment variable");
}

const ISSUER = "sprinklers3";

const ACCESS_TOKEN_LIFETIME = (30 * 60); // 30 minutes
const REFRESH_TOKEN_LIFETIME = (24 * 60 * 60); // 24 hours

/**
 * @param {number} lifetime in seconds
 */
function getExpTime(lifetime: number) {
    return Math.floor(Date.now() / 1000) + lifetime;
}

function signToken(claims: TokenClaims): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(claims, JWT_SECRET, (err: Error, encoded: string) => {
            if (err) {
                reject(err);
            } else {
                resolve(encoded);
            }
        });
    });
}

export function verifyToken<TClaims extends TokenClaims = TokenClaims>(
    token: string, type?: TClaims["type"],
): Promise<TClaims> {
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
                const claims: TokenClaims = decoded as any;
                if (type != null && claims.type !== type) {
                    reject(new ApiError(`Expected a "${type}" token, received a "${claims.type}" token`,
                        ErrorCode.BadToken));
                }
                resolve(claims as TClaims);
            }
        });
    });
}

function generateAccessToken(user: User, secret: string): Promise<string> {
    const access_token_claims: AccessToken = {
        iss: ISSUER,
        aud: user.id,
        name: user.name,
        type: "access",
        exp: getExpTime(ACCESS_TOKEN_LIFETIME),
    };

    return signToken(access_token_claims);
}

function generateRefreshToken(user: User, secret: string): Promise<string> {
    const refresh_token_claims: RefreshToken = {
        iss: ISSUER,
        aud: user.id,
        name: user.name,
        type: "refresh",
        exp: getExpTime(REFRESH_TOKEN_LIFETIME),
    };

    return signToken(refresh_token_claims);
}

function generateDeviceRegistrationToken(secret: string): Promise<string> {
    const device_reg_token_claims: DeviceRegistrationToken = {
        iss: ISSUER,
        type: "device_reg",
    };
    return signToken(device_reg_token_claims);
}

export function generateDeviceToken(id: number, deviceId: string): Promise<string> {
    const device_token_claims: DeviceToken = {
        iss: ISSUER,
        type: "device",
        aud: deviceId,
        id,
    };
    return signToken(device_token_claims);
}

export function generateSuperuserToken(): Promise<string> {
    const superuser_claims: SuperuserToken = {
        iss: ISSUER,
        type: "superuser",
    };
    return signToken(superuser_claims);
}

export function authentication(state: ServerState) {

    const router = Router();

    async function passwordGrant(body: TokenGrantPasswordRequest, res: Express.Response): Promise<User> {
        const { username, password } = body;
        if (!body || !username || !password) {
            throw new ApiError("Must specify username and password");
        }
        const user = await state.database.users.findByUsername(username);
        if (!user) {
            throw new ApiError("User does not exist");
        }
        const passwordMatches = await user.comparePassword(password);
        if (passwordMatches) {
            return user;
        } else {
            throw new ApiError("Invalid user credentials");
        }
    }

    async function refreshGrant(body: TokenGrantRefreshRequest, res: Express.Response): Promise<User> {
        const { refresh_token } = body;
        if (!body || !refresh_token) {
            throw new ApiError("Must specify a refresh_token", ErrorCode.BadToken);
        }
        const claims = await verifyToken(refresh_token);
        if (claims.type !== "refresh") {
            throw new ApiError("Not a refresh token", ErrorCode.BadToken);
        }
        const user = await state.database.users.findOne(claims.aud);
        if (!user) {
            throw new ApiError("User no longer exists", ErrorCode.BadToken);
        }
        return user;
    }

    router.post("/grant", async (req, res) => {
        const body: TokenGrantRequest = req.body;
        let user: User;
        if (body.grant_type === "password") {
            user = await passwordGrant(body, res);
        } else if (body.grant_type === "refresh") {
            user = await refreshGrant(body, res);
        } else {
            throw new ApiError("Invalid grant_type");
        }
        const [access_token, refresh_token] = await Promise.all(
            [await generateAccessToken(user, JWT_SECRET),
            await generateRefreshToken(user, JWT_SECRET)]);
        const response: TokenGrantResponse = {
            access_token, refresh_token,
        };
        res.json(response);
    });

    router.post("/grant_device_reg", verifyAuthorization(), async (req, res) => {
        const token = await generateDeviceRegistrationToken(JWT_SECRET);
        res.json({ token });
    });

    router.post("/verify", verifyAuthorization(), async (req, res) => {
        res.json({
            ok: true,
            token: req.token,
        });
    });

    return router;
}

export interface VerifyAuthorizationOpts {
    type: TokenClaims["type"];
}

export function verifyAuthorization(options?: Partial<VerifyAuthorizationOpts>): Express.RequestHandler {
    const opts: VerifyAuthorizationOpts = {
        type: "access",
        ...options,
    };
    return (req, res, next) => {
        const fun = async () => {
            const bearer = req.headers.authorization;
            if (!bearer) {
                throw new ApiError("No Authorization header specified", ErrorCode.BadToken);
            }
            const matches = /^Bearer (.*)$/.exec(bearer);
            if (!matches || !matches[1]) {
                throw new ApiError("Invalid Authorization header, must be Bearer", ErrorCode.BadToken);
            }
            const token = matches[1];

            req.token = await verifyToken(token, opts.type) as any;
        };
        fun().then(() => next(null), (err) => next(err));
    };
}
