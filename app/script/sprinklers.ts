import { observable, IObservableArray } from "mobx";

export class Section {
    @observable
    public name: string = "";

    @observable
    public state: boolean = false;
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

    abstract get id(): string;
}

export interface ISprinklersApi {
    start();
    getDevice(id: string): SprinklersDevice;

    removeDevice(id: string);
}
