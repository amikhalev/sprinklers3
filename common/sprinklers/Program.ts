import { observable } from "mobx";
import { Duration } from "./Duration";
import { Schedule } from "./schedule";
import { SprinklersDevice } from "./SprinklersDevice";

export class ProgramItem {
    // the section number
    section: number;
    // duration of the run
    duration: Duration;

    constructor(section: number, duration: Duration) {
        this.section = section;
        this.duration = duration;
    }
}

export class Program {
    device: SprinklersDevice;

    @observable
    name: string = "";
    @observable
    enabled: boolean = false;

    @observable
    schedule: Schedule = new Schedule();

    @observable
    sequence: ProgramItem[] = [];

    @observable
    running: boolean = false;

    constructor(device: SprinklersDevice) {
        this.device = device;
    }

    run() {
        return this.device.runProgram(this);
    }

    toString(): string {
        return `Program{name="${this.name}", enabled=${this.enabled}, schedule=${this.schedule}, ` +
         `sequence=${this.sequence}, running=${this.running}}`;
    }
}
