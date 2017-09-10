import { MqttApiClient } from "@app/mqtt";
import { Message, UiStore } from "@app/ui";
import { ISprinklersApi, SprinklersDevice } from "@common/sprinklers";

export class State {
    client: ISprinklersApi = new MqttApiClient();
    device: SprinklersDevice;
    uiStore = new UiStore();

    constructor() {
        const device = this.client.getDevice("grinklers");
        this.uiStore.addMessage({ header: "asdf", content: "boo!", error: true });
    }

    start() {
        this.client.start();
    }
}

const state = new State();

export default state;
