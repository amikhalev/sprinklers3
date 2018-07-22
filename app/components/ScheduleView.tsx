import { observer } from "mobx-react";
import * as moment from "moment";
import * as React from "react";

import { DateOfYear, Schedule, TimeOfDay, Weekday } from "@common/sprinklersRpc";

function timeToString(time: TimeOfDay) {
    return moment(time).format("LTS");
}

function formatDateOfYear(day: DateOfYear | null, prefix: React.ReactNode) {
    if (day == null) {
        return null;
    }
    const format = (day.year === 0) ? "M/D" : "l";
    return <React.Fragment>{prefix}{moment(day).format(format)}</React.Fragment>;
}

@observer
export default class ScheduleView extends React.Component<{ schedule: Schedule }> {
    render() {
        const { schedule } = this.props;
        const times = schedule.times.map((time, i) => timeToString(time))
            .join(", ");
        const weekdays = schedule.weekdays.map((weekday) =>
            Weekday[weekday]).join(", ");
        const from = formatDateOfYear(schedule.from, <b>From </b>);
        const to = formatDateOfYear(schedule.to, <b>To </b>);
        return (
            <div>
                <b>At</b> {times} <br/>
                <b>On</b> {weekdays} <br/>
                {from} <br/>
                {to}
            </div>
        );
    }
}
