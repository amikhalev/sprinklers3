import { observer } from "mobx-react";
import * as React from "react";
import { Item } from "semantic-ui-react";

import { DeviceView } from "@client/components";
import { AppState, injectState } from "@client/state";

class DevicesPage extends React.Component<{ appState: AppState }> {
  render() {
    const { appState } = this.props;
    const { userData } = appState.userStore;
    let deviceNodes: React.ReactNode;
    if (!userData) {
      deviceNodes = <span>Not logged in</span>;
    } else if (!userData.devices || !userData.devices.length) {
      deviceNodes = <span>You have no devices</span>;
    } else {
      deviceNodes = userData.devices.map(device => (
        <DeviceView key={device.id} deviceId={device.id} inList />
      ));
    }
    return (
      <React.Fragment>
        <h1>Devices</h1>
        <Item.Group>{deviceNodes}</Item.Group>
      </React.Fragment>
    );
  }
}

export default injectState(observer(DevicesPage));
