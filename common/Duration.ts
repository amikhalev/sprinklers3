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
        return `${this.minutes}M ${this.seconds.toFixed(1)}S`;
    }
}
