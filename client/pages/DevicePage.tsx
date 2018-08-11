import { observer } from "mobx-react";
import * as React from "react";
import { Item } from "semantic-ui-react";

import DeviceView from "@client/components/DeviceView";
import { RouteComponentProps, withRouter } from "react-router";

class DevicePage extends React.Component<RouteComponentProps<{ deviceId: string }>> {
    render() {
        const { match: { params: { deviceId } } } = this.props;
        return (
            <Item.Group divided>
                <DeviceView deviceId={deviceId} />
            </Item.Group>
        );
    }
}

export default withRouter(observer(DevicePage));
