import { observable } from "mobx";

export class Section {
    @observable
    name: string = ""

    @observable
    state: boolean = false
}

class TimeOfDay {
    hour: number
    minute: number
    second: number
    millisecond: number

}

enum Weekday {
    Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
}

class Schedule {
    times: TimeOfDay[] = [];
    weekdays: Weekday[] = [];
    from?: Date = null;
    to?: Date = null;
}

class ProgramItem {
    section: number = -1;
    // duration in milliseconds
    duration: number = 0;
}

class Program {
    @observable
    name: string = ""
    @observable
    enabled: boolean = false

    @observable
    schedule: Schedule = new Schedule()

    @observable
    sequence: Array<ProgramItem> = [];
}

export abstract class SprinklersDevice {
    @observable
    connected: boolean = false;

    @observable
    sections: Array<Section> = [];

    @observable
    programs: Array<Program> = [];

    abstract get id(): string;
}

export interface SprinklersApi {
    start();
    getDevice(id: string) : SprinklersDevice;

    removeDevice(id: string)
}