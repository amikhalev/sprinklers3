import { flatMap } from "lodash";
import { observer } from "mobx-react";
import * as moment from "moment";
import * as React from "react";
import { Button, Table } from "semantic-ui-react";

import { Duration } from "@common/Duration";
import { Program, Schedule, TimeOfDay, Weekday, DateOfYear, Section } from "@common/sprinklers";

function timeToString(time: TimeOfDay) {
    return moment(time).format("LTS");
}

function formatDateOfYear(day: DateOfYear | null, prefix: string) {
    if (day == null) {
        return null;
    }
    return prefix + moment(day).format("l");
}

@observer
export class ScheduleView extends React.Component<{ schedule: Schedule }> {
    render() {
        const { schedule } = this.props;
        const times = schedule.times.map((time, i) => timeToString(time))
            .join(", ");
        const weekdays = schedule.weekdays.map((weekday) =>
            Weekday[weekday]).join(", ");
        const from = formatDateOfYear(schedule.from, "From ");
        const to = formatDateOfYear(schedule.to, "To ");
        return (
            <div>
                At {times} <br />
                On {weekdays} <br />
                {from} <br />
                {to}
            </div>
        );
    }
}

@observer
export default class ProgramTable extends React.Component<{ programs: Program[], sections: Section[] }> {
    render() {
        const programRows = Array.prototype.concat.apply([],
            this.props.programs.map(this.renderRows));

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
                    {programRows}
                </Table.Body>
            </Table>
        );
    }

    private renderRows = (program: Program, i: number): JSX.Element[] | null => {
        if (!program) {
            return null;
        }
        const { name, running, enabled, schedule, sequence } = program;
        const sequenceItems = flatMap(sequence, (item, index) => {
            const section = this.props.sections[item.section];
            const duration = Duration.fromSeconds(item.duration);
            return [
                <em key={index}>"{section.name}"</em>, ` for ${duration.toString()}, `,
            ];
        });
        const cancelOrRun = () => running ? program.cancel() : program.run();
        return [(
            <Table.Row key={i}>
                <Table.Cell className="program--number">{"" + (i + 1)}</Table.Cell>
                <Table.Cell className="program--name">{name}</Table.Cell>
                <Table.Cell className="program--running">
                    {running ? "Running" : "Not running"}
                    <Button className="program--runningButton" onClick={cancelOrRun}>
                        {running ? "Cancel" : "Run"}
                    </Button>
                </Table.Cell>
                <Table.Cell className="program--enabled">{enabled ? "Enabled" : "Not enabled"}</Table.Cell>
            </Table.Row>
        ), (
            <Table.Row key={i + .5}>
                <Table.Cell className="program--sequence" colSpan="4">
                    <h4>Sequence: </h4> {sequenceItems}
                    <h4>Schedule: </h4> <ScheduleView schedule={schedule} />
                </Table.Cell>
            </Table.Row>
        )];
    }
}
