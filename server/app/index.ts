import * as express from "express";

import * as schema from "@common/sprinklers/schema";
import {serialize} from "serializr";
import {state} from "../state";
import logger from "./logger";
import serveApp from "./serveApp";

const app = express();

app.use(logger);

app.get("/api/grinklers", (req, res) => {
    const j = serialize(schema.sprinklersDevice, state.device);
    res.send(j);
});

serveApp(app);

export default app;
