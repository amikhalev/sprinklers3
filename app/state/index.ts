import { MqttApiClient } from "@common/mqtt";
import { ISprinklersApi } from "@common/sprinklers";

import { UiMessage, UiStore } from "./ui";
export { UiMessage, UiStore };
export * from "./inject";

export interface IState {
    sprinklersApi: ISprinklersApi;
    uiStore: UiStore;
}

export class State implements IState {
    sprinklersApi: ISprinklersApi = new MqttApiClient(`ws://${location.hostname}:1884`);
    uiStore = new UiStore();

    constructor() {
        this.uiStore.addMessage({ header: "asdf", content: "boo!", error: true });
    }

    start() {
        this.sprinklersApi.start();
    }
}

// const state = new State();

// export default state;
