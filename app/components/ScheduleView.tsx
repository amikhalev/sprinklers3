import { observer } from "mobx-react";
import * as moment from "moment";
import * as React from "react";
import { Checkbox, Form, Input, InputOnChangeData, CheckboxProps } from "semantic-ui-react";

import { DateOfYear, Schedule, TimeOfDay, Weekday, WEEKDAYS } from "@common/sprinklersRpc";

function timeToString(time: TimeOfDay) {
    return moment(time).format("LTS");
}

function formatDateOfYear(day: DateOfYear | null, prefix: React.ReactNode, editing: boolean) {
    if (day == null && !editing) {
        return null;
    }
    const format = (day && day.year === 0) ? "M/D" : "l";
    const dayString = moment(day || "").format(format);
    let dayNode: React.ReactNode;
    if (editing) {
        dayNode = <Input value={dayString} />;
    } else {
        dayNode = <span>{dayString}</span>;
    }
    return <Form.Field inline>{prefix}{dayNode}</Form.Field>;
}

interface WeekdaysViewProps {
    weekdays: Weekday[];
    editing: boolean;
    onChange?: (newWeekdays: Weekday[]) => void;
}

function WeekdaysView({weekdays, editing, onChange}: WeekdaysViewProps) {
    let node: React.ReactNode;
    if (editing) {
        node = WEEKDAYS.map((weekday) => {
            const checked = weekdays.find((wd) => wd === weekday) != null;
            const name = Weekday[weekday];
            const toggleWeekday = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
                if (!onChange) {
                    return;
                }
                if (data.checked && !checked) {
                    onChange(weekdays.concat([weekday]));
                } else if (!data.checked && checked) {
                    onChange(weekdays.filter((wd) => wd !== weekday));
                }
            }
            return (
                <Form.Field control={Checkbox} label={name} checked={checked} key={weekday} onChange={toggleWeekday} />
            );
        });
    } else {
        node = weekdays.map((weekday) =>
            Weekday[weekday]).join(", ");
    }
    return (
        <Form.Group inline>
            <label>On</label> {node}
        </Form.Group>
    )
}

export interface ScheduleViewProps {
    schedule: Schedule;
    editing?: boolean;
}

@observer
export default class ScheduleView extends React.Component<ScheduleViewProps> {
    render() {
        const { schedule } = this.props;
        const editing = this.props.editing != null ? this.props.editing : false;

        let times: React.ReactNode;
        if (editing) {
            times = schedule.times
                .map((time, i) => {
                    const onChange = (event: React.SyntheticEvent, d: InputOnChangeData) => {
                        const m = moment(d.value, ["LTS"]);
                        schedule.times[i] = TimeOfDay.fromMoment(m);
                    };
                    return <Input value={timeToString(time)} key={i} onChange={onChange} />;
                });
        } else {
            times = schedule.times.map((time) => timeToString(time))
                .join(", ");
        }

        const from = formatDateOfYear(schedule.from, <label>From </label>, editing);
        const to = formatDateOfYear(schedule.to, <label>To </label>, editing);
        return (
            <div>
                <Form.Field inline>
                    <label>At</label> {times}
                </Form.Field>
                <WeekdaysView weekdays={schedule.weekdays} editing={editing} onChange={this.updateWeekdays}/>
                {from}
                {to}
            </div>
        );
    }

    private updateWeekdays = (newWeekdays: Weekday[]) => {
        this.props.schedule.weekdays = newWeekdays;
    }
}
