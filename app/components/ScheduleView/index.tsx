import { observer } from "mobx-react";
import * as React from "react";
import { Form } from "semantic-ui-react";

import { DateOfYear, Schedule, TimeOfDay, Weekday } from "@common/sprinklersRpc";
import ScheduleDate from "./ScheduleDate";
import ScheduleTimes from "./ScheduleTimes";
import WeekdaysView from "./WeekdaysView";

import "@app/styles/ScheduleView";

export interface ScheduleViewProps {
    label?: string | React.ReactNode | undefined;
    schedule: Schedule;
    editing?: boolean;
}

@observer
export default class ScheduleView extends React.Component<ScheduleViewProps> {
    render() {
        const { schedule, label } = this.props;
        const editing = this.props.editing || false;

        let labelNode: React.ReactNode;
        if (typeof label === "string") {
            labelNode = <label>{label}</label>;
        } else if (label != null) {
            labelNode = label;
        }

        return (
            <Form.Field className="scheduleView">
                {labelNode}
                <ScheduleTimes times={schedule.times} editing={editing} onChange={this.updateTimes} />
                <WeekdaysView weekdays={schedule.weekdays} editing={editing} onChange={this.updateWeekdays} />
                <ScheduleDate label="From" date={schedule.from} editing={editing} onChange={this.updateFromDate} />
                <ScheduleDate label="To" date={schedule.to} editing={editing} onChange={this.updateToDate} />
            </Form.Field>
        );
    }

    private updateTimes = (newTimes: TimeOfDay[]) => {
        this.props.schedule.times = newTimes;
    }

    private updateWeekdays = (newWeekdays: Weekday[]) => {
        this.props.schedule.weekdays = newWeekdays;
    }

    private updateFromDate = (newFromDate: DateOfYear | null) => {
        this.props.schedule.from = newFromDate;
    }

    private updateToDate = (newToDate: DateOfYear | null) => {
        this.props.schedule.to = newToDate;
    }
}
