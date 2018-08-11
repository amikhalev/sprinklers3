import * as React from "react";
import { Redirect } from "react-router";

import { AppState, ConsumeState } from "@client/state";

export function LogoutPage() {
    function consumeState(appState: AppState) {
        appState.tokenStore.clear();
        return (
            <Redirect to="/login" />
        );
    }

    return (
        <ConsumeState>{consumeState}</ConsumeState>
    );
}
