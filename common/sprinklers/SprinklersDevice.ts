import { observable } from "mobx";
import { Duration } from "./Duration";
import { Program } from "./Program";
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
    abstract runSection(section: number | Section, duration: Duration): Promise<{}>;
    abstract runProgram(program: number | Program): Promise<{}>;
    abstract cancelSectionRunById(id: number): Promise<{}>;
    abstract pauseSectionRunner(): Promise<{}>;
    abstract unpauseSectionRunner(): Promise<{}>;

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
