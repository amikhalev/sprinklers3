import * as path from "path";
import { Connection, createConnection, getConnectionOptions } from "typeorm";

import logger from "@common/logger";

import { SprinklersDevice, User } from "./entities";
import { SprinklersDeviceRepository, UserRepository } from "./repositories/";

export class Database {
  users!: UserRepository;
  sprinklersDevices!: SprinklersDeviceRepository;

  private _conn: Connection | null = null;

  get conn(): Connection {
    if (this._conn == null) {
      throw new Error("Not connected to rethinkDB");
    }
    return this._conn;
  }

  async connect() {
    const options = await getConnectionOptions();
    Object.assign(options, {
      entities: [path.resolve(__dirname, "entities", "*.js")]
    });
    if (options.synchronize) {
      logger.warn("synchronizing database schema");
    }
    this._conn = await createConnection(options);
    this.users = this._conn.getCustomRepository(UserRepository);
    this.sprinklersDevices = this._conn.getCustomRepository(
      SprinklersDeviceRepository
    );
    logger.info("connected to database");
  }

  async disconnect() {
    if (this._conn) {
      await this._conn.close();
      logger.info("disconnected from database");
    }
  }

  async insertTestData() {
    const NUM = 100;
    const users: User[] = [];
    for (let i = 0; i < NUM; i++) {
      const username = "alex" + i % 50;
      let user = await this.users.findByUsername(username);
      // if (!user) {
        user = await this.users.create({
          name: "Alex Mikhalev" + i,
          username
        });
      // }
      await user.setPassword("kakashka" + i);
      users.push(user);
    }

    const devices: SprinklersDevice[] = [];

    for (let i = 0; i < NUM; i++) {
      const name = "Test" + i;
      let device = await this.sprinklersDevices.findByName(name);
      if (!device) {
        device = await this.sprinklersDevices.create();
      }
      Object.assign(device, {
        name,
        deviceId: "grinklers" + (i === 1 ? "" : i)
      });
      devices.push(device);
      for (let j = 0; j < 5; j++) {
        const userIdx = (i + j * 10) % NUM;
        const user = users[userIdx];
        user.devices = (user.devices || []).concat([device]);
      }
    }
    await this.sprinklersDevices.save(devices);
    logger.info("inserted/updated devices");

    await this.users.save(users);
    logger.info("inserted/updated users");

    const alex2 = await this.users.findOne({ username: "alex0" });
    logger.info(
      "password valid: " + (await alex2!.comparePassword("kakashka0"))
    );
  }
}
