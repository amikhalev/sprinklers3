import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { Grid, Header, Icon, Item, SemanticICONS } from "semantic-ui-react";

import { DeviceImage } from "@client/components";
import * as p from "@client/pages";
import * as route from "@client/routePaths";
import { AppState, injectState } from "@client/state";
import { ISprinklersDevice } from "@common/httpApi";
import {
  ConnectionState as ConState,
  SprinklersDevice
} from "@common/sprinklersRpc";
import { Route, RouteComponentProps, withRouter } from "react-router";
import {
  ProgramTable,
  RunSectionForm,
  SectionRunnerView,
  SectionTable
} from ".";

import "@client/styles/DeviceView";

const ConnectionState = observer(
  ({
    connectionState,
    className
  }: {
    connectionState: ConState;
    className?: string;
  }) => {
    const connected = connectionState.isDeviceConnected;
    let connectionText: string;
    let iconName: SemanticICONS = "unlinkify";
    let clazzName: string = "disconnected";
    if (connected) {
      connectionText = "Connected";
      iconName = "linkify";
      clazzName = "connected";
    } else if (connectionState.noPermission) {
      connectionText = "No permission for this device";
      iconName = "ban";
    } else if (connected === false) {
      connectionText = "Device Disconnected";
    } else if (connectionState.clientToServer === false) {
      connectionText = "Disconnected from server";
    } else {
      connectionText = "Unknown";
      iconName = "question";
      clazzName = "unknown";
    }
    const classes = classNames("connectionState", clazzName, className);
    return (
      <div className={classes}>
        <Icon name={iconName} />
        &nbsp;
        {connectionText}
      </div>
    );
  }
);

interface DeviceViewProps {
  deviceId: number;
  appState: AppState;
  inList?: boolean;
}

class DeviceView extends React.Component<DeviceViewProps> {
  deviceInfo: ISprinklersDevice | null = null;
  device: SprinklersDevice | null = null;

  componentWillUnmount() {
    if (this.device) {
      this.device.release();
    }
  }

  renderBody() {
    const {
      inList,
      appState: { uiStore, routerStore }
    } = this.props;
    if (!this.deviceInfo || !this.device) {
      return null;
    }
    const { connectionState, sectionRunner, sections } = this.device;
    if (!connectionState.isAvailable || inList) {
      return null;
    }
    return (
      <React.Fragment>
        <Grid>
          <Grid.Column mobile="16" tablet="16" computer="16" largeScreen="6">
            <SectionRunnerView
              sectionRunner={sectionRunner}
              sections={sections}
            />
          </Grid.Column>
          <Grid.Column mobile="16" tablet="9" computer="9" largeScreen="6">
            <SectionTable sections={sections} />
          </Grid.Column>
          <Grid.Column mobile="16" tablet="7" computer="7" largeScreen="4">
            <RunSectionForm device={this.device} uiStore={uiStore} />
          </Grid.Column>
        </Grid>
        <ProgramTable
          iDevice={this.deviceInfo}
          device={this.device}
          routerStore={routerStore}
        />
        <Route
          path={route.program(":deviceId", ":programId")}
          component={p.ProgramPage}
        />
      </React.Fragment>
    );
  }

  updateDevice() {
    const { userStore, sprinklersRpc } = this.props.appState;
    const id = this.props.deviceId;
    // tslint:disable-next-line:prefer-conditional-expression
    if (this.deviceInfo == null || this.deviceInfo.id !== id) {
      this.deviceInfo = userStore.findDevice(id);
    }
    if (!this.deviceInfo || !this.deviceInfo.deviceId) {
      if (this.device) {
        this.device.release();
        this.device = null;
      }
    } else {
      if (this.device == null || this.device.id !== this.deviceInfo.deviceId) {
        if (this.device) {
          this.device.release();
        }
        this.device = sprinklersRpc.acquireDevice(this.deviceInfo.deviceId);
      }
    }
  }

  render() {
    this.updateDevice();
    const { inList } = this.props;
    let itemContent: React.ReactNode;
    if (!this.deviceInfo || !this.device) {
      // TODO: better and link back to devices list
      itemContent = <span>You do not have access to this device</span>;
    } else {
      const { connectionState } = this.device;
      let header: React.ReactNode;
      let image: React.ReactNode;
      if (inList) {
        // tslint:disable-line:prefer-conditional-expression
        const devicePath = route.device(this.deviceInfo.id);
        header = (
          <Link to={devicePath}>
            Device <kbd>{this.deviceInfo.name}</kbd>
          </Link>
        );
        image = <DeviceImage size="tiny" as={Link} to={devicePath} />;
      } else {
        header = (
          <span>
            Device <kbd>{this.deviceInfo.name}</kbd>
          </span>
        );
        image = <DeviceImage />;
      }
      itemContent = (
        <React.Fragment>
          {image}
          <Item.Content className="device">
            <Header as={inList ? "h2" : "h1"}>
              {header}
              <ConnectionState connectionState={connectionState} />
            </Header>
            <Item.Meta>Raspberry Pi Grinklers Device</Item.Meta>
            {this.renderBody()}
          </Item.Content>
        </React.Fragment>
      );
    }
    return <Item>{itemContent}</Item>;
  }
}

export default injectState(observer(DeviceView));
