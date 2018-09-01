import { createSimpleSchema, deserialize, ModelSchema, primitive, serialize } from "serializr";

import * as requests from "@common/sprinklersRpc/deviceRequests";
import * as common from "./common";

export const withType: ModelSchema<requests.WithType> = createSimpleSchema({
    type: primitive(),
});

export const withProgram: ModelSchema<requests.WithProgram> = createSimpleSchema({
    ...withType.props,
    programId: primitive(),
});

export const withSection: ModelSchema<requests.WithSection> = createSimpleSchema({
    ...withType.props,
    sectionId: primitive(),
});

export const updateProgram: ModelSchema<requests.UpdateProgramData> = createSimpleSchema({
    ...withProgram.props,
    data: {
        serializer: (data) => data,
        deserializer: (json, done) => { done(null, json); },
    },
});

export const runSection: ModelSchema<requests.RunSectionData> = createSimpleSchema({
    ...withSection.props,
    duration: common.duration,
});

export const cancelSectionRunId: ModelSchema<requests.CancelSectionRunIdData> = createSimpleSchema({
    ...withType.props,
    runId: primitive(),
});

export const pauseSectionRunner: ModelSchema<requests.PauseSectionRunnerData> = createSimpleSchema({
    ...withType.props,
    paused: primitive(),
});

export function getRequestSchema(request: requests.WithType): ModelSchema<any> {
    switch (request.type as requests.RequestType) {
        case "runProgram":
        case "cancelProgram":
            return withProgram;
        case "updateProgram":
            return updateProgram;
        case "runSection":
            return runSection;
        case "cancelSection":
            return withSection;
        case "cancelSectionRunId":
            return cancelSectionRunId;
        case "pauseSectionRunner":
            return pauseSectionRunner;
        default:
            throw new Error(`Cannot serialize request with type "${request.type}"`);
    }
}

export function seralizeRequest(request: requests.Request): any {
    return serialize(getRequestSchema(request), request);
}

export function deserializeRequest(json: any): requests.Request {
    return deserialize(getRequestSchema(json), json);
}
