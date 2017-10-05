import { update } from "serializr";

import * as s from "@common/sprinklers";
import * as schema from "@common/sprinklers/json";

export class WebSprinklersDevice extends s.SprinklersDevice {
    get id() {
        return "grinklers";
    }
    async runSection(section: number | s.Section, duration: s.Duration): Promise<{}> {
        return {};
    }
    async runProgram(program: number | s.Program): Promise<{}> {
        return {};
    }
    async cancelSectionRunById(id: number): Promise<{}> {
        return {};
    }
    async pauseSectionRunner(): Promise<{}> {
        return {};
    }
    async unpauseSectionRunner(): Promise<{}> {
        return {};
    }
}

export class WebApiClient implements s.ISprinklersApi {
    start() {
        // NOT IMPLEMENTED
    }

    getDevice(name: string): s.SprinklersDevice {
        const device = new WebSprinklersDevice();
        fetch("/api/grinklers")
            .then((res) => res.json())
            .then((json) => {
                update(schema.sprinklersDeviceSchema, device, json);
            })
            .catch((e) => alert(e));
        return device;
    }

    removeDevice(name: string) {
        // NOT IMPLEMENTED
    }
}
