import { observable } from "mobx";

import HttpApi, { ApiError } from "@app/state/HttpApi";
import { Token } from "@app/state/Token";
import { TokenGrantPasswordRequest, TokenGrantRefreshRequest, TokenGrantResponse } from "@common/httpApi";
import logger from "@common/logger";

const log = logger.child({ source: "TokenStore"});

const LOCAL_STORAGE_KEY = "TokenStore";

export class TokenStore {
    @observable accessToken: Token = new Token();
    @observable refreshToken: Token = new Token();

    private api: HttpApi;

    constructor(api: HttpApi) {
        this.api = api;
    }

    clear() {
        this.accessToken.token = null;
        this.refreshToken.token = null;
        this.saveLocalStorage();
    }

    saveLocalStorage() {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.toJSON()));
    }

    loadLocalStorage() {
        const data = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (data) {
            const data2 = JSON.parse(data);
            this.updateFromJson(data2);
        }
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
        this.saveLocalStorage();
        log.debug({ aud: this.accessToken.claims!.aud }, "got password grant tokens");
    }

    async grantRefresh() {
        if (!this.refreshToken.isValid) {
            throw new ApiError("can not grant refresh with invalid refresh_token");
        }
        const request: TokenGrantRefreshRequest = {
            grant_type: "refresh", refresh_token: this.refreshToken.token!,
        };
        const response: TokenGrantResponse = await this.api.makeRequest("/token/grant", {
            method: "POST",
        }, request);
        this.accessToken.token = response.access_token;
        this.refreshToken.token = response.refresh_token;
        this.saveLocalStorage();
        log.debug({ aud: this.accessToken.claims!.aud }, "got refresh grant tokens");
    }

    toJSON() {
        return { accessToken: this.accessToken.toJSON(), refreshToken: this.refreshToken.toJSON() };
    }

    updateFromJson(json: any) {
        this.accessToken.token = json.accessToken;
        this.refreshToken.token = json.refreshToken;
    }
}
