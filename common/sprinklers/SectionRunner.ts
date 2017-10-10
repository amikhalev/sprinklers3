import { observable } from "mobx";
import { Duration } from "./Duration";
import { SprinklersDevice } from "./SprinklersDevice";

export class SectionRun {
    readonly sectionRunner: SectionRunner;
    readonly id: number;
    section: number;
    duration: Duration = new Duration();
    startTime: Date | null = null;
    pauseTime: Date | null = null;

    constructor(sectionRunner: SectionRunner, id: number = 0, section: number = 0) {
        this.sectionRunner = sectionRunner;
        this.id = id;
        this.section = section;
    }

    cancel() {
        return this.sectionRunner.cancelRunById(this.id);
    }

    toString() {
        return `SectionRun{id=${this.id}, section=${this.section}, duration=${this.duration},` +
            ` startTime=${this.startTime}, pauseTime=${this.pauseTime}}`;
    }
}

export class SectionRunner {
    readonly device: SprinklersDevice;

    @observable queue: SectionRun[] = [];
    @observable current: SectionRun | null = null;
    @observable paused: boolean = false;

    constructor(device: SprinklersDevice) {
        this.device = device;
    }

    cancelRunById(runId: number) {
        return this.device.cancelSectionRunId({ runId });
    }

    toString(): string {
        return `SectionRunner{queue="${this.queue}", current="${this.current}", paused=${this.paused}}`;
    }
}
