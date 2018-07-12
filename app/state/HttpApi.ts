import { TokenStore } from "@app/state/TokenStore";
import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";

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

        this.tokenStore = new TokenStore(this);
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

}
