import classNames = require("classnames");
import { observer } from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SortableContainer, SortableElement, SortableHandle, SortEnd, arrayMove } from "react-sortable-hoc";
import { Form, Icon, List } from "semantic-ui-react";

import { DurationView, SectionChooser } from "@app/components/index";
import { Duration } from "@common/Duration";
import { ProgramItem, Section } from "@common/sprinklersRpc";

import "@app/styles/ProgramSequenceView";

const Handle = SortableHandle(() => <Icon name="bars"/>);

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
                <Form.Group>
                    <SectionChooser
                        label="Section"
                        sections={sections}
                        value={section}
                        onChange={this.onSectionChange}
                    />
                    <DurationView
                        label="Duration"
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
        const editing = this.props.onChange != null;
        return (
            <li className="programSequence-item ui form">
                {editing ? <Handle /> : <List.Icon name="caret right"/>}
                <List.Content>{this.renderContent()}</List.Content>
            </li>
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

const ProgramSequenceItemD = SortableElement(ProgramSequenceItem);

type ItemChangeHandler = (newItem: ProgramItem, index: number) => void;

const ProgramSequenceList = SortableContainer(observer(({ className, list, sections, onChange }: {
    className: string,
    list: ProgramItem[],
    sections: Section[],
    onChange?: ItemChangeHandler,
}) => {
    const listItems = list.map((item, index) => {
        const onChangeHandler = onChange ? (newItem: ProgramItem) => onChange(newItem, index) : undefined;
        const key = `item-${index}`;
        return (
            <ProgramSequenceItemD
                sequenceItem={item}
                sections={sections}
                key={key}
                index={index}
                onChange={onChangeHandler}
            />
        );
    });
    return <ul className={className}>{listItems}</ul>;
}), { withRef: true });

@observer
class ProgramSequenceView extends React.Component<{
    sequence: ProgramItem[], sections: Section[], editing?: boolean,
}> {
    render() {
        const { sequence, sections } = this.props;
        const editing = this.props.editing || false;
        const className = classNames("programSequence", { editing });
        const onChange = editing ? this.changeItem : undefined;
        return (
            <ProgramSequenceList
                className={className}
                useDragHandle
                list={sequence}
                sections={sections}
                onChange={onChange}
                onSortEnd={this.onSortEnd}
            />
        );
    }

    private changeItem: ItemChangeHandler = (newItem, index) => {
        this.props.sequence[index] = newItem;
    }

    private onSortEnd = ({oldIndex, newIndex}: SortEnd) => {
        const { sequence: array } = this.props;
        if (newIndex >= array.length) {
            return;
        }
        array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    }
}

const ProgramSequenceViewD = SortableContainer(ProgramSequenceView);
export default ProgramSequenceViewD;
