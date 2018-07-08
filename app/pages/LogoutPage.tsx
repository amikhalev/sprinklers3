import * as React from "react";
import { Redirect } from "react-router";

import { AppState, ConsumeState } from "@app/state";

export function LogoutPage() {
    function consumeState(appState: AppState) {
        appState.tokenStore.clear();
        return (
            <Redirect to="/" />
        );
    }

    return (
        <ConsumeState>{consumeState}</ConsumeState>
    );
}
