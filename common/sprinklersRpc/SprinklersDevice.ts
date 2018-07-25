import { computed, observable } from "mobx";
import { ConnectionState } from "./ConnectionState";
import * as req from "./deviceRequests";
import { Program } from "./Program";
import { Section } from "./Section";
import { SectionRunner } from "./SectionRunner";

export abstract class SprinklersDevice {
    @observable connectionState: ConnectionState = new ConnectionState();
    @observable sections: Section[] = [];
    @observable programs: Program[] = [];
    @observable sectionRunner: SectionRunner;

    @computed get connected(): boolean {
        return this.connectionState.isDeviceConnected || false;
    }

    sectionConstructor: typeof Section = Section;
    sectionRunnerConstructor: typeof SectionRunner = SectionRunner;
    programConstructor: typeof Program = Program;

    protected constructor() {
        this.sectionRunner = new (this.sectionRunnerConstructor)(this);
    }

    abstract get id(): string;

    abstract makeRequest(request: req.Request): Promise<req.Response>;

    runProgram(opts: req.WithProgram) {
        return this.makeRequest({ ...opts, type: "runProgram" });
    }

    cancelProgram(opts: req.WithProgram) {
        return this.makeRequest({ ...opts, type: "cancelProgram" });
    }

    updateProgram(opts: req.UpdateProgramData): Promise<req.UpdateProgramResponse> {
        return this.makeRequest({ ...opts, type: "updateProgram" }) as Promise<any>;
    }

    runSection(opts: req.RunSectionData): Promise<req.RunSectionResponse> {
        return this.makeRequest({ ...opts, type: "runSection" }) as Promise<any>;
    }

    cancelSection(opts: req.WithSection) {
        return this.makeRequest({ ...opts, type: "cancelSection" });
    }

    cancelSectionRunId(opts: req.CancelSectionRunIdData) {
        return this.makeRequest({ ...opts, type: "cancelSectionRunId" });
    }

    pauseSectionRunner(opts: req.PauseSectionRunnerData) {
        return this.makeRequest({ ...opts, type: "pauseSectionRunner" });
    }

    toString(): string {
        return `SprinklersDevice{id="${this.id}", connected=${this.connected}, ` +
            `sections=[${this.sections}], ` +
            `programs=[${this.programs}], ` +
            `sectionRunner=${this.sectionRunner} }`;
    }
}
