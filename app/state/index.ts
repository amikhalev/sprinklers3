import { MqttApiClient } from "@app/mqtt";
import { ISprinklersApi, SprinklersDevice } from "@common/sprinklers";

import { UiMessage, UiStore } from "./ui";
export { UiMessage, UiStore };
export * from "./inject";

export class State {
    client: ISprinklersApi = new MqttApiClient();
    device: SprinklersDevice;
    uiStore = new UiStore();

    constructor() {
        this.device = this.client.getDevice("grinklers");
        this.uiStore.addMessage({ header: "asdf", content: "boo!", error: true });
    }

    start() {
        this.client.start();
    }
}

// const state = new State();

// export default state;
