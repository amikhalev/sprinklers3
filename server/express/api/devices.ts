import PromiseRouter from "express-promise-router";
import { serialize} from "serializr";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import * as schema from "@common/sprinklersRpc/schema";
import { AccessToken } from "@common/TokenClaims";
import { verifyAuthorization } from "@server/express/authentication";
import { ServerState } from "@server/state";

export function devices(state: ServerState) {
    const router = PromiseRouter();

    router.get("/:deviceId", verifyAuthorization(), async (req, res) => {
        const token = req.token!;
        const userId = token.aud;
        const deviceId = req.params.deviceId;
        const userDevice = await state.database.sprinklersDevices
            .findUserDevice(userId, deviceId);
        if (!userDevice)  {
            throw new ApiError("User does not have access to the specified device", ErrorCode.NoPermission);
        }
        const device = state.mqttClient.getDevice(req.params.deviceId);
        const j = serialize(schema.sprinklersDevice, device);
        res.send(j);
    });

    router.post("/register", verifyAuthorization({
        type: "device_reg",
    }), async (req, res) => {
        
    });

    return router;
}
