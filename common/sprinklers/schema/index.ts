/* tslint:disable:ordered-imports object-literal-shorthand */
import {
    createSimpleSchema, primitive, object, ModelSchema, PropSchema,
} from "serializr";
import list from "./list";
import * as s from "..";

export const duration: PropSchema = {
    serializer: (d: s.Duration | null) =>
        d != null ? d.toSeconds() : null,
    deserializer: (json: any, done) => {
        if (typeof json === "number") {
            done(null, s.Duration.fromSeconds(json));
        } else {
            done(new Error(`Duration expects a number, not ${json}`), undefined);
        }
    },
};

export const date: PropSchema = {
    serializer: (jsDate: Date | null) => jsDate != null ?
        jsDate.toISOString() : null,
    deserializer: (json: any, done) => {
        if (json === null) {
            return done(null, null);
        }
        try {
            done(null, new Date(json));
        } catch (e) {
            done(e, undefined);
        }
    },
};

export const dateOfYear: ModelSchema<s.DateOfYear> = {
    factory: () => new s.DateOfYear(),
    props: {
        year: primitive(),
        month: primitive(), // this only works if it is represented as a # from 0-12
        day: primitive(),
    },
};

export const timeOfDay: ModelSchema<s.TimeOfDay> = {
    factory: () => new s.TimeOfDay(),
    props: {
        hour: primitive(),
        minute: primitive(),
        second: primitive(),
        millisecond: primitive(),
    },
};

export const section: ModelSchema<s.Section> = {
    factory: (c) => new (c.parentContext.target as s.SprinklersDevice).sectionConstructor(
        c.parentContext.target, c.json.id),
    props: {
        name: primitive(),
        state: primitive(),
    },
};

export const sectionRun: ModelSchema<s.SectionRun> = {
    factory: (c) => new s.SectionRun(c.json.id),
    props: {
        id: primitive(),
        section: primitive(),
        duration: duration,
        startTime: date,
        endTime: date,
    },
};

export const sectionRunner: ModelSchema<s.SectionRunner> = {
    factory: (c) => new (c.parentContext.target as s.SprinklersDevice).sectionRunnerConstructor(
        c.parentContext.target),
    props: {
        queue: list(object(sectionRun)),
        current: object(sectionRun),
        paused: primitive(),
    },
};

export const schedule: ModelSchema<s.Schedule> = {
    factory: () => new s.Schedule(),
    props: {
        times: list(object(timeOfDay)),
        weekdays: list(primitive()),
        from: object(dateOfYear),
        to: object(dateOfYear),
    },
};

export const programItem: ModelSchema<s.ProgramItem> = {
    factory: () => new s.ProgramItem(),
    props: {
        section: primitive(),
        duration: duration,
    },
};

export const program: ModelSchema<s.Program> = {
    factory: (c) => new (c.parentContext.target as s.SprinklersDevice).programConstructor(
        c.parentContext.target, c.json.id),
    props: {
        name: primitive(),
        enabled: primitive(),
        schedule: object(schedule),
        sequence: list(object(programItem)),
        running: primitive(),
    },
};

export const sprinklersDevice = createSimpleSchema({
    connected: primitive(),
    sections: list(object(section)),
    sectionRunner: object(sectionRunner),
    programs: list(object(program)),
});
