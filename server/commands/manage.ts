import Command from "@oclif/command";

import { createApp, ServerState, WebSocketApi } from "../";

import log from "@common/logger";

export default class ManageCommand extends Command {
  run(): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
