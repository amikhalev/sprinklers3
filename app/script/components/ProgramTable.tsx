import * as React from "react";
import {observer} from "mobx-react";
import {Program, Schedule} from "../sprinklers";
import {Table} from "semantic-ui-react";

@observer
export class ScheduleView extends React.PureComponent<{ schedule: Schedule }, void> {
    render() {
        return (
            <div>{JSON.stringify(this.props.schedule)}</div>
        );
    }
}

@observer
export default class ProgramTable extends React.PureComponent<{ programs: Program[] }, void> {
    private static renderRow(program: Program, i: number): JSX.Element[] {
        if (!program) {
            return null;
        }
        const {name, running, enabled, schedule, sequence} = program;
        return [
            <Table.Row key={i}>
                <Table.Cell className="program--number">{"" + (i + 1)}</Table.Cell>
                <Table.Cell className="program--name">{name}</Table.Cell>
                <Table.Cell className="program--running">{running ? "Running" : "Not running"}</Table.Cell>
                <Table.Cell className="program--enabled">{enabled ? "Enabled" : "Not enabled"}</Table.Cell>
            </Table.Row>
            ,
            <Table.Row key={i + .5}>
                <Table.Cell className="program--sequence" colSpan="4">
                    <ul>
                        {sequence.map((item) =>
                            (<li>Section {item.section + 1 + ""} for&nbsp;
                                {item.duration.minutes}M {item.duration.seconds}S</li>))}
                    </ul>
                    <ScheduleView schedule={schedule}/>
                </Table.Cell>
            </Table.Row>
            ,
        ];
    }

    render() {
        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell colSpan="7">Programs</Table.HeaderCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.HeaderCell className="program--number">#</Table.HeaderCell>
                        <Table.HeaderCell className="program--name">Name</Table.HeaderCell>
                        <Table.HeaderCell className="program--running">Running?</Table.HeaderCell>
                        <Table.HeaderCell className="program--enabled">Enabled?</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                        Array.prototype.concat.apply([], this.props.programs.map(ProgramTable.renderRow))
                    }
                </Table.Body>
            </Table>
        );
    }
}