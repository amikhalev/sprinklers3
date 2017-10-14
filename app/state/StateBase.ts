import { ISprinklersApi } from "@common/sprinklers";
import { UiStore } from "./ui";

export default abstract class StateBase {
    abstract readonly sprinklersApi: ISprinklersApi;
    uiStore = new UiStore();

    start() {
        this.sprinklersApi.start();
    }
}
