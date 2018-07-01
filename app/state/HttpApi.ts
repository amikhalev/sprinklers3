import { Token } from "@app/state/Token";
import { TokenStore } from "@app/state/TokenStore";

export class HttpApiError extends Error {
    name = "HttpApiError";
    status: number;

    constructor(message: string, status: number = 500) {
        super(message);
        this.status = status;
    }
}

export default class HttpApi {
    baseUrl: string;

    tokenStore: TokenStore;

    private get authorizationHeader(): {} | { "Authorization": string } {
        if (!this.tokenStore.accessToken) {
            return {};
        }
        return { Authorization: `Bearer ${this.tokenStore.accessToken.token}` };
    }

    constructor(baseUrl: string = `http://${location.hostname}:${location.port}/api`) {
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
        const responseBody = await response.json() || {};
        if (!response.ok) {
            throw new HttpApiError(responseBody.message || response.statusText, response.status);
        }
        return responseBody;
    }

}
