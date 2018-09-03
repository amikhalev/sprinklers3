import { Command } from "@oclif/command";
import * as http from "http";
import * as WebSocket from "ws";

import { createApp, ServerState, WebSocketApi } from "../";

import log from "@common/logger";

export default class ServeCommand extends Command {
  static description = "Serves the sprinklers3 backend";

  async run(): Promise<any> {
    const state = new ServerState();
    const app = createApp(state);
    const webSocketApi = new WebSocketApi(state);

    const port = +(process.env.PORT || 8080);
    const host = process.env.HOST || "0.0.0.0";

    const server = new http.Server(app);
    const webSocketServer = new WebSocket.Server({ server });
    webSocketApi.listen(webSocketServer);

    try {
      await state.start();
      server.listen(port, host, () => {
        log.info(`listening at ${host}:${port}`);
      });
    } catch (err) {
      log.error({ err }, "error starting server");
    }
  }
}
