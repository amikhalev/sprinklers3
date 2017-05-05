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
class SectionTable extends React.PureComponent<{ sections: Section[] }, void> {
    static renderRow(section: Section, index: number) {
        const { name, state } = section;
        return (
            <Table.Row key={index}>
                <Table.Cell className="section--name">Section {name}</Table.Cell>
                <Table.Cell className="section--state">State: {state + ""}</Table.Cell>
            </Table.Row>
        );
    }

    render() {
        return (<Table celled striped>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell colSpan="3">Sections</Table.HeaderCell>
                </Table.Row>
                <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>State</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {
                    this.props.sections.map(SectionTable.renderRow)
                }
            </Table.Body>
        </Table>
        );
    }
}

@observer
class ProgramTable extends React.PureComponent<{ programs: Program[] }, void> {
    static renderRow(program: Program, i: number) {
        const { name, running } = program;
        return (
            <Table.Row key={i}>
                <Table.Cell className="program--name">Program {name}</Table.Cell>
                <Table.Cell className="program--running">running: {running + ""}</Table.Cell>
            </Table.Row>
        );
    }

    render() {
        return (
            <Table celled striped>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell colSpan="3">Programs</Table.HeaderCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.HeaderCell>Name</Table.HeaderCell>
                        <Table.HeaderCell>Running</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                        this.props.programs.map(ProgramTable.renderRow)
                    }
                </Table.Body>
            </Table>
        );
    }
}

@observer
class DeviceView extends React.PureComponent<{ device: SprinklersDevice }, void> {
    render() {
        const { id, connected, sections, programs } = this.props.device;
        return (
            <Item>
                <Item.Image src={require<string>("app/images/raspberry_pi.png")} />
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
                    <SectionTable sections={sections} />
                    <ProgramTable programs={programs} />
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