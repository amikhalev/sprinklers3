import * as React from "react";
import { Checkbox, CheckboxProps, Form } from "semantic-ui-react";

import { Weekday, WEEKDAYS } from "@common/sprinklersRpc";

export interface WeekdaysViewProps {
  weekdays: Weekday[];
  editing: boolean;
  onChange?: (newWeekdays: Weekday[]) => void;
}

export default class WeekdaysView extends React.Component<WeekdaysViewProps> {
  render() {
    const { weekdays, editing } = this.props;
    let node: React.ReactNode;
    if (editing) {
      node = WEEKDAYS.map(weekday => {
        const checked = weekdays.find(wd => wd === weekday) != null;
        const name = Weekday[weekday];
        return (
          <Form.Field
            control={Checkbox}
            x-weekday={weekday}
            label={name}
            checked={checked}
            key={weekday}
            onChange={this.toggleWeekday}
          />
        );
      });
    } else {
      node = weekdays.map(weekday => Weekday[weekday]).join(", ");
    }
    return (
      <Form.Group inline>
        <label>On</label> {node}
      </Form.Group>
    );
  }
  private toggleWeekday = (
    event: React.FormEvent<HTMLInputElement>,
    data: CheckboxProps
  ) => {
    const { weekdays, onChange } = this.props;
    if (!onChange) {
      return;
    }
    const weekday: Weekday = Number(
      event.currentTarget.getAttribute("x-weekday")
    );
    if (data.checked) {
      const newWeekdays = weekdays.concat([weekday]);
      newWeekdays.sort();
      onChange(newWeekdays);
    } else {
      onChange(weekdays.filter(wd => wd !== weekday));
    }
  };
}
