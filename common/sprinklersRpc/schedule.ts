import { observable } from "mobx";
import { Moment } from "moment";

export class TimeOfDay {
  static fromMoment(m: Moment): TimeOfDay {
    return new TimeOfDay(m.hour(), m.minute(), m.second(), m.millisecond());
  }

  static fromDate(date: Date): TimeOfDay {
    return new TimeOfDay(
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    );
  }

  static equals(
    a: TimeOfDay | null | undefined,
    b: TimeOfDay | null | undefined
  ): boolean {
    return (
      a === b ||
      (a != null &&
        b != null &&
        a.hour === b.hour &&
        a.minute === b.minute &&
        a.second === b.second &&
        a.millisecond === b.millisecond)
    );
  }

  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;

  constructor(
    hour: number = 0,
    minute: number = 0,
    second: number = 0,
    millisecond: number = 0
  ) {
    this.hour = hour;
    this.minute = minute;
    this.second = second;
    this.millisecond = millisecond;
  }
}

export enum Weekday {
  Sunday,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday
}

export const WEEKDAYS: Weekday[] = Object.keys(Weekday)
  .map(weekday => Number(weekday))
  .filter(weekday => !isNaN(weekday));

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
  December = 12
}

export class DateOfYear {
  static readonly DEFAULT = new DateOfYear({
    day: 1,
    month: Month.January,
    year: 0
  });

  static equals(
    a: DateOfYear | null | undefined,
    b: DateOfYear | null | undefined
  ): boolean {
    return (
      a === b ||
      (a instanceof DateOfYear &&
        b instanceof DateOfYear &&
        a.day === b.day &&
        a.month === b.month &&
        a.year === b.year)
    );
  }

  static fromMoment(m: Moment): DateOfYear {
    return new DateOfYear({ day: m.date(), month: m.month(), year: m.year() });
  }

  readonly day!: number;
  readonly month!: Month;
  readonly year!: number;

  constructor(data?: Partial<DateOfYear>) {
    Object.assign(this, DateOfYear.DEFAULT, data);
  }

  with(data: Partial<DateOfYear>): DateOfYear {
    return new DateOfYear(Object.assign({}, this, data));
  }

  toString() {
    return `${Month[this.month]} ${this.day}, ${this.year}`;
  }
}

export class Schedule {
  @observable
  times: TimeOfDay[] = [];
  @observable
  weekdays: Weekday[] = [];
  @observable
  from: DateOfYear | null = null;
  @observable
  to: DateOfYear | null = null;

  constructor(data?: Partial<Schedule>) {
    if (typeof data === "object") {
      Object.assign(this, data);
    }
  }

  clone(): Schedule {
    return new Schedule(this);
  }
}
