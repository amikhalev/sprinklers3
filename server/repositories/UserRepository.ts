import { EntityRepository, Repository } from "typeorm";

import { User } from "../entities";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    findByUsername(username: string) {
        return this.findOne({ username }, { relations: ["devices"] });
    }
}
