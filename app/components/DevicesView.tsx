import { observer } from "mobx-react";
import * as React from "react";
import { Item } from "semantic-ui-react";

import DeviceView from "@app/components/DeviceView";

class DevicesView extends React.Component {
    render() {
        return (
            <Item.Group divided>
                <DeviceView deviceId="grinklers" />
            </Item.Group>
        );
    }
}

export default observer(DevicesView);
