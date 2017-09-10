import { observer } from "mobx-react";
import * as React from "react";

import DeviceView from "@app/components/DeviceView";

class DevicesView extends React.Component {
    render() {
        return <DeviceView deviceId="grinklers" />;
    }
}

export default observer(DevicesView);
