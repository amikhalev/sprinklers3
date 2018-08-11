import { EntityRepository, Repository } from "typeorm";

import { SprinklersDevice, User } from "../entities";

@EntityRepository(SprinklersDevice)
export class SprinklersDeviceRepository extends Repository<SprinklersDevice> {
    findByName(name: string) {
        return this.findOne({ name });
    }

    async userHasAccess(userId: number, deviceId: number): Promise<boolean> {
        const count = await this.manager
            .createQueryBuilder(User, "user")
            .innerJoinAndSelect("user.devices", "sprinklers_device",
                "user.id = :userId AND sprinklers_device.id = :deviceId",
            { userId, deviceId })
            .getCount();
        return count > 0;
    }

    async findUserDevice(userId: number, deviceId: number): Promise<SprinklersDevice | null> {
        const user = await this.manager
            .createQueryBuilder(User, "user")
            .innerJoinAndSelect("user.devices", "sprinklers_device",
                "user.id = :userId AND sprinklers_device.id = :deviceId",
            { userId, deviceId })
            .getOne();
        if (!user) {
            return null;
        }
        return user.devices![0];
    }
}
