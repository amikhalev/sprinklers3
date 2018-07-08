import { WebSocketRpcClient } from "@app/sprinklersRpc/websocketClient";
import HttpApi from "@app/state/HttpApi";
import { UiStore } from "@app/state/UiStore";
import { createBrowserHistory, History } from "history";
import { computed } from "mobx";
import { RouterStore, syncHistoryWithStore } from "mobx-react-router";

const isDev = process.env.NODE_ENV === "development";
const websocketPort = isDev ? 8080 : location.port;

export default class AppState {
    history: History = createBrowserHistory();
    routerStore = new RouterStore();
    uiStore = new UiStore();
    httpApi = new HttpApi();
    tokenStore = this.httpApi.tokenStore;
    sprinklersRpc = new WebSocketRpcClient(`ws://${location.hostname}:${websocketPort}`,
        this.tokenStore);

    @computed get isLoggedIn() {
        return this.tokenStore.accessToken.isValid;
    }

    async start() {
        syncHistoryWithStore(this.history, this.routerStore);

        this.tokenStore.loadLocalStorage();

        if (!this.httpApi.tokenStore.accessToken.isValid) {
            if (this.httpApi.tokenStore.refreshToken.isValid) {
                await this.httpApi.tokenStore.grantRefresh();
            } else {
                this.history.push("/login");
            }
        }

        this.sprinklersRpc.start();
    }
}
