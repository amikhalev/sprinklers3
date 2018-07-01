import { observable } from "mobx";
import { Schedule } from "./schedule";
import { SprinklersDevice } from "./SprinklersDevice";

export class ProgramItem {
    // the section number
    readonly section: number;
    // duration of the run, in seconds
    readonly duration: number;

    constructor(section: number = 0, duration: number = 0) {
        this.section = section;
        this.duration = duration;
    }
}

export class Program {
    readonly device: SprinklersDevice;
    readonly id: number;

    @observable name: string = "";
    @observable enabled: boolean = false;
    @observable schedule: Schedule = new Schedule();
    @observable.shallow sequence: ProgramItem[] = [];
    @observable running: boolean = false;

    constructor(device: SprinklersDevice, id: number) {
        this.device = device;
        this.id = id;
    }

    run() {
        return this.device.runProgram({ programId: this.id });
    }

    cancel() {
        return this.device.cancelProgram({ programId: this.id });
    }

    update(data: any) {
        return this.device.updateProgram({ programId: this.id, data });
    }

    toString(): string {
        return `Program{name="${this.name}", enabled=${this.enabled}, schedule=${this.schedule}, ` +
         `sequence=${this.sequence}, running=${this.running}}`;
    }
}
