import { observer } from "mobx-react";
import { RouterStore } from "mobx-react-router";
import * as React from "react";
import { Link } from "react-router-dom";
import { Button, ButtonProps, Table } from "semantic-ui-react";

import { ProgramSequenceView, ScheduleView } from "@app/components";
import * as rp from "@app/routePaths";
import { Program, SprinklersDevice } from "@common/sprinklersRpc";

@observer
class ProgramRows extends React.Component<{
    program: Program, device: SprinklersDevice,
    routerStore: RouterStore,
    expanded: boolean, toggleExpanded: (program: Program) => void,
}> {
    render() {
        const { program, device, expanded } = this.props;
        const { sections } = device;

        const { name, running, enabled, schedule, sequence } = program;

        const buttonStyle: ButtonProps = { size: "small", compact: true };
        const detailUrl = rp.program(device.id, program.id);

        const mainRow = (
            <Table.Row>
                <Table.Cell className="program--number">{"" + program.id}</Table.Cell>
                <Table.Cell className="program--name">{name}</Table.Cell>
                <Table.Cell className="program--enabled">{enabled ? "Enabled" : "Not enabled"}</Table.Cell>
                <Table.Cell className="program--running">
                    <span>{running ? "Running" : "Not running"}</span>
                </Table.Cell>
                <Table.Cell>
                    <Button onClick={this.cancelOrRun} {...buttonStyle} positive={!running} negative={running}>
                        {running ? "Cancel" : "Run"}
                    </Button>
                    <Button as={Link} to={detailUrl} {...buttonStyle} primary>
                        Open
                    </Button>
                    <Button onClick={this.toggleExpanded} {...buttonStyle}>
                        {expanded ? "Hide Details" : "Show Details"}
                    </Button>
                </Table.Cell>
            </Table.Row>
        );
        const detailRow = expanded && (
            <Table.Row>
                <Table.Cell className="program--sequence" colSpan="5">
                    <h4>Sequence: </h4> <ProgramSequenceView sequence={sequence} sections={sections}/>
                    <h4>Schedule: </h4> <ScheduleView schedule={schedule}/>
                </Table.Cell>
            </Table.Row>
        );
        return (
            <React.Fragment>
                {mainRow}
                {detailRow}
            </React.Fragment>
        );
    }

    private cancelOrRun = () => {
        const { program } = this.props;
        program.running ? program.cancel() : program.run();
    }

    private toggleExpanded = () => {
        this.props.toggleExpanded(this.props.program);
    }
}

@observer
export default class ProgramTable extends React.Component<{
    device: SprinklersDevice, routerStore: RouterStore,
}, {
    expandedPrograms: Program[],
}> {
    constructor(p: any) {
        super(p);
        this.state = { expandedPrograms: [] };
    }

    render() {
        const { programs } = this.props.device;
        const programRows = programs.map(this.renderRows);

        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell colSpan="7">Programs</Table.HeaderCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.HeaderCell className="program--number">#</Table.HeaderCell>
                        <Table.HeaderCell className="program--name">Name</Table.HeaderCell>
                        <Table.HeaderCell className="program--enabled">Enabled?</Table.HeaderCell>
                        <Table.HeaderCell className="program--running">Running?</Table.HeaderCell>
                        <Table.HeaderCell className="program--actions">Actions</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {programRows}
                </Table.Body>
            </Table>
        );
    }

    private renderRows = (program: Program, i: number): JSX.Element | null => {
        if (!program) {
            return null;
        }
        const expanded = this.state.expandedPrograms.indexOf(program) !== -1;
        return (
            <ProgramRows
                program={program}
                device={this.props.device}
                routerStore={this.props.routerStore}
                expanded={expanded}
                toggleExpanded={this.toggleExpanded}
                key={i}
            />
        );
    }

    private toggleExpanded = (program: Program) => {
        const { expandedPrograms } = this.state;
        const idx = expandedPrograms.indexOf(program);
        if (idx !== -1) {
            expandedPrograms.splice(idx, 1);
        } else {
            expandedPrograms.push(program);
        }
        this.setState({
            expandedPrograms,
        });
    }
}
