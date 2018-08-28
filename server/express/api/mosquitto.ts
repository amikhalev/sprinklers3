import PromiseRouter from "express-promise-router";

import { ServerState } from "@server/state";

export function mosquitto(state: ServerState) {
    const router = PromiseRouter();

    router.post("/auth", async (req, res) => {
        res.status(200).send();
    });

    router.post("/superuser", async (req, res) => {
        res.status(200).send();
    });

    router.post("/acl", async (req, res) => {
        res.status(200).send();
    });

    return router;
}
