import { createBrowserHistory, History } from "history";
import { computed } from "mobx";
import { RouterStore, syncHistoryWithStore } from "mobx-react-router";

import { WebSocketRpcClient } from "@client/sprinklersRpc/WebSocketRpcClient";
import HttpApi from "@client/state/HttpApi";
import { UiStore } from "@client/state/UiStore";
import { UserStore } from "@client/state/UserStore";
import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import log from "@common/logger";

export default class AppState {
    history: History = createBrowserHistory();
    routerStore = new RouterStore();
    uiStore = new UiStore();
    userStore = new UserStore();
    httpApi = new HttpApi();
    tokenStore = this.httpApi.tokenStore;
    sprinklersRpc = new WebSocketRpcClient(this.tokenStore, this.userStore);

    @computed get isLoggedIn() {
        return this.tokenStore.accessToken.isValid;
    }

    async start() {
        syncHistoryWithStore(this.history, this.routerStore);
        this.tokenStore.loadLocalStorage();

        await this.checkToken();
        await this.sprinklersRpc.start();
    }

    async checkToken() {
        const { tokenStore: { accessToken, refreshToken } } = this.httpApi;
        if (accessToken.isValid) { // if the access token is valid, we are good
            return;
        }
        if (!refreshToken.isValid) { // if the refresh token is not valid, need to login again
            this.history.push("/login");
            return;
        }
        try {
            await this.httpApi.grantRefresh();
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
    }
}
