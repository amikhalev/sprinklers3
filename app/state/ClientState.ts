import { WebSocketApiClient } from "@app/sprinklersRpc/websocketClient";
import HttpApi from "@app/state/HttpApi";
import { UiStore } from "@app/state/UiStore";

const isDev = process.env.NODE_ENV === "development";
const websocketPort = isDev ? 8080 : location.port;

export default class ClientState {
    sprinklersApi = new WebSocketApiClient(`ws://${location.hostname}:${websocketPort}`);
    uiStore = new UiStore();
    httpApi = new HttpApi();

    async start() {
        if (!this.httpApi.tokenStore.accessToken.isValid) {
            if (this.httpApi.tokenStore.refreshToken.isValid) {
                await this.httpApi.tokenStore.grantRefresh();
            } else {
                await this.httpApi.tokenStore.grantPassword("alex", "kakashka");
            }
        }

        this.sprinklersApi.accessToken = this.httpApi.tokenStore.accessToken.token!;

        this.sprinklersApi.start();
    }
}
