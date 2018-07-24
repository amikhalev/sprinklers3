import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

import { User } from "./User";

@Entity()
export class SprinklersDevice {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true, type: "uuid" })
    deviceId: string | null = null;

    @Column()
    name: string = "";

    @ManyToMany((type) => User)
    users: User[] | undefined;

    constructor(data?: Partial<SprinklersDevice>) {
        if (data) {
            Object.assign(this, data);
        }
    }
}

// @Entity()
export class UserSprinklersDevice {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId: string = "";
    @Column()
    sprinklersDeviceId: string = "";

    constructor(data?: UserSprinklersDevice) {
        if (data) {
            Object.assign(this, data);
        }
    }
}
