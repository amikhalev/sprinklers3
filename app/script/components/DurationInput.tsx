import * as React from "react";
import {Duration} from "../sprinklers";
import {Input} from "semantic-ui-react";

export default class DurationInput extends React.Component<{
    duration: Duration,
    onDurationChange?: (newDuration: Duration) => void;
}, {}> {
    render() {
        const duration = this.props.duration;
        // const editing = this.props.onDurationChange != null;
        return <div className="field durationInput">
            <label>Duration</label>
            <div className="fields">
                <Input type="number" className="field durationInput--minutes"
                       value={duration.minutes} onChange={this.onMinutesChange}
                       label="M" labelPosition="right"/>
                <Input type="number" className="field durationInput--seconds"
                       value={duration.seconds} onChange={this.onSecondsChange} max="60"
                       label="S" labelPosition="right"/>
            </div>
        </div>;
    }

    private onMinutesChange = (e, {value}) => {
        if (value.length === 0 || isNaN(value)) {
            return;
        }
        const newMinutes = parseInt(value, 10);
        this.props.onDurationChange(this.props.duration.withMinutes(newMinutes));
    }

    private onSecondsChange = (e, {value}) => {
        if (value.length === 0 || isNaN(value)) {
            return;
        }
        const newSeconds = parseInt(value, 10);
        this.props.onDurationChange(this.props.duration.withSeconds(newSeconds));
    }
}
