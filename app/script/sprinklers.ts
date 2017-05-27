import { observable, IObservableArray } from "mobx";

export abstract class Section {
    public device: SprinklersDevice;

    @observable
    public name: string = "";

    @observable
    public state: boolean = false;

    constructor(device: SprinklersDevice) {
        this.device = device;
    }

    public run(duration: Duration) {
        this.device.runSection(this, duration);
    }

    public toString(): string {
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
    public times: ITimeOfDay[] = [];
    public weekdays: Weekday[] = [];
    public from?: Date = null;
    public to?: Date = null;
}

export class Duration {
    public static fromSeconds(seconds: number): Duration {
        return new Duration(Math.floor(seconds / 60), seconds % 60);
    }

    public minutes: number = 0;
    public seconds: number = 0;

    constructor(minutes: number, seconds: number) {
        this.minutes = minutes;
        this.seconds = seconds;
    }

    public toSeconds(): number {
        return this.minutes * 60 + this.seconds;
    }

    public withSeconds(newSeconds: number): Duration {
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

    public withMinutes(newMinutes: number): Duration {
        if (newMinutes < 0) {
            newMinutes = 0;
        }
        return new Duration(newMinutes, this.seconds);
    }

    public toString(): string {
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
    @observable
    public name: string = "";
    @observable
    public enabled: boolean = false;

    @observable
    public schedule: Schedule = new Schedule();

    @observable
    public sequence: IProgramItem[] = [];

    @observable
    public running: boolean = false;
}

export abstract class SprinklersDevice {
    @observable
    public connected: boolean = false;

    @observable
    public sections: IObservableArray<Section> = [] as IObservableArray<Section>;

    @observable
    public programs: IObservableArray<Program> = [] as IObservableArray<Program>;

    public abstract runSection(section: number | Section, duration: Duration);

    abstract get id(): string;
}

export interface ISprinklersApi {
    start();
    getDevice(id: string): SprinklersDevice;

    removeDevice(id: string);
}
