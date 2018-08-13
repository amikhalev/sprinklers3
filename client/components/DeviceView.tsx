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
import { ConnectionState as ConState, SprinklersDevice } from "@common/sprinklersRpc";
import { Route, RouteComponentProps, withRouter } from "react-router";
import { ProgramTable, RunSectionForm, SectionRunnerView, SectionTable } from ".";

import "@client/styles/DeviceView";

const ConnectionState = observer(({ connectionState, className }:
    { connectionState: ConState, className?: string }) => {
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
            <Icon name={iconName} />&nbsp;
            {connectionText}
        </div>
    );
});

interface DeviceViewProps {
    deviceId: number;
    appState: AppState;
    inList?: boolean;
}

class DeviceView extends React.Component<DeviceViewProps & RouteComponentProps<any>> {
    renderBody(iDevice: ISprinklersDevice, device: SprinklersDevice) {
        const { inList, appState: { uiStore, routerStore } } = this.props;
        const { connectionState, sectionRunner, sections } = device;
        if (!connectionState.isAvailable || inList) {
            return null;
        }
        return (
            <React.Fragment>
                <Grid>
                    <Grid.Column mobile="16" tablet="16" computer="16" largeScreen="6">
                        <SectionRunnerView sectionRunner={sectionRunner} sections={sections} />
                    </Grid.Column>
                    <Grid.Column mobile="16" tablet="9" computer="9" largeScreen="6">
                        <SectionTable sections={sections} />
                    </Grid.Column>
                    <Grid.Column mobile="16" tablet="7" computer="7" largeScreen="4">
                        <RunSectionForm device={device} uiStore={uiStore} />
                    </Grid.Column>
                </Grid>
                <ProgramTable iDevice={iDevice} device={device} routerStore={routerStore} />
                <Route path={route.program(":deviceId", ":programId")} component={p.ProgramPage} />
            </React.Fragment>
        );
    }

    render() {
        const { deviceId, inList, appState: { sprinklersRpc, userStore } } = this.props;
        const iDevice = userStore.findDevice(deviceId);
        let itemContent: React.ReactNode;
        if (!iDevice || !iDevice.deviceId) {
            // TODO: better and link back to devices list
            itemContent = <span>You do not have access to this device</span>;
        } else {
            const device = sprinklersRpc.getDevice(iDevice.deviceId);
            const { connectionState } = device;
            let header: React.ReactNode;
            if (inList) { // tslint:disable-line:prefer-conditional-expression
                header = <Link to={route.device(iDevice.id)}>Device <kbd>{iDevice.name}</kbd></Link>;
            } else {
                header = <span>Device <kbd>{iDevice.name}</kbd></span>;
            }
            itemContent = (
                <React.Fragment>
                    <DeviceImage size={inList ? "tiny" : undefined} />
                    <Item.Content className="device">
                        <Header as={inList ? "h2" : "h1"}>
                            {header}
                            <ConnectionState connectionState={connectionState} />
                        </Header>
                        <Item.Meta>
                            Raspberry Pi Grinklers Device
                        </Item.Meta>
                        {this.renderBody(iDevice, device)}
                    </Item.Content>
                </React.Fragment>
            );
        }
        return <Item>{itemContent}</Item>;
    }
}

export default injectState(withRouter(observer(DeviceView)));
