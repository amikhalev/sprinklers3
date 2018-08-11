import { EntityRepository, Repository } from "typeorm";

import { User } from "../entities";

export interface FindUserOptions {
    devices: boolean;
}

function applyDefaultOptions(options?: Partial<FindUserOptions>): FindUserOptions {
    return { devices: false, ...options };
}

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    findAll(options?: Partial<FindUserOptions>) {
        const opts = applyDefaultOptions(options);
        const relations = [ opts.devices && "devices" ]
            .filter(Boolean) as string[];
        return super.find({ relations });
    }

    findByUsername(username: string, options?: Partial<FindUserOptions>) {
        const opts = applyDefaultOptions(options);
        const relations = [ opts.devices && "devices" ]
            .filter(Boolean) as string[];
        return this.findOne({ username }, { relations });
    }
}
