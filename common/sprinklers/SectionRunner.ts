import { IObservableArray, observable } from "mobx";
import { Duration } from "./Duration";
import { SprinklersDevice } from "./SprinklersDevice";

export class SectionRun {
    id: number;
    section: number;
    duration: Duration;
    startTime: Date | null;
    pauseTime: Date | null;

    constructor(id: number = 0, section: number = 0, duration: Duration = new Duration()) {
        this.id = id;
        this.section = section;
        this.duration = duration;
        this.startTime = null;
        this.pauseTime = null;
    }

    toString() {
        return `SectionRun{id=${this.id}, section=${this.section}, duration=${this.duration},` +
            ` startTime=${this.startTime}, pauseTime=${this.pauseTime}}`;
    }
}

export class SectionRunner {
    device: SprinklersDevice;

    @observable
    queue: IObservableArray<SectionRun> = observable([]);

    @observable
    current: SectionRun | null = null;

    @observable
    paused: boolean = false;

    constructor(device: SprinklersDevice) {
        this.device = device;
    }

    cancelRunById(id: number): Promise<{}> {
        return this.device.cancelSectionRunById(id);
    }

    toString(): string {
        return `SectionRunner{queue="${this.queue}", current="${this.current}", paused=${this.paused}}`;
    }
}
