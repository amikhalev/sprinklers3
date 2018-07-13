import * as r from "rethinkdb";

import logger from "@common/logger";
import { SprinklersDevice, UserSprinklersDevice } from "./SprinklersDevice";
import { User } from "./User";

export class Database {
    static readonly databaseName = "sprinklers3";

    db: r.Db;
    private _conn: r.Connection | null = null;

    get conn(): r.Connection {
        if (this._conn == null) {
            throw new Error("Not connected to rethinkDB");
        }
        return this._conn;
    }

    constructor() {
        this.db = r.db(Database.databaseName);
    }

    async connect() {
        this._conn = await r.connect("localhost");
    }

    async disconnect() {
        if (this._conn) {
            return this._conn.close();
        }
    }

    async createAll() {
        const dbs = await r.dbList().run(this.conn);
        if (dbs.indexOf(Database.databaseName) === -1) {
            await r.dbCreate(Database.databaseName).run(this.conn);
        }
        await this.createTables();
    }

    async createTables() {
        const tables = await this.db.tableList().run(this.conn);
        if (tables.indexOf(User.tableName) === -1) {
            await User.createTable(this);
        }
        if (tables.indexOf(SprinklersDevice.tableName) === -1) {
            await SprinklersDevice.createTable(this);
        }
        if (tables.indexOf(UserSprinklersDevice.tableName) === -1) {
            await UserSprinklersDevice.createTable(this);
        }
        const alex = new User(this, {
            name: "Alex Mikhalev",
            username: "alex",
        });
        await alex.setPassword("kakashka");
        const created = await alex.createOrUpdate();
        logger.info((created ? "created" : "updated") + " user alex");

        const alex2 = await User.loadByUsername(this, "alex");
        logger.info("password valid: " + await alex2!.comparePassword("kakashka"));

        const device = new SprinklersDevice(this, {
            name: "test",
        });
        await device.createOrUpdate();

        device.addToUser
    }
}
