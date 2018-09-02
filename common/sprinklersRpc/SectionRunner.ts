import { observable } from "mobx";
import { SprinklersDevice } from "./SprinklersDevice";

export class SectionRun {
  readonly sectionRunner: SectionRunner;
  readonly id: number;
  section: number;
  totalDuration: number = 0;
  duration: number = 0;
  startTime: Date | null = null;
  pauseTime: Date | null = null;
  unpauseTime: Date | null = null;

  constructor(
    sectionRunner: SectionRunner,
    id: number = 0,
    section: number = 0
  ) {
    this.sectionRunner = sectionRunner;
    this.id = id;
    this.section = section;
  }

  cancel = () => this.sectionRunner.cancelRunById(this.id);

  toString() {
    return (
      `SectionRun{id=${this.id}, section=${this.section}, duration=${
        this.duration
      },` + ` startTime=${this.startTime}, pauseTime=${this.pauseTime}}`
    );
  }
}

export class SectionRunner {
  readonly device: SprinklersDevice;

  @observable
  queue: SectionRun[] = [];
  @observable
  current: SectionRun | null = null;
  @observable
  paused: boolean = false;

  constructor(device: SprinklersDevice) {
    this.device = device;
  }

  cancelRunById(runId: number) {
    return this.device.cancelSectionRunId({ runId });
  }

  setPaused(paused: boolean) {
    return this.device.pauseSectionRunner({ paused });
  }

  pause() {
    return this.setPaused(true);
  }

  unpause() {
    return this.setPaused(false);
  }

  toString(): string {
    return `SectionRunner{queue="${this.queue}", current="${
      this.current
    }", paused=${this.paused}}`;
  }
}
