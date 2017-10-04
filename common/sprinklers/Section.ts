import { observable } from "mobx";
import { Duration } from "./Duration";
import { SprinklersDevice } from "./SprinklersDevice";

export class Section {
    device: SprinklersDevice;

    @observable
    name: string = "";

    @observable
    state: boolean = false;

    constructor(device: SprinklersDevice) {
        this.device = device;
    }

    run(duration: Duration) {
        return this.device.runSection(this, duration);
    }

    toString(): string {
        return `Section{name="${this.name}", state=${this.state}}`;
    }
}
