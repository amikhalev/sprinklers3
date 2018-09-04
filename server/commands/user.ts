import { flags } from "@oclif/command";
import { ux } from "cli-ux";
import { capitalize } from "lodash";
import { FindConditions } from "typeorm";

import ManageCommand from "../ManageCommand";

import { Input } from "@oclif/parser/lib/flags";
import { User } from "@server/entities";

type UserFlags = (typeof UserCommand)["flags"] extends Input<infer F>
  ? F
  : never;

type Action = "create" | "update" | "delete";

export default class UserCommand extends ManageCommand {
  static description = "Manage users";

  static flags = {
    create: flags.boolean({
      char: "c",
      exclusive: ["update", "delete", "id"],
      dependsOn: ["username"],
      description: "Create a new user"
    }),
    update: flags.boolean({
      char: "u",
      exclusive: ["create", "delete"],
      description: "Update an existing user (by --id or --username)"
    }),
    delete: flags.boolean({
      char: "d",
      exclusive: ["create", "update"],
      description: "Delete a user (by --id or --username)"
    }),
    id: flags.integer({
      description: "The id of the user to update or delete",
    }),
    username: flags.string({
      description: "The username of the user to create or update"
    }),
    name: flags.string({
      description: "The name of the user, when creating or updating"
    }),
    passwordPrompt: flags.boolean({
      char: "p",
      description:
        "Prompts for the password of the user when creating or updating"
    })
  };

  getAction(flags: UserFlags): Action {
    if (flags.create) return "create";
    else if (flags.update) return "update";
    else if (flags.delete) return "delete";
    else {
      this.error("Must specify an action (--create, --update, --delete)", {
        exit: false
      });
      return this._help();
    }
  }

  getFindConditions(flags: UserFlags, action: Action): FindConditions<User> {
    if (flags.id != null) {
      return { id: flags.id };
    } else if (flags.username) {
      return { username: flags.username };
    } else {
      this.error(`Must specify either --id or --username to ${action}`, {
        exit: false
      });
      return this._help();
    }
  }

  async getOrDeleteUser(flags: UserFlags, action: Action): Promise<User | never> {
    if (action === "create") {
      return this.database.users.create();
    } else {
      const findConditions = this.getFindConditions(flags, action);
      if (action === "delete") {
        this.log("findConditions: ", findConditions)
        const result = await this.database.users.delete(findConditions);
        this.log(`Deleted user: `, result);
        return this.exit();
      } else {
        const user = await this.database.users.findOneUser(findConditions);
        if (!user) {
          return this.error(`The specified user does not exist`);
        }
        return user;
      }
    }
  }

  async run() {
    const parseResult = this.parse(UserCommand);

    const flags = parseResult.flags;
    const action = this.getAction(flags);

    await this.connect();

    const user = await this.getOrDeleteUser(flags, action);

    if (flags.id != null && flags.username) {
      user.username = flags.username;
    }
    if (flags.name) {
      user.name = flags.name;
    }
    if (flags.passwordPrompt || flags.create) {
      const password = await ux.prompt("Enter a password to assign the user", {
        type: "hide"
      });
      await user.setPassword(password);
    }

    try {
      await this.database.users.save(user);
      this.log(`${capitalize(action)}d user id ${user.id} (${user.username})`);
    } catch (e) {
      console.log(e)
      throw e;
    }
  }
}
