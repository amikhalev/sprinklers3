import PromiseRouter from "express-promise-router";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import { DEVICE_PREFIX } from "@common/sprinklersRpc/mqtt";
import { DeviceToken, SuperuserToken } from "@common/TokenClaims";
import { verifyToken } from "@server/express/authentication";
import { ServerState } from "@server/state";

export const SUPERUSER = "sprinklers3";

export function mosquitto(state: ServerState) {
    const router = PromiseRouter();

    router.post("/auth", async (req, res) => {
        const body = req.body;
        const { username, password, topic, acc } = body;
        if (typeof username !== "string" || typeof password !== "string") {
            throw new ApiError("Must specify a username and password", ErrorCode.BadRequest);
        }
        if (username === SUPERUSER) {
            await verifyToken<SuperuserToken>(password, "superuser");
            return res.status(200).send({ username });
        }
        const claims = await verifyToken<DeviceToken>(password, "device");
        if (claims.aud !== username) {
            throw new ApiError("Username does not match token", ErrorCode.BadRequest);
        }
        res.status(200).send({
            username, id: claims.id,
        });
    });

    router.post("/superuser", async (req, res) => {
        const { username } = req.body;
        if (typeof username !== "string") {
            throw new ApiError("Must specify a username", ErrorCode.BadRequest);
        }
        if (username !== SUPERUSER) {
            return res.status(403).send();
        }
        res.status(200).send();
    });

    router.post("/acl", async (req, res) => {
        const { username, topic, clientid, acc } = req.body;
        if (typeof username !== "string" || typeof topic !== "string") {
            throw new ApiError("username and topic must be specified as strings", ErrorCode.BadRequest);
        }
        const prefix = DEVICE_PREFIX + "/" + username;
        if (!topic.startsWith(prefix)) {
            throw new ApiError(`device ${username} cannot access topic ${topic}`);
        }
        res.status(200).send();
    });

    return router;
}
