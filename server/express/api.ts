import PromiseRouter from "express-promise-router";
import { serialize} from "serializr";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import * as schema from "@common/sprinklersRpc/schema";
import { ServerState } from "../state";
import { authentication, verifyAuthorization } from "./authentication";

export default function createApi(state: ServerState) {
    const router = PromiseRouter();

    router.get("/devices/:deviceId", verifyAuthorization(), (req, res) => {
        // TODO: authorize device
        const device = state.mqttClient.getDevice(req.params.deviceId);
        const j = serialize(schema.sprinklersDevice, device);
        res.send(j);
    });

    // router.post("/devices/register", verifyAuthorization({
    //     type: "device_reg",
    // }), (req, res) => {
    //     res.json({ data: "device registered" });
    // });

    router.get("/users", verifyAuthorization(), (req, res) => {
        state.database.users.find()
            .then((users) => {
                res.json({
                    data: users,
                });
            });
    });

    router.get("/api/users/:username", (req, res, next) => {
        const { username } = req.params;
        state.database.users.findByUsername(username)
            .then((user) => {
                if (!user) {
                    throw new ApiError(`user ${username} does not exist`, ErrorCode.NotFound);
                }
                res.json({
                    data: user,
                });
            })
            .catch(next);
    });

    router.use("/", authentication(state));

    return router;
}
