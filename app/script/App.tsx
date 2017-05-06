import * as React from "react";
import { observer } from "mobx-react";
import { SprinklersDevice, Section, Program } from "./sprinklers";
import { Item, Table, Header } from "semantic-ui-react";
import FontAwesome = require("react-fontawesome");
import * as classNames from "classnames";

import "semantic-ui-css/semantic.css";
import "font-awesome/css/font-awesome.css";
import "app/style/app.css";

/* tslint:disable:object-literal-sort-keys */

@observer
class SectionTable extends React.PureComponent<{ sections: Section[] }, void> {
    private static renderRow(section: Section, index: number) {
        const { name, state } = section;
        return (
            <Table.Row key={index}>
                <Table.Cell className="section--number">{"" + (index + 1)}</Table.Cell>
                <Table.Cell className="section--name">{name}</Table.Cell>
                <Table.Cell className={classNames({
                    "section--state": true,
                    "section--state-true": state,
                    "section--state-false": !state,
                })}>{state ?
                    (<span><FontAwesome name="tint" /> Irrigating</span>)
                    : "Not irrigating"}
                </Table.Cell>
            </Table.Row>
        );
    }

    public render() {
        return (<Table celled striped>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell colSpan="3">Sections</Table.HeaderCell>
                </Table.Row>
                <Table.Row>
                    <Table.HeaderCell className="section--number">#</Table.HeaderCell>
                    <Table.HeaderCell className="section--name">Name</Table.HeaderCell>
                    <Table.HeaderCell className="section--state">State</Table.HeaderCell>
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
    private static renderRow(program: Program, i: number) {
        const { name, running } = program;
        return (
            <Table.Row key={i}>
                <Table.Cell className="program--number">{"" + (i + 1)}</Table.Cell>
                <Table.Cell className="program--name">{name}</Table.Cell>
                <Table.Cell className="program--running">{running ? "Running" : "Not running"}</Table.Cell>
            </Table.Row>
        );
    }

    public render() {
        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell colSpan="3">Programs</Table.HeaderCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.HeaderCell className="program--number">#</Table.HeaderCell>
                        <Table.HeaderCell className="program--name">Name</Table.HeaderCell>
                        <Table.HeaderCell className="program--running">Running</Table.HeaderCell>
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

const ConnectionState = ({ connected }: { connected: boolean }) =>
    <span className={classNames({
        "device--connectionState": true,
        "device--connectionState-connected": connected,
        "device--connectionState-disconnected": !connected,
    })}>
        <FontAwesome name={connected ? "plug" : "chain-broken"} />
        &nbsp;
        {connected ? "Connected" : "Disconnected"}
    </span>;

@observer
class DeviceView extends React.PureComponent<{ device: SprinklersDevice }, void> {
    public render() {
        const { id, connected, sections, programs } = this.props.device;
        return (
            <Item>
                <Item.Image src={require<string>("app/images/raspberry_pi.png")} />
                <Item.Content>
                    <Header as="h1">
                        <span>Device </span><kbd>{id}</kbd>
                        <ConnectionState connected={connected} />
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
    public render() {
        return <Item.Group divided><DeviceView device={this.props.device} /></Item.Group>;
    }
}
