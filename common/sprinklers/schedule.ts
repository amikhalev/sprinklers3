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
