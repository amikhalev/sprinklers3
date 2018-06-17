import { computed, observable } from "mobx";

export class ConnectionState {
    /**
     * Represents if a client is connected to the sprinklers3 server (eg. via websocket)
     * Can be null if there is no client involved
     */
    @observable clientToServer: boolean | null = null;

    /**
     * Represents if the sprinklers3 server is connected to the broker (eg. via mqtt)
     * Can be null if there is no broker involved
     */
    @observable serverToBroker: boolean | null = null;

    /**
     * Represents if the device is connected to the broker and we can communicate with it (eg. via mqtt)
     * Can be null if there is no device involved
     */
    @observable brokerToDevice: boolean | null = null;

    @computed get isConnected(): boolean {
        if (this.brokerToDevice != null) {
            return this.brokerToDevice;
        }
        if (this.serverToBroker != null) {
            return this.serverToBroker;
        }
        if (this.clientToServer != null) {
            return this.clientToServer;
        }
        return false;
    }
}
