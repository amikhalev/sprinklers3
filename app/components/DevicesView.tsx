import { observer } from "mobx-react";
import * as React from "react";
import { Item } from "semantic-ui-react";

import DeviceView from "@app/components/DeviceView";
import { RouteComponentProps, withRouter } from "react-router";

class DevicesView extends React.Component<{deviceId: string} & RouteComponentProps<any>> {
    render() {
        return (
            <Item.Group divided>
                <DeviceView deviceId={this.props.deviceId} />
            </Item.Group>
        );
    }
}

export default withRouter(observer(DevicesView));
