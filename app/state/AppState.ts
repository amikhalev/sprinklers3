import { WebSocketRpcClient } from "@app/sprinklersRpc/websocketClient";
import HttpApi from "@app/state/HttpApi";
import { UiStore } from "@app/state/UiStore";
import { createBrowserHistory, History } from "history";

const isDev = process.env.NODE_ENV === "development";
const websocketPort = isDev ? 8080 : location.port;

export default class AppState {
    history: History = createBrowserHistory();
    uiStore = new UiStore();
    httpApi = new HttpApi();
    tokenStore = this.httpApi.tokenStore;
    sprinklersRpc = new WebSocketRpcClient(`ws://${location.hostname}:${websocketPort}`,
        this.tokenStore);

    async start() {
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
