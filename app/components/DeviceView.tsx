import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Header, Icon, Item } from "semantic-ui-react";

import { injectState, MqttApiState } from "@app/state";
import { SprinklersDevice } from "@common/sprinklers";
import { ProgramTable, RunSectionForm, SectionRunnerView, SectionTable } from ".";

const ConnectionState = ({ connected }: { connected: boolean }) => {
    const classes = classNames({
        "device--connectionState": true,
        "device--connectionState-connected": connected,
        "device--connectionState-disconnected": !connected,
    });
    return (
        <span className={classes}>
            <Icon name={connected ? "linkify" : "unlinkify"} />&nbsp;
            {connected ? "Connected" : "Disconnected"}
        </span>
    );
};

interface DeviceViewProps {
    deviceId: string;
    state: MqttApiState;
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
                        <span>Device </span><kbd>{id}</kbd>
                        <ConnectionState connected={connected} />
                    </Header>
                    <Item.Meta>
                        Raspberry Pi Grinklers Instance
                    </Item.Meta>
                    <SectionTable sections={sections} />
                    <RunSectionForm sections={sections} />
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
