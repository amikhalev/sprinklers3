import { Server } from "http";
import app from "./app";

const server = new Server(app);

const port = +(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
    console.log(`listening at ${host}:${port}`);
});
