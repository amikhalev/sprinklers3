import { createBrowserHistory, History } from "history";
import { computed, configure, when } from "mobx";
import { RouterStore, syncHistoryWithStore } from "mobx-react-router";

import { WebSocketRpcClient } from "@client/sprinklersRpc/WebSocketRpcClient";
import HttpApi from "@client/state/HttpApi";
import { UiStore } from "@client/state/UiStore";
import { UserStore } from "@client/state/UserStore";
import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import log from "@common/logger";
import { DefaultEvents, TypedEventEmitter } from "@common/TypedEventEmitter";

interface AppEvents extends DefaultEvents {
    checkToken(): void;
    hasToken(): void;
}

export default class AppState extends TypedEventEmitter<AppEvents> {
    history: History = createBrowserHistory();
    routerStore = new RouterStore();
    uiStore = new UiStore();
    userStore = new UserStore();
    httpApi = new HttpApi();
    tokenStore = this.httpApi.tokenStore;
    sprinklersRpc = new WebSocketRpcClient(this.tokenStore);

    constructor() {
        super();
        this.sprinklersRpc.on("newUserData", this.userStore.receiveUserData);
        this.sprinklersRpc.on("tokenError", this.clearToken);
        this.httpApi.on("tokenGranted", () => this.emit("hasToken"));
        this.httpApi.on("tokenError", this.clearToken);

        this.on("checkToken", this.doCheckToken);

        this.on("hasToken", () => {
            when(() => !this.tokenStore.accessToken.isValid, this.checkToken);
            this.sprinklersRpc.start();
        });
    }

    @computed get isLoggedIn() {
        return this.tokenStore.accessToken.isValid;
    }

    async start() {
        configure({
            enforceActions: true,
        });

        syncHistoryWithStore(this.history, this.routerStore);
        await this.tokenStore.loadLocalStorage();

        await this.checkToken();
    }

    clearToken = (err?: any) => {
        this.tokenStore.clearAccessToken();
        this.checkToken();
    }

    checkToken = () => {
        this.emit("checkToken");
    }

    private doCheckToken = async () => {
        const { accessToken, refreshToken } = this.tokenStore;
        accessToken.updateCurrentTime();
        if (accessToken.isValid) { // if the access token is valid, we are good
            this.emit("hasToken");
            return;
        }
        if (!refreshToken.isValid) { // if the refresh token is not valid, need to login again
            this.history.push("/login");
            return;
        }
        try {
            await this.httpApi.grantRefresh();
            this.emit("hasToken");
        } catch (err) {
            if (err instanceof ApiError && err.code === ErrorCode.BadToken) {
                log.warn({ err }, "refresh is bad for some reason, erasing");
                this.tokenStore.clearAll();
                this.history.push("/login");
            } else {
                log.error({ err }, "could not refresh access token");
                // TODO: some kind of error page?
            }
        }
    }
}
