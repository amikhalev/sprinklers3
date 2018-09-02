import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

import { ISprinklersDevice } from "@common/httpApi";
import { User } from "./User";

@Entity()
export class SprinklersDevice implements ISprinklersDevice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true, type: "varchar" })
  deviceId: string | null = null;

  @Column()
  name: string = "";

  @ManyToMany(type => User)
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
