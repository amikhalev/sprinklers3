import { computed, observable } from "mobx";
import { ConnectionState } from "./ConnectionState";
import * as req from "./deviceRequests";
import { Program } from "./Program";
import { Section } from "./Section";
import { SectionRunner } from "./SectionRunner";
import { SprinklersRPC } from "./SprinklersRPC";

export abstract class SprinklersDevice {
    readonly rpc: SprinklersRPC;
    readonly id: string;

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

    private references: number = 0;

    protected constructor(rpc: SprinklersRPC, id: string) {
        this.rpc = rpc;
        this.id = id;
        this.sectionRunner = new (this.sectionRunnerConstructor)(this);
    }

    abstract makeRequest(request: req.Request): Promise<req.Response>;

    /**
     * Increase the reference count for this sprinklers device
     * @returns The new reference count
     */
    acquire(): number {
        return ++this.references;
    }

    /**
     * Releases one reference to this device. When the reference count reaches 0, the device
     * will be released and no longer updated.
     * @returns The reference count after being updated
     */
    release(): number {
        this.references--;
        if (this.references <= 0) {
            this.rpc.releaseDevice(this.id);
        }
        return this.references;
    }

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
