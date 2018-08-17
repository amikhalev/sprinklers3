import { ISprinklersDevice, IUser } from "@common/httpApi";
import { action, observable } from "mobx";

export class UserStore {
    @observable userData: IUser | null = null;

    @action.bound
    receiveUserData(userData: IUser) {
        this.userData = userData;
    }

    findDevice(id: number): ISprinklersDevice | null {
        return this.userData &&
            this.userData.devices &&
            this.userData.devices.find((dev) => dev.id === id) || null;
    }
}
