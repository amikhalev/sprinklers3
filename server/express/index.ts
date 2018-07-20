import * as bodyParser from "body-parser";
import * as express from "express";
import { serialize} from "serializr";

import * as schema from "@common/sprinklersRpc/schema";
import { ServerState } from "../state";
import requestLogger from "./requestLogger";
import serveApp from "./serveApp";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import { authentication } from "./authentication";
import errorHandler from "./errorHandler";

export function createApp(state: ServerState) {
    const app = express();

    app.use(requestLogger);
    app.use(bodyParser.json());

    app.get("/api/devices/:deviceId", (req, res) => {
        // TODO: authorize device
        const device = state.mqttClient.getDevice(req.params.deviceId);
        const j = serialize(schema.sprinklersDevice, device);
        res.send(j);
    });

    app.get("/api/users", (req, res) => {
        state.database.users.find()
            .then((users) => {
                res.json({
                    data: users,
                });
            });
    });

    app.get("/api/users/:username", (req, res, next) => {
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

    app.use("/api", authentication(state));

    serveApp(app);

    app.use(errorHandler);

    return app;
}
