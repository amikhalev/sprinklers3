import { ISprinklersApi } from "@common/sprinklers";
import { UiStore } from "./UiStore";

export default abstract class StateBase {
    abstract readonly sprinklersApi: ISprinklersApi;
    uiStore = new UiStore();

    start() {
        this.sprinklersApi.start();
    }
}
