import * as React from "react";
import { observer } from "mobx-react";
import { SprinklersDevice, Section, Program } from "./sprinklers";
import { Item, Table, Header } from "semantic-ui-react";
import FontAwesome = require("react-fontawesome");
import * as classNames from "classnames";

import "semantic-ui-css/semantic.css";
import "font-awesome/css/font-awesome.css"
import "app/style/app.css";

@observer
class SectionRow extends React.PureComponent<{ section: Section }, void> {
    render() {
        const { name, state } = this.props.section;
        return (
            <Table.Row>
                <Table.Cell className="section--name">Section {name}</Table.Cell>
                <Table.Cell className="section--state">State: {state + ""}</Table.Cell>
            </Table.Row>
        );
    }
}

@observer
class ProgramRow extends React.PureComponent<{ program: Program }, void> {
    render() {
        const { name, running } = this.props.program;
        return (
            <Table.Row>
                <Table.Cell className="program--name">Program {name}</Table.Cell>
                <Table.Cell className="program--running">running: {running + ""}</Table.Cell>
            </Table.Row>
        );
    }
}

@observer
class DeviceView extends React.PureComponent<{ device: SprinklersDevice }, void> {
    render() {
        const { id, connected, sections, programs } = this.props.device; //src={require("app/images/raspberry_pi.png")}
        return (
            <Item>
                <Item.Image  />
                <Item.Content>
                    <Header as="h1">
                        <span>Device </span><kbd>{id}</kbd>
                        <small className={classNames({
                            "device--connectedState": true,
                            "device--connectedState-connected": connected,
                            "device--connectedState-disconnected": !connected
                        })}>
                            <FontAwesome name={connected ? "plug" : "chain-broken"} />
                            &nbsp;
                            {connected ? "Connected" : "Disconnected"}
                        </small>
                    </Header>
                    <Item.Meta>

                    </Item.Meta>
                    <Table celled striped>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell colSpan="3">Sections</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {
                                sections.map((s, i) => <SectionRow section={s} key={i} />)
                            }
                        </Table.Body>
                    </Table>
                    <Table celled striped>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell colSpan="3">Programs</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {
                                programs.map((p, i) => <ProgramRow program={p} key={i} />)
                            }
                        </Table.Body>
                    </Table>
                </Item.Content>
            </Item>
        );
    }
}

@observer
export default class App extends React.PureComponent<{ device: SprinklersDevice }, any> {
    render() {
        return <Item.Group divided><DeviceView device={this.props.device} /></Item.Group>
    }
}