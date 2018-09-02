import { EntityRepository, FindOneOptions, Repository } from "typeorm";

import { User } from "@server/entities";

export interface FindUserOptions {
  devices: boolean;
}

function applyDefaultOptions(
  options?: Partial<FindUserOptions>
): FindOneOptions<User> {
  const opts: FindUserOptions = { devices: false, ...options };
  const relations = [opts.devices && "devices"].filter(Boolean) as string[];
  return { relations };
}

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  findAll(options?: Partial<FindUserOptions>) {
    const opts = applyDefaultOptions(options);
    return super.find(opts);
  }

  findById(id: number, options?: Partial<FindUserOptions>) {
    const opts = applyDefaultOptions(options);
    return super.findOne(id, opts);
  }

  findByUsername(username: string, options?: Partial<FindUserOptions>) {
    const opts = applyDefaultOptions(options);
    return this.findOne({ username }, opts);
  }
}
