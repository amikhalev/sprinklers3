import { EntityRepository, Repository } from "typeorm";

import { SprinklersDevice } from "../entities";

@EntityRepository(SprinklersDevice)
export class SprinklersDeviceRepository extends Repository<SprinklersDevice> {
    findByName(name: string) {
        return this.findOne({ name });
    }
}
