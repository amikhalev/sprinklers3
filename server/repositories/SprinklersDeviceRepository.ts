import { DeepPartial, EntityRepository, Repository, SaveOptions } from "typeorm";

import { SprinklersDevice, User } from "@server/entities";
import UniqueConstraintError from "@server/UniqueConstraintError";

@EntityRepository(SprinklersDevice)
export class SprinklersDeviceRepository extends Repository<SprinklersDevice> {
  findByName(name: string) {
    return this.findOne({ name });
  }

  async userHasAccess(userId: number, deviceId: number): Promise<boolean> {
    const count = await this.manager
      .createQueryBuilder(User, "user")
      .innerJoinAndSelect(
        "user.devices",
        "sprinklers_device",
        "user.id = :userId AND sprinklers_device.id = :deviceId",
        { userId, deviceId }
      )
      .getCount();
    return count > 0;
  }

  async findUserDevice(
    userId: number,
    deviceId: number
  ): Promise<SprinklersDevice | null> {
    const user = await this.manager
      .createQueryBuilder(User, "user")
      .innerJoinAndSelect(
        "user.devices",
        "sprinklers_device",
        "user.id = :userId AND sprinklers_device.id = :deviceId",
        { userId, deviceId }
      )
      .getOne();
    if (!user) {
      return null;
    }
    return user.devices![0];
  }

  save<T extends DeepPartial<SprinklersDevice>>(entities: T[], options?: SaveOptions): Promise<T[]>;
  save<T extends DeepPartial<SprinklersDevice>>(entity: T, options?: SaveOptions): Promise<T>;
  async save(entity: any, options?: SaveOptions): Promise<any> {
    try {
      return await super.save(entity, options);
    } catch (e) {
      if (UniqueConstraintError.is(e)) {
        throw new UniqueConstraintError(e);
      }
      throw e;
    }
  }
}
