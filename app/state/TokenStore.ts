import { observable } from "mobx";

import HttpApi, { HttpApiError } from "@app/state/HttpApi";
import { Token } from "@app/state/Token";
import { TokenGrantPasswordRequest, TokenGrantRefreshRequest, TokenGrantResponse } from "@common/http";
import logger from "@common/logger";

const log = logger.child({ source: "TokenStore"});

export class TokenStore {
    @observable accessToken: Token = new Token();
    @observable refreshToken: Token = new Token();

    private api: HttpApi;

    constructor(api: HttpApi) {
        this.api = api;
    }

    async grantPassword(username: string, password: string) {
        const request: TokenGrantPasswordRequest = {
            grant_type: "password", username, password,
        };
        const response: TokenGrantResponse = await this.api.makeRequest("/token/grant", {
            method: "POST",
        }, request);
        this.accessToken.token = response.access_token;
        this.refreshToken.token = response.refresh_token;
        log.debug({ aud: this.accessToken.claims!.aud }, "got password grant tokens");
    }

    async grantRefresh() {
        if (!this.refreshToken.isValid) {
            throw new HttpApiError("can not grant refresh with invalid refresh_token");
        }
        const request: TokenGrantRefreshRequest = {
            grant_type: "refresh", refresh_token: this.refreshToken.token!,
        };
        const response: TokenGrantResponse = await this.api.makeRequest("/token/grant", {
            method: "POST",
        }, request);
        this.accessToken.token = response.access_token;
        this.refreshToken.token = response.refresh_token;
        log.debug({ aud: this.accessToken.claims!.aud }, "got refresh grant tokens");
    }
}
