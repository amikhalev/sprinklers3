import { assign, pick } from "lodash";
import * as s from "..";

export interface ISectionJSON {
    name: string;
    state: boolean;
}
const sectionProps = ["name", "state"];

export function sectionToJSON(sec: s.Section): ISectionJSON {
    return pick(sec, sectionProps);
}

export function sectionFromJSON(sec: s.Section, json: ISectionJSON) {
    assign(sec, pick(json, sectionProps));
}

export interface ITimeOfDayJSON {
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
}
const timeOfDayProps = ["hour", "minute", "second", "millisecond"];

export function timeOfDayToJSON(timeOfDay: s.TimeOfDay): ITimeOfDayJSON {
    return pick(timeOfDay, timeOfDayProps);
}

export function timeOfDayFromJSON(timeOfDay: s.TimeOfDay, json: ITimeOfDayJSON) {
    assign(timeOfDay, pick(json, timeOfDayProps));
}

export interface IScheduleJSON {
    times: ITimeOfDayJSON[];
    weekdays: number[];
    from?: string;
    to?: string;
}
const scheduleProps = ["weekdays", "from", "to"];

export function scheduleToJSON(schedule: s.Schedule): IScheduleJSON {
    return {
        ...pick(schedule, scheduleProps),
        times: schedule.times.map(timeOfDayToJSON),
    };
}

export function scheduleFromJSON(schedule: s.Schedule, json: IScheduleJSON) {
    assign(schedule, pick(json, scheduleProps));
    schedule.times.length = json.times.length;
    schedule.times.forEach((timeOfDay, i) =>
        timeOfDayFromJSON(timeOfDay, json.times[i]));
}

export interface IProgramItemJSON {
    section: number;
    duration: number;
}
const programItemProps = ["section"];

export function programItemToJSON(programItem: s.ProgramItem): IProgramItemJSON {
    return {
        ...pick(programItem, programItemProps),
        duration: programItem.duration.toSeconds(),
    };
}

export function programItemFromJSON(programItem: s.ProgramItem, json: IProgramItemJSON) {
    assign(programItem, pick(json, programItemProps));
    programItem.duration = s.Duration.fromSeconds(json.duration);
}

export interface IProgramJSON {
    name: string;
    enabled: boolean;
    sequence: IProgramItemJSON[];
    schedule: IScheduleJSON;
    running: boolean;
}
const programProps = ["name", "enabled", "running"];

export function programToJSON(program: s.Program): IProgramJSON {
    return {
        ...pick(program, programProps),
        sequence: program.sequence.map(programItemToJSON),
        schedule: scheduleToJSON(program.schedule),
    };
}

export function programFromJSON(program: s.Program, json: IProgramJSON) {
    assign(program, pick(json, programProps));
    program.sequence.length = json.sequence.length;
    program.sequence.forEach((programItem, i) =>
        programItemFromJSON(programItem, json.sequence[i]));
    scheduleFromJSON(program.schedule, json.schedule);
}

export interface ISectionRunJSON {
    id: number;
    section: number;
    duration: number;
    startTime?: number;
    pauseTime?: number;
}
const sectionRunProps = ["id", "section", "duration", "startTime", "pauseTime"];

export function sectionRunToJSON(sectionRun: s.SectionRun): ISectionRunJSON {
    return pick(sectionRun, sectionRunProps);
}

export function sectionRunFromJSON(sectionRun: s.SectionRun, json: ISectionRunJSON) {
    assign(sectionRun, pick(json, sectionRunProps));
}

interface ISectionRunnerJSON {
    queue: ISectionRunJSON[];
    current: ISectionRunJSON | null;
    paused: boolean;
}
const sectionRunnerProps = ["paused"];

export function sectionRunnerToJSON(sectionRunner: s.SectionRunner): ISectionRunnerJSON {
    return {
        ...pick(sectionRunner, sectionRunnerProps),
        queue: sectionRunner.queue.map(sectionRunToJSON),
        current: sectionRunner.current ? sectionRunToJSON(sectionRunner.current) : null,
    };
}

export function sectionRunnerFromJSON(sectionRunner: s.SectionRunner, json: ISectionRunnerJSON) {
    assign(sectionRunner, pick(json, sectionRunnerProps));
    sectionRunner.queue.length = json.queue.length;
    sectionRunner.queue.forEach((sectionRun, i) =>
        sectionRunFromJSON(sectionRun, json.queue[i]));
    if (json.current == null) {
        sectionRunner.current = null;
    } else {
        if (sectionRunner.current == null) {
            sectionRunner.current = new s.SectionRun();
        }
        sectionRunFromJSON(sectionRunner.current, json.current);
    }
}

interface ISprinklersDeviceJSON {
    connected: boolean;
    sections: ISectionJSON[];
    sectionRunner: ISectionRunnerJSON;
    programs: IProgramJSON[];
}
const sprinklersDeviceProps = ["connected"];

export function sprinklersDeviceToJSON(sprinklersDevice: s.SprinklersDevice): ISprinklersDeviceJSON {
    return {
        ...pick(sprinklersDevice, sprinklersDeviceProps),
        sections: sprinklersDevice.sections.map(sectionToJSON),
        sectionRunner: sectionRunnerToJSON(sprinklersDevice.sectionRunner),
        programs: sprinklersDevice.programs.map(programToJSON),
    };
}

export function sprinklersDeviceFromJSON(sprinklersDevice: s.SprinklersDevice, json: ISprinklersDeviceJSON) {
    assign(sprinklersDevice, pick(json, sprinklersDeviceProps));
    sprinklersDevice.sections.length = json.sections.length;
    sprinklersDevice.sections.forEach((section, i) =>
        sectionFromJSON(section, json.sections[i]));
    sectionRunnerFromJSON(sprinklersDevice.sectionRunner, json.sectionRunner);
    sprinklersDevice.programs.length = json.programs.length;
    sprinklersDevice.programs.forEach((program, i) =>
        programFromJSON(program, json.programs[i]));
}
