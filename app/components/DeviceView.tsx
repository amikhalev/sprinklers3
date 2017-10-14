import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Grid, Header, Icon, Item } from "semantic-ui-react";

import { injectState, StateBase } from "@app/state";
import { SprinklersDevice } from "@common/sprinklers";
import { ProgramTable, RunSectionForm, SectionRunnerView, SectionTable } from ".";

function ConnectionState({ connected, className }: { connected: boolean, className?: string }) {
    const classes = classNames({
        "device--connectionState": true,
        "device--connectionState-connected": connected,
        "device--connectionState-disconnected": !connected,
    }, className);
    return (
        <div className={classes}>
            <Icon name={connected ? "linkify" : "unlinkify"} />&nbsp;
            {connected ? "Connected" : "Disconnected"}
        </div>
    );
}

interface DeviceViewProps {
    deviceId: string;
    state: StateBase;
}

class DeviceView extends React.Component<DeviceViewProps> {
    device: SprinklersDevice;

    componentWillMount() {
        this.updateDevice();
    }

    componentWillUpdate() {
        this.updateDevice();
    }

    render() {
        const { id, connected, sections, programs, sectionRunner } = this.device;
        return (
            <Item>
                <Item.Image src={require("@app/images/raspberry_pi.png")} />
                <Item.Content>
                    <Header as="h1">
                        <div>Device <kbd>{id}</kbd></div>
                        <ConnectionState connected={connected} />
                    </Header>
                    <Item.Meta>
                        Raspberry Pi Grinklers Instance
                    </Item.Meta>
                    <Grid>
                        <Grid.Column mobile={16} largeScreen={8}>
                            <SectionTable sections={sections} />
                        </Grid.Column>
                        <Grid.Column mobile={16} largeScreen={8}>
                            <RunSectionForm sections={sections} />
                        </Grid.Column>
                    </Grid>
                    <ProgramTable programs={programs} />
                    <SectionRunnerView sectionRunner={sectionRunner} sections={sections} />
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
