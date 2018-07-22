import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Grid, Header, Icon, Item, SemanticICONS } from "semantic-ui-react";

import { AppState, injectState } from "@app/state";
import { ConnectionState as ConState } from "@common/sprinklersRpc";
import { ProgramTable, RunSectionForm, SectionRunnerView, SectionTable } from ".";
import "./DeviceView.scss";

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
            <Icon name={iconName}/>&nbsp;
            {connectionText}
        </div>
    );
});

interface DeviceViewProps {
    deviceId: string;
    appState: AppState;
}

class DeviceView extends React.Component<DeviceViewProps> {
    render() {
        const { uiStore, sprinklersRpc, routerStore } = this.props.appState;
        const device = sprinklersRpc.getDevice(this.props.deviceId);
        const { id, connectionState, sections, sectionRunner } = device;
        const deviceBody = connectionState.isAvailable && (
            <React.Fragment>
                <SectionRunnerView sectionRunner={sectionRunner} sections={sections}/>
                <Grid>
                    <Grid.Column mobile="16" tablet="16" computer="8">
                        <SectionTable sections={sections}/>
                    </Grid.Column>
                    <Grid.Column mobile="16" tablet="16" computer="8">
                        <RunSectionForm device={device} uiStore={uiStore}/>
                    </Grid.Column>
                </Grid>
                <ProgramTable device={device} routerStore={routerStore}/>
            </React.Fragment>
        );
        return (
            <Item>
                <Item.Image src={require("@app/images/raspberry_pi.png")}/>
                <Item.Content className="device">
                    <Header as="h1">
                        <div>Device <kbd>{id}</kbd></div>
                        <ConnectionState connectionState={connectionState}/>
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

export default injectState(observer(DeviceView));
