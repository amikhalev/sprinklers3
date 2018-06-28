import log from "@common/logger";
import * as Express from "express";
import Router from "express-promise-router";
import * as jwt from "jsonwebtoken";
import { User } from "../models/User";
import { ServerState } from "../state";
import { ApiError } from "./errors";

const ACCESS_TOKEN_LIFETIME = (30 * 60); // 30 minutes
const REFRESH_TOKEN_LIFETIME = (24 * 60 * 60); // 24 hours

/**
 * @param {number} lifetime in seconds
 */
function getExpTime(lifetime: number) {
    return Math.floor(Date.now() / 1000) + lifetime;
}

interface TokenClaims {
    iss: string;
    type: "access" | "refresh";
    aud: string;
    name: string;
    exp: number;
}

function signToken(claims: TokenClaims, secret: string): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(claims, secret, (err: Error, encoded: string) => {
            if (err) {
                reject(err);
            } else {
                resolve(encoded);
            }
        });
    });
}

function verifyToken(token: string, secret: string): Promise<TokenClaims> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    reject(new ApiError(401, "The specified token is expired", err));
                } else if (err.name === "JsonWebTokenError") {
                    reject(new ApiError(400, "Invalid token", err));
                } else {
                    reject(err);
                }
            } else {
                resolve(decoded as any);
            }
        });
    });
}

function generateAccessToken(user: User, secret: string): Promise<string> {
    const access_token_claims: TokenClaims = {
        iss: "sprinklers3",
        aud: user.id || "",
        name: user.name,
        type: "access",
        exp: getExpTime(ACCESS_TOKEN_LIFETIME),
    };

    return signToken(access_token_claims, secret);
}

function generateRefreshToken(user: User, secret: string): Promise<string> {
    const refresh_token_claims: TokenClaims = {
        iss: "sprinklers3",
        aud: user.id || "",
        name: user.name,
        type: "refresh",
        exp: getExpTime(REFRESH_TOKEN_LIFETIME),
    };

    return signToken(refresh_token_claims, secret);
}

export function authentication(state: ServerState) {
    const JWT_SECRET = process.env.JWT_SECRET!;
    if (!JWT_SECRET) {
        throw new Error("Must specify JWT_SECRET environment variable");
    }

    const router = Router();

    async function passwordGrant(req: Express.Request, res: Express.Response) {
        const { body } = req;
        const { username, password } = body;
        if (!body || !username || !password) {
            throw new ApiError(400, "Must specify username and password");
        }
        const user = await User.loadByUsername(state.database, username);
        if (!user) {
            throw new ApiError(401, "User does not exist");
        }
        const passwordMatches = user.comparePassword(password);
        if (passwordMatches) {
            const [access_token, refresh_token] = await Promise.all(
                [await generateAccessToken(user, JWT_SECRET),
                    await generateRefreshToken(user, JWT_SECRET)]);
            res.json({
                access_token, refresh_token,
            });
        } else {
            res.status(400)
                .json({
                    message: "incorrect login",
                });
        }
    }

    async function refreshGrant(req: Express.Request, res: Express.Response) {
        const { body } = req;
        const { refresh_token } = body;
        if (!body || !refresh_token) {
            throw new ApiError(400, "Must specify a refresh_token");
        }
        const claims = await verifyToken(refresh_token, JWT_SECRET);
        if (claims.type !== "refresh") {
            throw new ApiError(400, "Not a refresh token");
        }
        const user = await User.load(state.database, claims.aud);
        if (!user) {
            throw new ApiError(400, "User does not exist");
        }
        const [access_token, new_refresh_token] = await Promise.all(
            [await generateAccessToken(user, JWT_SECRET),
                await generateRefreshToken(user, JWT_SECRET)]);
        res.json({
            access_token, refresh_token: new_refresh_token,
        });
    }

    router.post("/token/grant", async (req, res) => {
        const { body } = req;
        const { grant_type } = body;
        if (grant_type === "password") {
            await passwordGrant(req, res);
        } else if (grant_type === "refresh") {
            await refreshGrant(req, res);
        } else {
            throw new ApiError(400, "Invalid grant_type");
        }
    });

    router.post("/token/verify", async (req, res) => {
        const bearer = req.headers.authorization;
        if (!bearer) {
            throw new ApiError(401, "No bearer token specified");
        }
        const matches = /^Bearer (.*)$/.exec(bearer);
        if (!matches || !matches[1]) {
            throw new ApiError(400, "Invalid bearer token specified");
        }
        const token = matches[1];

        log.info({ token });

        const decoded = await verifyToken(token, JWT_SECRET);
        res.json({
            ok: true,
            decoded,
        });
    });

    return router;
}
