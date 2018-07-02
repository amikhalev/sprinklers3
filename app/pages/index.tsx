import * as React from "react";
import { RouteComponentProps } from "react-router";

import { DevicesView, MessageTest} from "@app/components";

export { LoginPage } from "./LoginPage";

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
