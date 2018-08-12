import { IUser } from "@common/httpApi";
import { observable } from "mobx";

export class UserStore {
    @observable userData: IUser | null = null;
}
