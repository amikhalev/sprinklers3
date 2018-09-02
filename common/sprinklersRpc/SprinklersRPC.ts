import { ConnectionState } from "./ConnectionState";
import { SprinklersDevice } from "./SprinklersDevice";

export abstract class SprinklersRPC {
  abstract readonly connectionState: ConnectionState;
  abstract readonly connected: boolean;

  abstract start(): void;

  /**
   * Acquires a reference to a device. This reference must be released by calling
   * SprinklersDevice#release for every time this method was called
   * @param id The id of the device
   */
  acquireDevice(id: string): SprinklersDevice {
    const device = this.getDevice(id);
    device.acquire();
    return device;
  }

  /**
   * Forces a device to be released. The device will no longer be updated.
   *
   * This should not be used normally, instead SprinklersDevice#release should be called to manage
   * each reference to a device.
   * @param id The id of the device to remove
   */
  abstract releaseDevice(id: string): void;

  protected abstract getDevice(id: string): SprinklersDevice;
}
