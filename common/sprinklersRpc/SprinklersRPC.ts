import { ConnectionState } from "./ConnectionState";
import { SprinklersDevice } from "./SprinklersDevice";

export interface SprinklersRPC {
    readonly connectionState: ConnectionState;
    readonly connected: boolean;

    start(): void;

    getDevice(id: string): SprinklersDevice;

    removeDevice(id: string): void;
}
