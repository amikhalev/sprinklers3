import { EntityRepository, FindOneOptions, Repository, DeepPartial, FindConditions, SaveOptions } from "typeorm";

import ApiError from "@common/ApiError";
import { User } from "@server/entities";

export interface FindUserOptions extends FindOneOptions<User> {
  devices: boolean;
}

function computeOptions(
  options?: Partial<FindUserOptions>
): FindOneOptions<User> {
  const opts: FindUserOptions = { devices: false, ...options };
  const { devices, ...rest } = opts;
  const relations = [devices && "devices"].filter(Boolean) as string[];
  return { relations, ...rest };
}

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  findAll(options?: Partial<FindUserOptions>) {
    const opts = computeOptions(options);
    return super.find(opts);
  }

  findOneUser(conditions: FindConditions<User>, options?: Partial<FindUserOptions>) {
    const opts = computeOptions(options);
    return super.findOne(conditions, opts);
  }

  findById(id: number, options?: Partial<FindUserOptions>) {
    return this.findOneUser({ id }, options);
  }

  findByUsername(username: string, options?: Partial<FindUserOptions>) {
    return this.findOneUser({ username }, options);
  }

  // async checkAndSave(entity: User): Promise<User> {
    // return this.manager.transaction(manager => {
    //   let query = manager.createQueryBuilder<User>(User, "user", manager.queryRunner!);
    //   if (entity.id != null) {
    //     query = query.where("user.id <> :id", { id: entity.id })
    //   }
    //   query

    //   return manager.save(entity);
    // });
  // }
}
