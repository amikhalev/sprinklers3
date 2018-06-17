import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Grid, Header, Icon, Item } from "semantic-ui-react";

import { injectState, StateBase } from "@app/state";
import { ConnectionState as ConState, SprinklersDevice } from "@common/sprinklers";
import { ProgramTable, RunSectionForm, SectionRunnerView, SectionTable } from ".";
import "./DeviceView.scss";

function ConnectionState({ connectionState, className }: { connectionState: ConState, className?: string }) {
    const connected = connectionState.isConnected;
    const classes = classNames({
        connectionState: true,
        connected: connected, /* tslint:disable-line:object-literal-shorthand */
        disconnected: !connected,
    }, className);
    let connectionText: string;
    if (connected) {
        connectionText = "Connected";
    } else if (connectionState.serverToBroker) {
        connectionText = "Device Disconnected";
    } else if (connectionState.clientToServer) {
        connectionText = "Broker Disconnected";
    } else {
        connectionText = "Server Disconnected";
    }
    return (
        <div className={classes}>
            <Icon name={connected ? "linkify" : "unlinkify"}/>&nbsp;
            {connectionText}
        </div>
    );
}

interface DeviceViewProps {
    deviceId: string;
    state: StateBase;
}

class DeviceView extends React.Component<DeviceViewProps> {
    device!: SprinklersDevice;

    componentWillMount() {
        this.updateDevice();
    }

    componentWillUpdate() {
        this.updateDevice();
    }

    render() {
        const { id, connectionState, sections, programs, sectionRunner } = this.device;
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
                    <Grid>
                        <Grid.Column mobile={16} largeScreen={8}>
                            <SectionTable sections={sections}/>
                        </Grid.Column>
                        <Grid.Column mobile={16} largeScreen={8}>
                            <RunSectionForm sections={sections}/>
                        </Grid.Column>
                    </Grid>
                    <ProgramTable programs={programs} sections={sections}/>
                    <SectionRunnerView sectionRunner={sectionRunner} sections={sections}/>
                </Item.Content>
            </Item>
        );
    }

    private updateDevice() {
        const { state, deviceId } = this.props;
        if (!this.device || this.device.id !== deviceId) {
            this.device = state.sprinklersApi.getDevice(deviceId);
        }
    }
}

export default injectState(observer(DeviceView));
