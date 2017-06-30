import {IObservableArray, observable} from "mobx";

export abstract class Section {
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

export interface ITimeOfDay {
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
}

export enum Weekday {
    Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday,
}

export class Schedule {
    times: ITimeOfDay[] = [];
    weekdays: Weekday[] = [];
    from?: Date = null;
    to?: Date = null;
}

export class Duration {
    minutes: number = 0;
    seconds: number = 0;

    constructor(minutes: number, seconds: number) {
        this.minutes = minutes;
        this.seconds = seconds;
    }

    static fromSeconds(seconds: number): Duration {
        return new Duration(Math.floor(seconds / 60), seconds % 60);
    }

    toSeconds(): number {
        return this.minutes * 60 + this.seconds;
    }

    withSeconds(newSeconds: number): Duration {
        let newMinutes = this.minutes;
        if (newSeconds >= 60) {
            newMinutes++;
            newSeconds = 0;
        }
        if (newSeconds < 0) {
            newMinutes = Math.max(0, newMinutes - 1);
            newSeconds = 59;
        }
        return new Duration(newMinutes, newSeconds);
    }

    withMinutes(newMinutes: number): Duration {
        if (newMinutes < 0) {
            newMinutes = 0;
        }
        return new Duration(newMinutes, this.seconds);
    }

    toString(): string {
        return `${this.minutes}M ${this.seconds}S`;
    }
}

export interface IProgramItem {
    // the section number
    section: number;
    // duration of the run
    duration: Duration;
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
    sequence: IProgramItem[] = [];

    @observable
    running: boolean = false;

    constructor(device: SprinklersDevice) {
        this.device = device;
    }

    run() {
        return this.device.runProgram(this);
    }

    toString(): string {
        return `Program{name="${this.name}", enabled=${this.enabled}, schedule=${this.schedule},
         sequence=${this.sequence}, running=${this.running}}`;
    }
}

export interface ISectionRun {
    id: number;
    section: number;
    duration: number;
    startTime?: Date;
}

export class SectionRunner {
    device: SprinklersDevice;

    @observable
    queue: IObservableArray<ISectionRun> = observable([]);

    @observable
    current: ISectionRun = null;

    constructor(device: SprinklersDevice) {
        this.device = device;
    }

    cancelRunById(id: number): Promise<{}> {
        return this.device.cancelSectionRunById(id);
    }

    toString(): string {
        return `SectionRunner{queue="${this.queue}", current="${this.current}"}`;
    }
}

export abstract class SprinklersDevice {
    @observable
    connected: boolean = false;

    @observable
    sections: IObservableArray<Section> = [] as IObservableArray<Section>;

    @observable
    programs: IObservableArray<Program> = [] as IObservableArray<Program>;

    @observable
    sectionRunner: SectionRunner;

    abstract get id(): string;

    abstract runSection(section: number | Section, duration: Duration): Promise<{}>;

    abstract runProgram(program: number | Program): Promise<{}>;

    abstract cancelSectionRunById(id: number): Promise<{}>;
}

export interface ISprinklersApi {
    start();

    getDevice(id: string): SprinklersDevice;

    removeDevice(id: string);
}
