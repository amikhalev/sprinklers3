import PromiseRouter from "express-promise-router";
import { serialize} from "serializr";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import * as schema from "@common/sprinklersRpc/schema";
import { generateDeviceToken, verifyAuthorization } from "@server/express/authentication";
import { ServerState } from "@server/state";

const DEVICE_ID_LEN = 20;

function randomDeviceId(): string {
    let deviceId = "";
    for (let i = 0; i < DEVICE_ID_LEN; i++) {
        const j = Math.floor(Math.random() * 36);
        let ch; // tslint:disable-next-line
        if (j < 10) { // 0-9
            ch = String.fromCharCode(48 + j);
        } else { // a-z
            ch = String.fromCharCode(97 + (j - 10));
        }
        deviceId += ch;
    }
    return deviceId;
}

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
        const deviceId = randomDeviceId();
        const newDevice = state.database.sprinklersDevices.create({
            name: "Sprinklers Device", deviceId,
        });
        await state.database.sprinklersDevices.save(newDevice);
        const token = await generateDeviceToken(deviceId);
        res.send({
            data: newDevice, token,
        });
    });

    router.post("/connect", verifyAuthorization({
        type: "device",
    }), async (req, res) => {
        res.send({
            url: state.mqttUrl,
        });
    });

    return router;
}
