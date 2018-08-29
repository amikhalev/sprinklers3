import PromiseRouter from "express-promise-router";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import { ServerState } from "@server/state";

import { devices } from "./devices";
import { mosquitto } from "./mosquitto";
import { token } from "./token";
import { users } from "./users";

export default function createApi(state: ServerState) {
    const router = PromiseRouter();

    router.use("/devices", devices(state));
    router.use("/users", users(state));
    router.use("/mosquitto", mosquitto(state));
    router.use("/token", token(state));

    router.use("*", (req, res) => {
        throw new ApiError("API endpoint not found", ErrorCode.NotFound);
    });

    return router;
}
