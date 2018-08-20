import { autorun, runInAction, when } from "mobx";

import { ErrorCode } from "@common/ErrorCode";
import * as deviceRequests from "@common/sprinklersRpc/deviceRequests";
import * as s from "@common/sprinklersRpc/index";
import * as ws from "@common/sprinklersRpc/websocketData";
import { log, WebSocketRpcClient } from "./WebSocketRpcClient";

// tslint:disable:member-ordering
export class WSSprinklersDevice extends s.SprinklersDevice {
    readonly api: WebSocketRpcClient;
    private _id: string;
    constructor(api: WebSocketRpcClient, id: string) {
        super();
        this.api = api;
        this._id = id;
        autorun(this.updateConnectionState);
        this.waitSubscribe();
    }
    get id() {
        return this._id;
    }
    private updateConnectionState = () => {
        const { clientToServer, serverToBroker } = this.api.connectionState;
        runInAction("updateConnectionState", () => {
            Object.assign(this.connectionState, { clientToServer, serverToBroker });
        });
    }

    async subscribe() {
        const subscribeRequest: ws.IDeviceSubscribeRequest = {
            deviceId: this.id,
        };
        try {
            await this.api.makeRequest("deviceSubscribe", subscribeRequest);
            runInAction("deviceSubscribeSuccess", () => {
                this.connectionState.brokerToDevice = true;
            });
        } catch (err) {
            runInAction("deviceSubscribeError", () => {
                this.connectionState.brokerToDevice = false;
                if ((err as ws.IError).code === ErrorCode.NoPermission) {
                    this.connectionState.hasPermission = false;
                } else {
                    log.error({ err });
                }
            });
        }
    }

    makeRequest(request: deviceRequests.Request): Promise<deviceRequests.Response> {
        return this.api.makeDeviceCall(this.id, request);
    }

    waitSubscribe = () => {
        when(() => this.api.authenticated, () => {
            this.subscribe();
            when(() => !this.api.authenticated, this.waitSubscribe);
        });
    }
}
