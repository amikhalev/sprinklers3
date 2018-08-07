import * as React from "react";
import { RouteComponentProps } from "react-router";

import { DevicesView, MessageTest} from "@client/components";

export { LoginPage } from "./LoginPage";
export { LogoutPage } from "./LogoutPage";
export { default as ProgramPage } from "./ProgramPage";

export function DevicePage({ match }: RouteComponentProps<{ deviceId: string }>) {
    return (
        <DevicesView deviceId={match.params.deviceId}/>
    );
}

export function MessagesTestPage() {
    return (
        <MessageTest/>
    );
}
