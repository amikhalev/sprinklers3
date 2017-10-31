import * as classNames from "classnames";
import * as React from "react";
import { Input, InputProps } from "semantic-ui-react";

import { Duration } from "@common/Duration";

export default class DurationInput extends React.Component<{
    duration: Duration,
    onDurationChange: (newDuration: Duration) => void,
    className?: string,
}> {
    render() {
        const duration = this.props.duration;
        const className = classNames("field", "durationInput", this.props.className);
        // const editing = this.props.onDurationChange != null;
        return (
            <div className={className}>
                <label>Duration</label>
                <div className="ui two fields">
                    <Input
                        type="number"
                        className="field durationInput--minutes"
                        value={duration.minutes}
                        onChange={this.onMinutesChange}
                        label="M"
                        labelPosition="right"
                    />
                    <Input
                        type="number"
                        className="field durationInput--seconds"
                        value={duration.seconds}
                        onChange={this.onSecondsChange}
                        max="60"
                        label="S"
                        labelPosition="right"
                    />
                </div>
            </div>
        );
    }

    private onMinutesChange: InputProps["onChange"] = (e, { value }) => {
        if (value.length === 0 || isNaN(Number(value))) {
            return;
        }
        const newMinutes = parseInt(value, 10);
        this.props.onDurationChange(this.props.duration.withMinutes(newMinutes));
    }

    private onSecondsChange: InputProps["onChange"] = (e, { value }) => {
        if (value.length === 0 || isNaN(Number(value))) {
            return;
        }
        const newSeconds = parseInt(value, 10);
        this.props.onDurationChange(this.props.duration.withSeconds(newSeconds));
    }
}
