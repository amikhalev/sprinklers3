import {
    ModelSchema, primitive, PropSchema,
} from "serializr";
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
