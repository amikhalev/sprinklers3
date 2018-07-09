import { createBrowserHistory, History } from "history";
import { computed } from "mobx";
import { RouterStore, syncHistoryWithStore } from "mobx-react-router";

import { WebSocketRpcClient } from "@app/sprinklersRpc/websocketClient";
import HttpApi from "@app/state/HttpApi";
import { UiStore } from "@app/state/UiStore";
import log from "@common/logger";

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
                try {
                    await this.httpApi.tokenStore.grantRefresh();
                } catch (err) {
                    log.warn({ err }, "could not refresh access token. erasing token");
                    this.tokenStore.clear();
                    this.history.push("/login");
                }
            } else {
                this.history.push("/login");
            }
        }

        this.sprinklersRpc.start();
    }
}
