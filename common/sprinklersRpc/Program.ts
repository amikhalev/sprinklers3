import { observable } from "mobx";
import { serialize } from "serializr";

import { Schedule } from "./schedule";
import * as schema from "./schema";
import { SprinklersDevice } from "./SprinklersDevice";

export class ProgramItem {
  // the section number
  readonly section!: number;
  // duration of the run, in seconds
  readonly duration!: number;

  constructor(data?: Partial<ProgramItem>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class Program {
  readonly device: SprinklersDevice;
  readonly id: number;

  @observable
  name: string = "";
  @observable
  enabled: boolean = false;
  @observable
  schedule: Schedule = new Schedule();
  @observable.shallow
  sequence: ProgramItem[] = [];
  @observable
  running: boolean = false;

  constructor(device: SprinklersDevice, id: number, data?: Partial<Program>) {
    this.device = device;
    this.id = id;
    if (data) {
      Object.assign(this, data);
    }
  }

  run() {
    return this.device.runProgram({ programId: this.id });
  }

  cancel() {
    return this.device.cancelProgram({ programId: this.id });
  }

  update() {
    const data = serialize(schema.program, this);
    return this.device.updateProgram({ programId: this.id, data });
  }

  clone(): Program {
    return new Program(this.device, this.id, {
      name: this.name,
      enabled: this.enabled,
      running: this.running,
      schedule: this.schedule.clone(),
      sequence: this.sequence.slice()
    });
  }

  toString(): string {
    return (
      `Program{name="${this.name}", enabled=${this.enabled}, schedule=${
        this.schedule
      }, ` + `sequence=${this.sequence}, running=${this.running}}`
    );
  }
}
