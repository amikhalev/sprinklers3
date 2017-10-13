import { ISprinklersApi } from "@common/sprinklers";
import { UiMessage, UiStore } from "./ui";

export default abstract class StateBase {
    abstract readonly sprinklersApi: ISprinklersApi;
    uiStore = new UiStore();

    start() {
        this.sprinklersApi.start();
    }
}
