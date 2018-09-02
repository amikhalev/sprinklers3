import { action } from "mobx";

import { TokenStore } from "@client/state/TokenStore";
import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import {
  TokenGrantPasswordRequest,
  TokenGrantRefreshRequest,
  TokenGrantResponse
} from "@common/httpApi";
import log from "@common/logger";
import { DefaultEvents, TypedEventEmitter } from "@common/TypedEventEmitter";

export { ApiError };

interface HttpApiEvents extends DefaultEvents {
  tokenGranted(response: TokenGrantResponse): void;
  error(err: ApiError): void;
  tokenError(err: ApiError): void;
}

export default class HttpApi extends TypedEventEmitter<HttpApiEvents> {
  baseUrl: string;

  tokenStore: TokenStore;

  private get authorizationHeader(): {} | { Authorization: string } {
    if (!this.tokenStore.accessToken) {
      return {};
    }
    return { Authorization: `Bearer ${this.tokenStore.accessToken.token}` };
  }

  constructor(
    baseUrl: string = `${location.protocol}//${location.hostname}:${
      location.port
    }/api`
  ) {
    super();
    while (baseUrl.charAt(baseUrl.length - 1) === "/") {
      baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }
    this.baseUrl = baseUrl;

    this.tokenStore = new TokenStore();

    this.on("error", (err: ApiError) => {
      if (err.code === ErrorCode.BadToken) {
        this.emit("tokenError", err);
      }
    });

    this.on("tokenGranted", this.onTokenGranted);
  }

  async makeRequest(
    url: string,
    options?: RequestInit,
    body?: any
  ): Promise<any> {
    try {
      options = options || {};
      options = {
        headers: {
          "Content-Type": "application/json",
          ...this.authorizationHeader,
          ...(options.headers || {})
        },
        body: JSON.stringify(body),
        ...options
      };
      let response: Response;
      try {
        response = await fetch(this.baseUrl + url, options);
      } catch (err) {
        throw new ApiError("Http request error", ErrorCode.Internal, err);
      }
      let responseBody: any;
      try {
        responseBody = (await response.json()) || {};
      } catch (e) {
        throw new ApiError("Invalid JSON response", ErrorCode.Internal, e);
      }
      if (!response.ok) {
        throw new ApiError(
          responseBody.message || response.statusText,
          responseBody.code,
          responseBody.data
        );
      }
      return responseBody;
    } catch (err) {
      this.emit("error", err);
      throw err;
    }
  }

  async grantPassword(username: string, password: string) {
    const request: TokenGrantPasswordRequest = {
      grant_type: "password",
      username,
      password
    };
    const response: TokenGrantResponse = await this.makeRequest(
      "/token/grant",
      {
        method: "POST"
      },
      request
    );
    this.emit("tokenGranted", response);
  }

  async grantRefresh() {
    const { refreshToken } = this.tokenStore;
    if (!refreshToken.isValid) {
      throw new ApiError("can not grant refresh with invalid refresh_token");
    }
    const request: TokenGrantRefreshRequest = {
      grant_type: "refresh",
      refresh_token: refreshToken.token!
    };
    const response: TokenGrantResponse = await this.makeRequest(
      "/token/grant",
      {
        method: "POST"
      },
      request
    );
    this.emit("tokenGranted", response);
  }

  @action.bound
  private onTokenGranted(response: TokenGrantResponse) {
    this.tokenStore.accessToken.token = response.access_token;
    this.tokenStore.refreshToken.token = response.refresh_token;
    this.tokenStore.saveLocalStorage();
    const { accessToken, refreshToken } = this.tokenStore;
    log.debug(
      {
        accessToken: accessToken.claims,
        refreshToken: refreshToken.claims
      },
      "got new tokens"
    );
  }
}
