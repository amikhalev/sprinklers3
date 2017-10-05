/* tslint:disable:ordered-imports */
import { assign, pick } from "lodash";
import {
    createSimpleSchema, createModelSchema, primitive, object, date, custom,
    ModelSchema, PropSchema,
} from "serializr";
import list from "./list";
import * as s from "..";

export const durationSchema: PropSchema = {
    serializer: (duration: s.Duration | null) =>
        duration != null ? duration.toSeconds() : null,
    deserializer: (json: any) =>
        typeof json === "number" ? s.Duration.fromSeconds(json) : null,
};

export const dateSchema: PropSchema = {
    serializer: (jsDate: Date | null) => jsDate != null ?
        jsDate.toISOString() : null,
    deserializer: (json: any) => typeof json === "string" ?
        new Date(json) : null,
};

export const dateOfYearSchema: ModelSchema<s.DateOfYear> = {
    factory: () => new s.DateOfYear(),
    props: {
        year: primitive(),
        month: primitive(), // this only works if it is represented as a # from 0-12
        day: primitive(),
    },
};

export const timeOfDaySchema: ModelSchema<s.TimeOfDay> = {
    factory: () => new s.TimeOfDay(),
    props: {
        hour: primitive(),
        minute: primitive(),
        second: primitive(),
        millisecond: primitive(),
    },
};

export const sectionSchema: ModelSchema<s.Section> = {
    factory: (c) => new (c.parentContext.target as s.SprinklersDevice).sectionConstructor(
        c.parentContext.target, c.json.id),
    props: {
        name: primitive(),
        state: primitive(),
    },
};

export const sectionRunSchema: ModelSchema<s.SectionRun> = {
    factory: (c) => new s.SectionRun(c.json.id),
    props: {
        id: primitive(),
        section: primitive(),
        duration: durationSchema,
        startTime: dateSchema,
        endTime: dateSchema,
    },
};

export const sectionRunnerSchema: ModelSchema<s.SectionRunner> = {
    factory: (c) => new (c.parentContext.target as s.SprinklersDevice).sectionRunnerConstructor(
        c.parentContext.target),
    props: {
        queue: list(object(sectionRunSchema)),
        current: object(sectionRunSchema),
        paused: primitive(),
    },
};

export const scheduleSchema: ModelSchema<s.Schedule> = {
    factory: () => new s.Schedule(),
    props: {
        times: list(object(timeOfDaySchema)),
        weekdays: list(primitive()),
        from: object(dateOfYearSchema),
        to: object(dateOfYearSchema),
    },
};

export const programItemSchema: ModelSchema<s.ProgramItem> = {
    factory: () => new s.ProgramItem(),
    props: {
        section: primitive(),
        duration: durationSchema,
    },
};

export const programSchema: ModelSchema<s.Program> = {
    factory: (c) => new (c.parentContext.target as s.SprinklersDevice).programConstructor(
        c.parentContext.target, c.json.id),
    props: {
        name: primitive(),
        enabled: primitive(),
        schedule: object(scheduleSchema),
        sequence: list(object(programItemSchema)),
        running: primitive(),
    },
};

export const sprinklersDeviceSchema = createSimpleSchema({
    connected: primitive(),
    sections: list(object(sectionSchema)),
    sectionRunner: object(sectionRunnerSchema),
    programs: list(object(programSchema)),
});
