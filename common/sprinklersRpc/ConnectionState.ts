import { computed, observable } from "mobx";

export class ConnectionState {
  /**
   * Represents if a client is connected to the sprinklers3 server (eg. via websocket)
   * Can be null if there is no client involved
   */
  @observable
  clientToServer: boolean | null = null;

  /**
   * Represents if the sprinklers3 server is connected to the broker (eg. via mqtt)
   * Can be null if there is no broker involved
   */
  @observable
  serverToBroker: boolean | null = null;

  /**
   * Represents if the device is connected to the broker and we can communicate with it (eg. via mqtt)
   * Can be null if there is no device involved
   */
  @observable
  brokerToDevice: boolean | null = null;

  /**
   * Represents if whoever is trying to access this device has permission to access it.
   * Is null if there is no concept of access involved.
   */
  @observable
  hasPermission: boolean | null = null;

  @computed
  get noPermission() {
    return this.hasPermission === false;
  }

  @computed
  get isAvailable(): boolean {
    if (this.hasPermission === false) {
      return false;
    }
    if (this.brokerToDevice != null) {
      return true;
    }
    if (this.serverToBroker != null) {
      return this.serverToBroker;
    }
    if (this.clientToServer != null) {
      return this.clientToServer;
    }
    return false;
  }

  @computed
  get isDeviceConnected(): boolean | null {
    if (this.hasPermission === false) {
      return false;
    }
    if (this.serverToBroker === false || this.clientToServer === false) {
      return null;
    }
    if (this.brokerToDevice != null) {
      return this.brokerToDevice;
    }
    return null;
  }

  @computed
  get isServerConnected(): boolean | null {
    if (this.hasPermission === false) {
      return false;
    }
    if (this.serverToBroker != null) {
      return this.serverToBroker;
    }
    if (this.clientToServer != null) {
      return this.brokerToDevice;
    }
    return null;
  }
}
