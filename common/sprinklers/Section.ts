import { observable } from "mobx";
import { Duration } from "./Duration";
import { SprinklersDevice } from "./SprinklersDevice";

export class Section {
    readonly device: SprinklersDevice;
    readonly id: number;

    @observable name: string = "";
    @observable state: boolean = false;

    constructor(device: SprinklersDevice, id: number) {
        this.device = device;
        this.id = id;
    }

    run(duration: Duration) {
        return this.device.runSection(this, duration);
    }

    toString(): string {
        return `Section{id=${this.id}, name="${this.name}", state=${this.state}}`;
    }
}
