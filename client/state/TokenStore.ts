import { observable } from "mobx";

import { Token } from "@client/state/Token";
import { AccessToken, RefreshToken } from "@common/TokenClaims";

const LOCAL_STORAGE_KEY = "TokenStore";

export class TokenStore {
    @observable accessToken: Token<AccessToken> = new Token();
    @observable refreshToken: Token<RefreshToken> = new Token();

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

    toJSON() {
        return { accessToken: this.accessToken.toJSON(), refreshToken: this.refreshToken.toJSON() };
    }

    updateFromJson(json: any) {
        this.accessToken.token = json.accessToken;
        this.refreshToken.token = json.refreshToken;
    }
}
