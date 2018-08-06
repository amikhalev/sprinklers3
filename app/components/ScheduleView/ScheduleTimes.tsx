import * as moment from "moment";
import * as React from "react";
import { Form } from "semantic-ui-react";

import { TimeOfDay } from "@common/sprinklersRpc";
import TimeInput from "./TimeInput";

function timeToString(time: TimeOfDay) {
    return moment(time).format("LTS");
}

export default class ScheduleTimes extends React.Component<{
    times: TimeOfDay[];
    onChange: (newTimes: TimeOfDay[]) => void;
    editing: boolean;
}> {
    render() {
        const { times, editing } = this.props;
        let timesNode: React.ReactNode;
        if (editing) {
            timesNode = times
                .map((time, i) => <TimeInput value={time} key={i} index={i} onChange={this.onTimeChange} />);
        } else {
            timesNode = (
                <span>
                    {times.map((time) => timeToString(time)).join(", ")}
                </span>
            );
        }
        return (<Form.Field inline className="scheduleTimes">
            <label>At</label>
            {timesNode}
        </Form.Field>);
    }
    private onTimeChange = (newTime: TimeOfDay, index: number) => {
        const { times, onChange } = this.props;
        const newTimes = times.slice();
        newTimes[index] = newTime;
        onChange(newTimes);
    }
}
