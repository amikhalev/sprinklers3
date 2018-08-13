import { TokenStore } from "@client/state/TokenStore";
import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import { TokenGrantPasswordRequest, TokenGrantRefreshRequest, TokenGrantResponse } from "@common/httpApi";
import log from "@common/logger";
import { runInAction } from "mobx";

export { ApiError };

export default class HttpApi {
    baseUrl: string;

    tokenStore: TokenStore;

    private get authorizationHeader(): {} | { "Authorization": string } {
        if (!this.tokenStore.accessToken) {
            return {};
        }
        return { Authorization: `Bearer ${this.tokenStore.accessToken.token}` };
    }

    constructor(baseUrl: string = `${location.protocol}//${location.hostname}:${location.port}/api`) {
        while (baseUrl.charAt(baseUrl.length - 1) === "/") {
            baseUrl = baseUrl.substring(0, baseUrl.length - 1);
        }
        this.baseUrl = baseUrl;

        this.tokenStore = new TokenStore();
    }

    async makeRequest(url: string, options?: RequestInit, body?: any): Promise<any> {
        options = options || {};
        options = {
            headers: {
                "Content-Type": "application/json",
                ...this.authorizationHeader,
                ...options.headers || {},
            },
            body: JSON.stringify(body),
            ...options,
        };
        const response = await fetch(this.baseUrl + url, options);
        let responseBody: any;
        try {
            responseBody = await response.json() || {};
        } catch (e) {
            throw new ApiError("Invalid JSON response", ErrorCode.Internal, e);
        }
        if (!response.ok) {
            throw new ApiError(responseBody.message || response.statusText, responseBody.code, responseBody.data);
        }
        return responseBody;
    }

    async grantPassword(username: string, password: string) {
        const request: TokenGrantPasswordRequest = {
            grant_type: "password", username, password,
        };
        const response: TokenGrantResponse = await this.makeRequest("/token/grant", {
            method: "POST",
        }, request);
        runInAction("grantPasswordSuccess", () => {
            this.tokenStore.accessToken.token = response.access_token;
            this.tokenStore.refreshToken.token = response.refresh_token;
            this.tokenStore.saveLocalStorage();
        });
        const { accessToken } = this.tokenStore;
        log.debug({ aud: accessToken.claims!.aud }, "got password grant tokens");
    }

    async grantRefresh() {
        const { refreshToken } = this.tokenStore;
        if (!refreshToken.isValid) {
            throw new ApiError("can not grant refresh with invalid refresh_token");
        }
        const request: TokenGrantRefreshRequest = {
            grant_type: "refresh", refresh_token: refreshToken.token!,
        };
        const response: TokenGrantResponse = await this.makeRequest("/token/grant", {
            method: "POST",
        }, request);
        runInAction("grantRefreshSuccess", () => {
            this.tokenStore.accessToken.token = response.access_token;
            this.tokenStore.refreshToken.token = response.refresh_token;
            this.tokenStore.saveLocalStorage();
        });
        const { accessToken } = this.tokenStore;
        log.debug({ aud: accessToken.claims!.aud }, "got refresh grant tokens");
    }
}
