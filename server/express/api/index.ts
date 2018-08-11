import PromiseRouter from "express-promise-router";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import { authentication } from "@server/express/authentication";
import { ServerState } from "@server/state";
import { devices } from "./devices";
import { users } from "./users";

export default function createApi(state: ServerState) {
    const router = PromiseRouter();

    router.use("/devices", devices(state));
    router.use("/users", users(state));
    router.use("/token", authentication(state));

    router.use("*", (req, res) => {
        throw new ApiError("API endpoint not found", ErrorCode.NotFound);
    });

    return router;
}
