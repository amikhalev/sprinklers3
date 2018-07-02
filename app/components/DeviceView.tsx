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
    const connected = connectionState.isConnected;
    const classes = classNames({
        connectionState: true,
        connected: connected === true,
        disconnected: connected === false,
        unknown: connected === null,
    }, className);
    let connectionText: string;
    let iconName: SemanticICONS = "unlinkify";
    if (connected) {
        connectionText = "Connected";
        iconName = "linkify";
    } else if (connected === null) {
        connectionText = "Unknown";
        iconName = "question";
    } else if (connectionState.noPermission) {
        connectionText = "No permission for this device";
        iconName = "ban";
    } else if (connectionState.serverToBroker) {
        connectionText = "Device Disconnected";
    } else if (connectionState.clientToServer) {
        connectionText = "Broker Disconnected";
    } else {
        connectionText = "Server Disconnected";
    }
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
        const { uiStore, sprinklersRpc } = this.props.appState;
        const device = sprinklersRpc.getDevice(this.props.deviceId);
        const { id, connectionState, sections, programs, sectionRunner } = device;
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
                <ProgramTable programs={programs} sections={sections}/>
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
