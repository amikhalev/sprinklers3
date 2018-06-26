import {
    createSimpleSchema, ModelSchema, object, primitive,
} from "serializr";
import * as s from "..";
import list from "./list";

import * as requests from "./requests";
export { requests };

import * as common from "./common";
export * from "./common";

export const connectionState: ModelSchema<s.ConnectionState> = {
    factory: (c) => new s.ConnectionState(),
    props: {
        clientToServer: primitive(),
        serverToBroker: primitive(),
        brokerToDevice: primitive(),
    },
};

export const section: ModelSchema<s.Section> = {
    factory: (c) => new (c.parentContext.target as s.SprinklersDevice).sectionConstructor(
        c.parentContext.target, c.json.id),
    props: {
        id: primitive(),
        name: primitive(),
        state: primitive(),
    },
};

export const sectionRun: ModelSchema<s.SectionRun> = {
    factory: (c) => new s.SectionRun(c.parentContext.target, c.json.id),
    props: {
        id: primitive(),
        section: primitive(),
        duration: common.duration,
        startTime: common.date,
        pauseTime: common.date,
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
        times: list(object(common.timeOfDay)),
        weekdays: list(primitive()),
        from: object(common.dateOfYear),
        to: object(common.dateOfYear),
    },
};

export const programItem: ModelSchema<s.ProgramItem> = {
    factory: () => new s.ProgramItem(),
    props: {
        section: primitive(),
        duration: common.duration,
    },
};

export const program: ModelSchema<s.Program> = {
    factory: (c) => new (c.parentContext.target as s.SprinklersDevice).programConstructor(
        c.parentContext.target, c.json.id),
    props: {
        id: primitive(),
        name: primitive(),
        enabled: primitive(),
        schedule: object(schedule),
        sequence: list(object(programItem)),
        running: primitive(),
    },
};

export const sprinklersDevice = createSimpleSchema({
    connectionState: object(connectionState),
    sections: list(object(section)),
    sectionRunner: object(sectionRunner),
    programs: list(object(program)),
});
