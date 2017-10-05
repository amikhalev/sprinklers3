import { ISprinklersApi } from "@common/sprinklers";
import { MqttApiClient } from "@common/sprinklers/mqtt";
import { WebApiClient } from "./web";

import { UiMessage, UiStore } from "./ui";
export { UiMessage, UiStore };
export * from "./inject";

export abstract class StateBase {
    abstract readonly sprinklersApi: ISprinklersApi;
    uiStore = new UiStore();

    constructor() {
        this.uiStore.addMessage({ header: "asdf", content: "boo!", error: true });
    }

    start() {
        this.sprinklersApi.start();
    }
}

export class MqttApiState extends StateBase {
    sprinklersApi = new MqttApiClient(`ws://${location.hostname}:1884`);
}

export class WebApiState extends StateBase {
    sprinklersApi = new WebApiClient();
}

// const state = new State();

// export default state;
