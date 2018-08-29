import { autorun, runInAction, when } from "mobx";

import { ErrorCode } from "@common/ErrorCode";
import * as deviceRequests from "@common/sprinklersRpc/deviceRequests";
import * as s from "@common/sprinklersRpc/index";
import * as ws from "@common/sprinklersRpc/websocketData";
import { log, WebSocketRpcClient } from "./WebSocketRpcClient";

// tslint:disable:member-ordering
export class WSSprinklersDevice extends s.SprinklersDevice {
    readonly api: WebSocketRpcClient;

    constructor(api: WebSocketRpcClient, id: string) {
        super(api, id);
        this.api = api;

        autorun(this.updateConnectionState);
        this.waitSubscribe();
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
                this.connectionState.hasPermission = true;
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

    async unsubscribe() {
        const unsubscribeRequest: ws.IDeviceSubscribeRequest = {
            deviceId: this.id,
        };
        try {
            await this.api.makeRequest("deviceUnsubscribe", unsubscribeRequest);
            runInAction("deviceUnsubscribeSuccess", () => {
                this.connectionState.brokerToDevice = false;
            });
        } catch (err) {
            log.error({ err }, "error unsubscribing from device");
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
