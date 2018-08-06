import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Grid, Header, Icon, Item, SemanticICONS } from "semantic-ui-react";

import * as p from "@app/pages";
import * as rp from "@app/routePaths";
import { AppState, injectState } from "@app/state";
import { ConnectionState as ConState } from "@common/sprinklersRpc";
import { Route, RouteComponentProps, withRouter } from "react-router";
import { ProgramTable, RunSectionForm, SectionRunnerView, SectionTable } from ".";

import "@app/styles/DeviceView";

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
    } else if (connected === false) {
        connectionText = "Device Disconnected";
    } else if (connectionState.noPermission) {
        connectionText = "No permission for this device";
        iconName = "ban";
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
    deviceId: string;
    appState: AppState;
}

class DeviceView extends React.Component<DeviceViewProps & RouteComponentProps<any>> {
    render() {
        const { uiStore, sprinklersRpc, routerStore } = this.props.appState;
        const device = sprinklersRpc.getDevice(this.props.deviceId);
        const { id, connectionState, sections, sectionRunner } = device;
        const deviceBody = connectionState.isAvailable && (
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
                <ProgramTable device={device} routerStore={routerStore} />
                <Route path={rp.program(":deviceId", ":programId")} component={p.ProgramPage} />
            </React.Fragment>
        );
        return (
            <Item>
                <Item.Image src={require("@app/images/raspberry_pi.png")} />
                <Item.Content className="device">
                    <Header as="h1">
                        <div>Device <kbd>{id}</kbd></div>
                        <ConnectionState connectionState={connectionState} />
                    </Header>
                    <Item.Meta>
                        Raspberry Pi Grinklers Device
                    </Item.Meta>
                    {deviceBody}
                </Item.Content>
            </Item>
        );
    }
}

export default injectState(withRouter(observer(DeviceView)));
