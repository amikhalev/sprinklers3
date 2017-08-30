import { IObservableArray, observable } from "mobx";

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

export class TimeOfDay {
    hour: number;
    minute: number;
    second: number;
    millisecond: number;

    constructor(hour: number, minute: number = 0, second: number = 0, millisecond: number = 0) {
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.millisecond = millisecond;
    }

    static fromDate(date: Date): TimeOfDay {
        return new TimeOfDay(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    }
}

export enum Weekday {
    Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday,
}

export class Schedule {
    times: TimeOfDay[] = [];
    weekdays: Weekday[] = [];
    from: Date | null = null;
    to: Date | null = null;
}

export class Duration {
    minutes: number = 0;
    seconds: number = 0;

    constructor(minutes: number = 0, seconds: number = 0) {
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
        return `Program{name="${this.name}", enabled=${this.enabled}, schedule=${this.schedule},
         sequence=${this.sequence}, running=${this.running}}`;
    }
}

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

export abstract class SprinklersDevice {
    @observable
    connected: boolean = false;

    @observable
    sections: IObservableArray<Section> = observable.array<Section>();

    @observable
    programs: IObservableArray<Program> = observable.array<Program>();

    @observable
    sectionRunner: SectionRunner;

    abstract get id(): string;

    abstract runSection(section: number | Section, duration: Duration): Promise<{}>;

    abstract runProgram(program: number | Program): Promise<{}>;

    abstract cancelSectionRunById(id: number): Promise<{}>;

    abstract pauseSectionRunner(): Promise<{}>;

    abstract unpauseSectionRunner(): Promise<{}>;
}

export interface ISprinklersApi {
    start(): void;

    getDevice(id: string): SprinklersDevice;

    removeDevice(id: string): void;
}
