import * as moment from "moment";
import * as React from "react";
import { Input, InputOnChangeData } from "semantic-ui-react";

import { TimeOfDay } from "@common/sprinklersRpc";

const HTML_TIME_INPUT_FORMAT = "HH:mm";

function timeOfDayToHtmlDateInput(tod: TimeOfDay): string {
    return moment(tod).format(HTML_TIME_INPUT_FORMAT);
}

export interface TimeInputProps {
    value: TimeOfDay;
    index: number;
    onChange: (newValue: TimeOfDay, index: number) => void;
}

export interface TimeInputState {
    rawValue: string;
    lastTime: TimeOfDay | null;
}

export default class TimeInput extends React.Component<TimeInputProps, TimeInputState> {
    static getDerivedStateFromProps(props: TimeInputProps, state: TimeInputState): Partial<TimeInputState> {
        if (!TimeOfDay.equals(props.value, state.lastTime)) {
            return { lastTime: props.value, rawValue: timeOfDayToHtmlDateInput(props.value) };
        }
        return {};
    }

    constructor(p: any) {
        super(p);
        this.state = { rawValue: "", lastTime: null };
    }

    render() {
        return <Input type="time" value={this.state.rawValue} onChange={this.onChange} onBlur={this.onBlur} />;
    }

    private onChange = (e: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
        this.setState({
            rawValue: data.value,
        });
    }

    private onBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
        const m = moment(this.state.rawValue, HTML_TIME_INPUT_FORMAT);
        if (m.isValid()) {
            this.props.onChange(TimeOfDay.fromMoment(m), this.props.index);
        } else {
            this.setState({ rawValue: timeOfDayToHtmlDateInput(this.props.value) });
        }
    }
}
