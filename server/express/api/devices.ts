import { Request } from "express";
import PromiseRouter from "express-promise-router";
import { serialize } from "serializr";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import * as schema from "@common/sprinklersRpc/schema";
import { DeviceToken } from "@common/TokenClaims";
import { generateDeviceToken } from "@server/authentication";
import { SprinklersDevice } from "@server/entities";
import { verifyAuthorization } from "@server/express/verifyAuthorization";
import { ServerState } from "@server/state";

const DEVICE_ID_LEN = 20;

function randomDeviceId(): string {
  let deviceId = "";
  for (let i = 0; i < DEVICE_ID_LEN; i++) {
    const j = Math.floor(Math.random() * 36);
    let ch; // tslint:disable-next-line
    if (j < 10) {
      // 0-9
      ch = String.fromCharCode(48 + j);
    } else {
      // a-z
      ch = String.fromCharCode(97 + (j - 10));
    }
    deviceId += ch;
  }
  return deviceId;
}

export function devices(state: ServerState) {
  const router = PromiseRouter();

  async function verifyUserDevice(req: Request): Promise<SprinklersDevice> {
    const token = req.token!;
    const userId = token.aud;
    const deviceId = req.params.deviceId;
    const userDevice = await state.database.sprinklersDevices.findUserDevice(
      userId,
      deviceId
    );
    if (!userDevice) {
      throw new ApiError(
        "User does not have access to the specified device",
        ErrorCode.NoPermission
      );
    }
    return userDevice;
  }

  router.get("/:deviceId", verifyAuthorization(), async (req, res) => {
    const deviceInfo = await verifyUserDevice(req);
    res.send({
      id: deviceInfo.id, deviceId: deviceInfo.deviceId, name: deviceInfo.name
    })
  });

  router.get("/:deviceId/data", verifyAuthorization(), async (req, res) => {
    await verifyUserDevice(req);
    const device = state.mqttClient.acquireDevice(req.params.deviceId);
    const j = serialize(schema.sprinklersDevice, device);
    res.send(j);
    device.release();
  });

  router.post("/:deviceId/generate_token",
    verifyAuthorization(), async (req, res) => {
      const device = await verifyUserDevice(req);
      if (!device.deviceId) {
        throw new ApiError(
          "A token cannot be granted for a device with no id",
          ErrorCode.BadRequest,
        )
      }
      const token = await generateDeviceToken(device.id, device.deviceId);
      res.send({
        token,
      });
    });

  router.post(
    "/register",
    verifyAuthorization({
      type: "device_reg"
    }),
    async (req, res) => {
      const deviceId = randomDeviceId();
      const newDevice = state.database.sprinklersDevices.create({
        name: "Sprinklers Device",
        deviceId
      });
      await state.database.sprinklersDevices.save(newDevice);
      const token = await generateDeviceToken(newDevice.id, deviceId);
      res.send({
        data: newDevice,
        token
      });
    }
  );

  router.post(
    "/connect",
    verifyAuthorization({
      type: "device"
    }),
    async (req, res) => {
      const token: DeviceToken = req.token! as any;
      const deviceId = token.aud;
      const clientId  = `device-${deviceId}`;
      res.send({
        mqttUrl: state.mqttUrl,
        deviceId,
        clientId,
      });
    }
  );

  return router;
}
