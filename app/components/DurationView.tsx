import * as classNames from "classnames";
import * as React from "react";
import { Form, Input, InputProps } from "semantic-ui-react";

import { Duration } from "@common/Duration";

export default class DurationView extends React.Component<{
    label?: string,
    inline?: boolean,
    duration: Duration,
    onDurationChange?: (newDuration: Duration) => void,
    className?: string,
}> {
    render() {
        const { duration, label, inline, onDurationChange } = this.props;
        const className = classNames("durationInput", this.props.className);
        if (onDurationChange) {
            return (
                <React.Fragment>
                    <Form.Field inline={inline}>
                        {label && <label>{label}</label>}
                        <div className="durationInputs">
                            <Input
                                type="number"
                                className="durationInput minutes"
                                value={duration.minutes}
                                onChange={this.onMinutesChange}
                                label="M"
                                labelPosition="right"
                                onWheel={this.onWheel}
                            />
                            <Input
                                type="number"
                                className="durationInput seconds"
                                value={duration.seconds}
                                onChange={this.onSecondsChange}
                                max="60"
                                label="S"
                                labelPosition="right"
                                onWheel={this.onWheel}
                            />
                        </div>
                    </Form.Field>
                </React.Fragment>
            );
        } else {
            return (
                <span className={className}>
                    {label && <label>{label}</label>} {duration.minutes}M {duration.seconds}S
                </span>
            );
        }
    }

    private onMinutesChange: InputProps["onChange"] = (e, { value }) => {
        if (!this.props.onDurationChange || isNaN(Number(value))) {
            return;
        }
        const newMinutes = Number(value);
        this.props.onDurationChange(this.props.duration.withMinutes(newMinutes));
    }

    private onSecondsChange: InputProps["onChange"] = (e, { value }) => {
        if (!this.props.onDurationChange || isNaN(Number(value))) {
            return;
        }
        const newSeconds = Number(value);
        this.props.onDurationChange(this.props.duration.withSeconds(newSeconds));
    }

    private onWheel = () => {
        // do nothing
    }
}
