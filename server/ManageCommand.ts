import Command from "@oclif/command";

import { Database, ServerState } from ".";

export default abstract class ManageCommand extends Command {
  state!: ServerState;
  database!: Database;

  async connect() {
    this.state = new ServerState();
    await this.state.startDatabase();
    this.database = this.state.database;
  }

  async finally(e: Error | undefined) {
    if (this.state) {
      await this.state.stopDatabase();
    }
    await super.finally(e);
  }
}
