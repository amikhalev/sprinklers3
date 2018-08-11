export interface BaseClaims {
    iss: string;
    exp?: number;
}

export interface AccessToken extends BaseClaims {
    type: "access";
    aud: number;
    name: string;
}

export interface RefreshToken extends BaseClaims {
    type: "refresh";
    aud: number;
    name: string;
}

export interface DeviceRegistrationToken extends BaseClaims {
    type: "device_reg";
}

export type TokenClaims = AccessToken | RefreshToken | DeviceRegistrationToken;
