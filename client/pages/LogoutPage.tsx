import * as React from "react";
import { Redirect } from "react-router";

import { AppState, ConsumeState } from "@client/state";

export default function LogoutPage() {
    function consumeState(appState: AppState) {
        appState.tokenStore.clearAll();
        return (
            <Redirect to="/login" />
        );
    }

    return (
        <ConsumeState>{consumeState}</ConsumeState>
    );
}
