import { observable } from "mobx";
import { Program } from "./Program";
import * as requests from "./requests";
import { Section } from "./Section";
import { SectionRunner } from "./SectionRunner";

export abstract class SprinklersDevice {
    @observable connected: boolean = false;
    @observable sections: Section[] = [];
    @observable programs: Program[] = [];
    @observable sectionRunner: SectionRunner;

    constructor() {
        this.sectionRunner = new (this.sectionRunnerConstructor)(this);
    }

    abstract get id(): string;
    abstract makeRequest(request: requests.Request): Promise<requests.Response>;

    runProgram(opts: requests.WithProgram) {
        return this.makeRequest({ ...opts, type: "runProgram" });
    }

    cancelProgram(opts: requests.WithProgram) {
        return this.makeRequest({ ...opts, type: "cancelProgram" });
    }

    updateProgram(opts: requests.UpdateProgramData): Promise<requests.UpdateProgramResponse> {
        return this.makeRequest({ ...opts, type: "updateProgram" }) as Promise<any>;
    }

    runSection(opts: requests.RunSectionData): Promise<requests.RunSectionResponse> {
        return this.makeRequest({ ...opts, type: "runSection" }) as Promise<any>;
    }

    cancelSection(opts: requests.WithSection) {
        return this.makeRequest({ ...opts, type: "cancelSection" });
    }

    cancelSectionRunId(opts: requests.CancelSectionRunIdData) {
        return this.makeRequest({ ...opts, type: "cancelSectionRunId" });
    }

    pauseSectionRunner(opts: requests.PauseSectionRunnerData) {
        return this.makeRequest({ ...opts, type: "pauseSectionRunner" });
    }

    get sectionConstructor(): typeof Section {
        return Section;
    }
    get sectionRunnerConstructor(): typeof SectionRunner {
        return SectionRunner;
    }
    get programConstructor(): typeof Program {
        return Program;
    }

    toString(): string {
        return `SprinklersDevice{id="${this.id}", connected=${this.connected}, ` +
            `sections=[${this.sections}], ` +
            `programs=[${this.programs}], ` +
            `sectionRunner=${this.sectionRunner} }`;
    }
}
