import { createBrowserHistory, History } from "history";
import { computed } from "mobx";
import { RouterStore, syncHistoryWithStore } from "mobx-react-router";

import { WebSocketRpcClient } from "@app/sprinklersRpc/WebSocketRpcClient";
import HttpApi from "@app/state/HttpApi";
import { UiStore } from "@app/state/UiStore";
import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import log from "@common/logger";

export default class AppState {
    history: History = createBrowserHistory();
    routerStore = new RouterStore();
    uiStore = new UiStore();
    httpApi = new HttpApi();
    tokenStore = this.httpApi.tokenStore;
    sprinklersRpc = new WebSocketRpcClient(this.tokenStore);

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
                    if (err instanceof ApiError && err.code === ErrorCode.BadToken) {
                        log.warn({ err }, "refresh is bad for some reason, erasing");
                        this.tokenStore.clear();
                        this.history.push("/login");
                    } else {
                        log.error({ err }, "could not refresh access token");
                        // TODO: some kind of error page?
                    }
                }
            } else {
                this.history.push("/login");
            }
        }

        this.sprinklersRpc.start();
    }
}
