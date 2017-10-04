import { SprinklersDevice } from "./SprinklersDevice";

export interface ISprinklersApi {
    start(): void;

    getDevice(id: string): SprinklersDevice;

    removeDevice(id: string): void;
}
