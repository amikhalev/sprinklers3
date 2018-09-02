import { observable } from "mobx";
import { SprinklersDevice } from "./SprinklersDevice";

export class Section {
  readonly device: SprinklersDevice;
  readonly id: number;

  @observable
  name: string = "";
  @observable
  state: boolean = false;

  constructor(device: SprinklersDevice, id: number) {
    this.device = device;
    this.id = id;
  }

  /** duration is in seconds */
  run(duration: number) {
    return this.device.runSection({ sectionId: this.id, duration });
  }

  cancel() {
    return this.device.cancelSection({ sectionId: this.id });
  }

  toString(): string {
    return `Section ${this.id}: '${this.name}'`;
  }
}
