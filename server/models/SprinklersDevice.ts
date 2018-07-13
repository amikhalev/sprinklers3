import * as r from "rethinkdb";
import { createModelSchema, primitive, serialize, update } from "serializr";

import { Database } from "./Database";
import { User } from "./User";

export interface ISprinklersDevice {
    id: string | undefined;
    name: string;
}

export class SprinklersDevice implements ISprinklersDevice {
    static readonly tableName = "SprinklersDevices";

    id: string | undefined;
    name: string = "";

    private db: Database;
    private _table: r.Table | null = null;

    constructor(db: Database, data?: Partial<ISprinklersDevice>) {
        this.db = db;
        if (data) {
            update(this, data);
        }
    }

    static async createTable(db: Database) {
        await db.db.tableCreate(SprinklersDevice.tableName).run(db.conn);
        await db.db.table(SprinklersDevice.tableName).indexCreate("name").run(db.conn);
    }

    static async loadAll(db: Database): Promise<SprinklersDevice[]> {
        const cursor = await db.db.table(SprinklersDevice.tableName)
            .run(db.conn);
        const users = await cursor.toArray();
        return users.map((data) => {
            return new SprinklersDevice(db, data);
        });
    }

    static async load(db: Database, id: string): Promise<SprinklersDevice | null> {
        const data = await db.db.table(SprinklersDevice.tableName)
            .get(id)
            .run(db.conn);
        if (data == null) {
            return null;
        }
        return new SprinklersDevice(db, data);
    }

    private static getTable(db: Database): r.Table {
        return db.db.table(this.tableName);
    }

    private get table() {
        if (!this._table) {
            this._table = SprinklersDevice.getTable(this.db);
        }
        return this._table;
    }

    async create() {
        const data = serialize(this);
        delete data.id;
        const result = await this.table
            .insert(data)
            .run(this.db.conn);
        this.id = result.generated_keys[0];
    }

    async createOrUpdate() {
        const data = serialize(this);
        delete data.id;
        const device = this.table.filter(r.row("name").eq(this.name));
        const nameDoesNotExist = device.isEmpty();
        const a: r.WriteResult = await r.branch(nameDoesNotExist,
            this.table.insert(data) as r.Expression<any>,
            device.nth(0).update(data) as r.Expression<any>)
            .run(this.db.conn);
        if (a.inserted > 0) {
            this.id = a.generated_keys[0];
            return true;
        } else {
            return false;
        }
    }

    async addToUser(user: User | number) {
        const userId = (typeof user === "number") ? user : user.id;
        const userDevice = new UserSprinklersDevice(this.db, {

        });
    }

    toJSON(): any {
        return serialize(this);
    }
}

createModelSchema(SprinklersDevice, {
    id: primitive(),
    name: primitive(),
});

export interface IUserSprinklersDevice {
    id: string | undefined;
    userId: string;
    sprinklersDeviceId: string;
}

export class UserSprinklersDevice implements IUserSprinklersDevice {
    static readonly tableName = "UserSprinklersDevices";

    id: string | undefined;

    userId: string = "";
    sprinklersDeviceId: string = "";

    private db: Database;
    private _table: r.Table | null = null;

    constructor(db: Database) {
        this.db = db;
    }

    static async createTable(db: Database) {
        await db.db.tableCreate(UserSprinklersDevice.tableName).run(db.conn);
        await db.db.table(UserSprinklersDevice.tableName).indexCreate("userId").run(db.conn);
        await db.db.table(UserSprinklersDevice.tableName).indexCreate("sprinklersDeviceId").run(db.conn);
    }

    private static getTable(db: Database): r.Table {
        return db.db.table(this.tableName);
    }

    async create() {
        const data = serialize(this);
        delete data.id;
        const result = await this.table
            .insert(data)
            .run(this.db.conn);
        this.id = result.generated_keys[0];
    }

    private get table() {
        if (!this._table) {
            this._table = UserSprinklersDevice.getTable(this.db);
        }
        return this._table;
    }
}
