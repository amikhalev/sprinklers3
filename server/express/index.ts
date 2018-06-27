import * as bodyParser from "body-parser";
import * as express from "express";
import { serialize, serializeAll } from "serializr";

import * as schema from "@common/sprinklers/schema";
import { ServerState } from "../state";
import logger from "./logger";
import serveApp from "./serveApp";

import log from "@common/logger";

import { User } from "../models/User";

export function createApp(state: ServerState) {
    const app = express();

    app.use(logger);
    app.use(bodyParser.json());

    app.get("/api/grinklers", (req, res) => {
        const j = serialize(schema.sprinklersDevice, state.device);
        res.send(j);
    });

    app.get("/api/users", (req, res) => {
        User.loadAll(state.database)
            .then((users) => {
                res.json({
                    data: users,
                });
            });
    });

    app.get("/api/users/:username", (req, res, next) => {
        User.loadByUsername(state.database, req.params.username)
            .then((user) => {
                res.json({
                    data: user,
                });
            })
            .catch(next);
    });

    app.post("/api/authenticate", (req, res, next) => {
        const body = req.body;
        log.info({body}, "/api/authenticate: " + req.body);
        if (!body || !body.username || !body.password) {
            return next(new Error("must specify username and password"));
        }
        User.loadByUsername(state.database, body.username)
            .then((user) => {
                if (!user) {
                    throw new Error("user does not exist");
                }
                return user.comparePassword(body.password);
            }).then((passwordMatches) => {
                res.json({
                    passwordMatches,
                });
            }).catch(next);
    });

    serveApp(app);

    return app;
}
