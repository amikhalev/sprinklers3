import { observable } from "mobx";

export class TimeOfDay {
    readonly hour: number;
    readonly minute: number;
    readonly second: number;
    readonly millisecond: number;

    constructor(hour: number = 0, minute: number = 0, second: number = 0, millisecond: number = 0) {
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

export enum Month {
    January = 1,
    February = 2,
    March = 3,
    April = 4,
    May = 5,
    June = 6,
    July = 7,
    August = 8,
    September = 9,
    October = 10,
    November = 11,
    December = 12,
}

export class DateOfYear {
    readonly day: number;
    readonly month: Month;
    readonly year: number;

    constructor(day: number = 0, month: Month = Month.January, year: number = 0) {
        this.day = day;
        this.month = month;
        this.year = year;
    }

    toString() {
        return `${Month[this.month]} ${this.day}, ${this.year}`;
    }
}

export class Schedule {
    @observable times: TimeOfDay[] = [];
    @observable weekdays: Weekday[] = [];
    @observable from: DateOfYear | null = null;
    @observable to: DateOfYear | null = null;
}
