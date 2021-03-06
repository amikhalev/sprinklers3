export interface TokenGrantPasswordRequest {
    grant_type: "password";
    username: string;
    password: string;
}

export interface TokenGrantRefreshRequest {
    grant_type: "refresh";
    refresh_token: string;
}

export type TokenGrantRequest = TokenGrantPasswordRequest | TokenGrantRefreshRequest;

export interface TokenGrantResponse {
    access_token: string;
    refresh_token: string;
}

export interface IUser {
    id: number;
    username: string;
    name: string;
    devices: ISprinklersDevice[] | undefined;
}

export interface ISprinklersDevice {
    id: number;
    deviceId: string | null;
    name: string;
    users: IUser[] | undefined;
}
