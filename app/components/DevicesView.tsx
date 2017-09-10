import { observer } from "mobx-react";
import * as React from "react";

import DeviceView from "@app/components/DeviceView";
import { injectState, State } from "@app/state";

class DevicesView extends React.Component<{ state: State }> {
    render() {
        const { device } = this.props.state;
        return <DeviceView device={device} />;
    }
}

export default injectState(observer(DevicesView));
