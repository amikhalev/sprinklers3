import * as bcrypt from "bcrypt";
import { omit } from "lodash";
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn
} from "typeorm";

import { IUser } from "@common/httpApi";
import { SprinklersDevice } from "./SprinklersDevice";

const HASH_ROUNDS = 1;

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index("user_username_unique", { unique: true })
  username: string = "";

  @Column()
  name: string = "";

  @Column()
  passwordHash: string = "";

  @ManyToMany(type => SprinklersDevice)
  @JoinTable({ name: "user_sprinklers_device" })
  devices: SprinklersDevice[] | undefined;

  constructor(data?: Partial<User>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  async setPassword(newPassword: string): Promise<void> {
    this.passwordHash = await bcrypt.hash(newPassword, HASH_ROUNDS);
  }

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  toJSON() {
    return omit(this, "passwordHash");
  }
}
