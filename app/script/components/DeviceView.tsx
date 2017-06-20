import * as React from "react";
import {observer} from "mobx-react";
import {Item, Header} from "semantic-ui-react";
import FontAwesome = require("react-fontawesome");
import * as classNames from "classnames";

import {SprinklersDevice} from "../sprinklers";
import {SectionTable, RunSectionForm, ProgramTable} from ".";

const ConnectionState = ({connected}: { connected: boolean }) =>
    <span className={classNames({
        "device--connectionState": true,
        "device--connectionState-connected": connected,
        "device--connectionState-disconnected": !connected,
    })}>
        <FontAwesome name={connected ? "plug" : "chain-broken"}/>
        &nbsp;
        {connected ? "Connected" : "Disconnected"}
    </span>;

@observer
export default class DeviceView extends React.PureComponent<{ device: SprinklersDevice }, void> {
    render() {
        const {id, connected, sections, programs} = this.props.device;
        return (
            <Item>
                <Item.Image src={require<string>("app/images/raspberry_pi.png")}/>
                <Item.Content>
                    <Header as="h1">
                        <span>Device </span><kbd>{id}</kbd>
                        <ConnectionState connected={connected}/>
                    </Header>
                    <Item.Meta>

                    </Item.Meta>
                    <SectionTable sections={sections}/>
                    <RunSectionForm sections={sections}/>
                    <ProgramTable programs={programs}/>
                </Item.Content>
            </Item>
        );
    }
}
