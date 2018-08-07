import * as moment from "moment";
import * as React from "react";
import { Form, Icon, Input, InputOnChangeData } from "semantic-ui-react";

import { DateOfYear } from "@common/sprinklersRpc";

const HTML_DATE_INPUT_FORMAT = "YYYY-MM-DD";

export interface ScheduleDateProps {
    date: DateOfYear | null | undefined;
    label: string | React.ReactNode | undefined;
    editing: boolean | undefined;
    onChange: (newDate: DateOfYear | null) => void;
}

interface ScheduleDateState {
    rawValue: string | "";
    lastDate: DateOfYear | null | undefined;
}

export default class ScheduleDate extends React.Component<ScheduleDateProps, ScheduleDateState> {
    static getDerivedStateFromProps(props: ScheduleDateProps, state: ScheduleDateState): Partial<ScheduleDateState> {
        if (!DateOfYear.equals(props.date, state.lastDate)) {
            const thisYear = moment().year();
            const rawValue = props.date == null ? "" :
                moment(props.date).year(thisYear).format(HTML_DATE_INPUT_FORMAT);
            return { lastDate: props.date, rawValue };
        }
        return {};
    }

    constructor(p: ScheduleDateProps) {
        super(p);
        this.state = { rawValue: "", lastDate: undefined };
    }

    render() {
        const { date, label, editing } = this.props;

        let dayNode: React.ReactNode;
        if (editing) { // tslint:disable-line:prefer-conditional-expression
            let clearIcon: React.ReactNode | undefined;
            if (date) {
                clearIcon = <Icon name="ban" link onClick={this.onClear} />;
            }
            dayNode = <Input type="date" icon={clearIcon} value={this.state.rawValue} onChange={this.onChange} />;
        } else {
            const m = moment(date || "");
            let dayString: string;
            if (m.isValid()) {
                const format = (m.year() === 0) ? "M/D" : "l";
                dayString = m.format(format);
            } else {
                dayString = "N/A";
            }
            dayNode = <span>{dayString}</span>;
        }

        let labelNode: React.ReactNode = null;
        if (typeof label === "string") {
            labelNode = <label>{label}</label>;
        } else if (label != null) {
            labelNode = label;
        }

        return <Form.Field inline>{labelNode}{dayNode}</Form.Field>;
    }

    private onChange = (e: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
        const { onChange } = this.props;
        if (!onChange) return;
        const m = moment(data.value, HTML_DATE_INPUT_FORMAT);
        onChange(DateOfYear.fromMoment(m).with({ year: 0 }));
    }

    private onClear = () => {
        const { onChange } = this.props;
        if (!onChange) return;
        onChange(null);
    }
}
