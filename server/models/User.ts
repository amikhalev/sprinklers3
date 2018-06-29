import * as bcrypt from "bcrypt";
import * as r from "rethinkdb";
import { createModelSchema, deserialize, primitive, serialize, update } from "serializr";

import { Database } from "./Database";

export interface IUser {
    id: string | undefined;
    username: string;
    name: string;
    passwordHash: string;
}

const HASH_ROUNDS = 10;

export class User implements IUser {
    static readonly tableName = "users";

    id: string | undefined;
    username: string = "";
    name: string = "";
    passwordHash: string = "";

    private db: Database;

    private get _db() {
        return this.db.db;
    }

    private get table() {
        return this.db.db.table(User.tableName);
    }

    constructor(db: Database, data?: Partial<IUser>) {
        this.db = db;
        if (data) {
            update(this, data);
        }
    }

    static async createTable(db: Database) {
        await db.db.tableCreate(User.tableName).run(db.conn);
        await db.db.table(User.tableName).indexCreate("username").run(db.conn);
    }

    static async loadAll(db: Database): Promise<User[]> {
        const cursor = await db.db.table(User.tableName)
            .run(db.conn);
        const users = await cursor.toArray();
        return users.map((data) => {
            return new User(db, data);
        });
    }

    static async load(db: Database, id: string): Promise<User | null> {
        const data = await db.db.table(User.tableName)
            .get(id)
            .run(db.conn);
        if (data == null) {
            return null;
        }
        return new User(db, data);
    }

    static async loadByUsername(db: Database, username: string): Promise<User | null> {
        const seq = await db.db.table(User.tableName)
            .filter(r.row("username").eq(username))
            .run(db.conn);
        const data = await seq.toArray();
        if (data.length === 0) {
            return null;
        }
        return new User(db, data[0]);
    }

    async create() {
        const data = serialize(this);
        delete data.id;
        const a = this.table
            .insert(data)
            .run(this.db.conn);
    }

    async createOrUpdate() {
        const data = serialize(this);
        delete data.id;
        const user = this.table.filter(r.row("username").eq(this.username));
        const usernameDoesNotExist = user.isEmpty();
        const a: r.WriteResult = await r.branch(usernameDoesNotExist,
            this.table.insert(data) as r.Expression<any>,
            user.nth(0).update(data) as r.Expression<any>)
            .run(this.db.conn);
        return a.inserted > 0;
    }

    async setPassword(newPassword: string): Promise<void> {
        this.passwordHash = await bcrypt.hash(newPassword, HASH_ROUNDS);
    }

    async comparePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.passwordHash);
    }

    toJSON(): any {
        const data = serialize(this);
        delete data.passwordHash;
        return data;
    }
}

createModelSchema(User, {
    id: primitive(),
    username: primitive(),
    name: primitive(),
    passwordHash: primitive(),
});
