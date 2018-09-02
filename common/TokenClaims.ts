export interface BaseClaims {
  iss: string;
  exp?: number;
}

export interface AccessToken {
  type: "access";
  aud: number;
  name: string;
}

export interface RefreshToken {
  type: "refresh";
  aud: number;
  name: string;
}

export interface DeviceRegistrationToken {
  type: "device_reg";
}

export interface DeviceToken {
  type: "device";
  aud: string;
  id: number;
}

export interface SuperuserToken {
  type: "superuser";
}

export type TokenClaimTypes =
  | AccessToken
  | RefreshToken
  | DeviceRegistrationToken
  | DeviceToken
  | SuperuserToken;

export type TokenClaims = TokenClaimTypes & BaseClaims;
