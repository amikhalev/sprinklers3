export interface BaseClaims {
    iss: string;
    exp?: number;
}

export interface AccessOrRefreshToken extends BaseClaims {
    type: "access" | "refresh";
    aud: number;
    name: string;
}

export interface DeviceRegistrationToken extends BaseClaims {
    type: "device_reg";
}

export type TokenClaims = AccessOrRefreshToken | DeviceRegistrationToken;
