import { observer } from "mobx-react";
import * as React from "react";
import { Item } from "semantic-ui-react";

import DeviceView from "@app/components/DeviceView";

class DevicesView extends React.Component<{deviceId: string}> {
    render() {
        return (
            <Item.Group divided>
                <DeviceView deviceId={this.props.deviceId} />
            </Item.Group>
        );
    }
}

export default observer(DevicesView);
