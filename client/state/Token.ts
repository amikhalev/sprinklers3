import { TokenClaims } from "@common/TokenClaims";
import * as jwt from "jsonwebtoken";
import { computed, createAtom, IAtom, observable } from "mobx";

export class Token<TClaims extends TokenClaims = TokenClaims> {
  @observable
  token: string | null;

  @computed
  get claims(): TClaims | null {
    if (this.token == null) {
      return null;
    }
    return jwt.decode(this.token) as any;
  }

  private isExpiredAtom: IAtom;
  private currentTime!: number;
  private expirationTimer: number | undefined;

  constructor(token: string | null = null) {
    this.token = token;
    this.isExpiredAtom = createAtom(
      "Token.isExpired",
      this.startUpdating,
      this.stopUpdating
    );
    this.updateCurrentTime();
  }

  toJSON() {
    return this.token;
  }

  updateCurrentTime = (reportChanged: boolean = true) => {
    if (reportChanged) {
      this.isExpiredAtom.reportChanged();
    }
    this.currentTime = Date.now() / 1000;
  };

  get remainingTime(): number {
    if (!this.isExpiredAtom.reportObserved()) {
      this.updateCurrentTime(false);
    }
    if (this.claims == null || this.claims.exp == null) {
      return Number.NEGATIVE_INFINITY;
    }
    return this.claims.exp - this.currentTime;
  }

  private startUpdating = () => {
    this.stopUpdating();
    const remaining = this.remainingTime;
    if (remaining > 0) {
      this.expirationTimer = setTimeout(
        this.updateCurrentTime,
        this.remainingTime
      );
    }
  };

  private stopUpdating = () => {
    if (this.expirationTimer != null) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = undefined;
    }
  };

  get isExpired() {
    return this.remainingTime <= 0;
  }

  @computed
  get isValid() {
    return this.token != null && !this.isExpired;
  }
}
