import PromiseRouter from "express-promise-router";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import { User } from "@server/entities";
import { verifyAuthorization } from "@server/express/authentication";
import { ServerState } from "@server/state";

export function users(state: ServerState) {
    const router = PromiseRouter();

    router.use(verifyAuthorization());

    async function getUser(params: { username: string }): Promise<User> {
        const { username } = params;
        const user = await state.database.users
            .findByUsername(username, { devices: true });
        if (!user) {
            throw new ApiError(`user ${username} does not exist`, ErrorCode.NotFound);
        }
        return user;
    }

    router.get("/", (req, res) => {
        state.database.users.findAll()
            .then((users) => {
                res.json({
                    data: users,
                });
            });
    });

    router.get("/:username", async (req, res) => {
        const user = await getUser(req.params);
        res.json({
            data: user,
        });
    });

    router.get("/:username/devices", async (req, res) => {
        const user = await getUser(req.params);
        res.json({
            data: user.devices,
        });
    });

    return router;
}
