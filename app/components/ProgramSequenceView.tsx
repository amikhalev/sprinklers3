import classNames = require("classnames");
import { observer } from "mobx-react";
import * as React from "react";
import { Form, List } from "semantic-ui-react";

import { DurationView, SectionChooser } from "@app/components/index";
import { Duration } from "@common/Duration";
import { ProgramItem, Section } from "@common/sprinklersRpc";

import "@app/styles/ProgramSequenceView";

@observer
class ProgramSequenceItem extends React.Component<{
    sequenceItem: ProgramItem, sections: Section[], onChange?: (newItem: ProgramItem) => void,
}> {
    renderContent() {
        const { sequenceItem, sections } = this.props;
        const editing = this.props.onChange != null;
        const section = sections[sequenceItem.section];
        const duration = Duration.fromSeconds(sequenceItem.duration);

        if (editing) {
            return (
                <Form.Group inline>
                    <SectionChooser
                        label="Section"
                        inline
                        sections={sections}
                        value={section}
                        onChange={this.onSectionChange}
                    />
                    <DurationView
                        label="Duration"
                        inline
                        duration={duration}
                        onDurationChange={this.onDurationChange}
                    />
                </Form.Group>
            );
        } else {
            return (
                <React.Fragment>
                    <List.Header>{section.toString()}</List.Header>
                    <List.Description>for {duration.toString()}</List.Description>
                </React.Fragment>
            );
        }
    }

    render() {
        return (
            <List.Item>
                <List.Icon name="caret right"/>
                <List.Content>{this.renderContent()}</List.Content>
            </List.Item>
        );
    }

    private onSectionChange = (newSection: Section) => {
        if (!this.props.onChange) {
            return;
        }
        this.props.onChange(new ProgramItem({
            ...this.props.sequenceItem, section: newSection.id,
        }));
    }

    private onDurationChange = (newDuration: Duration) => {
        if (!this.props.onChange) {
            return;
        }
        this.props.onChange(new ProgramItem({
            ...this.props.sequenceItem, duration: newDuration.toSeconds(),
        }));
    }
}

@observer
export default class ProgramSequenceView extends React.Component<{
    sequence: ProgramItem[], sections: Section[], editing?: boolean,
}> {
    render() {
        const { sequence, sections } = this.props;
        const editing = this.props.editing || false;
        const className = classNames("programSequence", { editing });
        const sequenceItems = sequence.map((item, index) => {
            const onChange = editing ? (newItem: ProgramItem) => this.changeItem(newItem, index) : undefined;
            return <ProgramSequenceItem sequenceItem={item} sections={sections} key={index} onChange={onChange}/>;
        });
        return <List className={className}>{sequenceItems}</List>;
    }

    private changeItem = (newItem: ProgramItem, index: number) => {
        this.props.sequence[index] = newItem;
    }
}
