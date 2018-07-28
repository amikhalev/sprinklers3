import classNames = require("classnames");
import { observer } from "mobx-react";
import * as React from "react";
import { SortableContainer, SortableElement, SortableHandle, SortEnd } from "react-sortable-hoc";
import { Button, Form, Icon, List } from "semantic-ui-react";

import { DurationView, SectionChooser } from "@app/components/index";
import { Duration } from "@common/Duration";
import { ProgramItem, Section } from "@common/sprinklersRpc";

import "@app/styles/ProgramSequenceView";

type ItemChangeHandler = (index: number, newItem: ProgramItem) => void;
type ItemRemoveHandler = (index: number) => void;

const Handle = SortableHandle(() => <Button basic icon><Icon name="bars"/></Button>);

@observer
class ProgramSequenceItem extends React.Component<{
    sequenceItem: ProgramItem,
    idx: number,
    sections: Section[],
    editing: boolean,
    onChange: ItemChangeHandler,
    onRemove: ItemRemoveHandler,
}> {
    renderContent() {
        const { editing, sequenceItem, sections } = this.props;
        const section = sections[sequenceItem.section];
        const duration = Duration.fromSeconds(sequenceItem.duration);

        if (editing) {
            return (
                <Form.Group>
                    <Button icon negative onClick={this.onRemove}>
                        <Icon name="cancel" />
                    </Button>
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
        const { editing }= this.props;
        return (
            <li className="programSequence-item ui form">
                {editing ? <Handle /> : <List.Icon name="caret right"/>}
                <List.Content>{this.renderContent()}</List.Content>
            </li>
        );
    }

    private onSectionChange = (newSection: Section) => {
        this.props.onChange(this.props.idx, new ProgramItem({
            ...this.props.sequenceItem, section: newSection.id,
        }));
    }

    private onDurationChange = (newDuration: Duration) => {
        this.props.onChange(this.props.idx, new ProgramItem({
            ...this.props.sequenceItem, duration: newDuration.toSeconds(),
        }));
    }

    private onRemove = () => {
        this.props.onRemove(this.props.idx);
    }
}

const ProgramSequenceItemD = SortableElement(ProgramSequenceItem);

const ProgramSequenceList = SortableContainer(observer((props: {
    className: string,
    list: ProgramItem[],
    sections: Section[],
    editing: boolean,
    onChange: ItemChangeHandler,
    onRemove: ItemRemoveHandler,
}) => {
    const { className, list, sections, ...rest } = props;
    const listItems = list.map((item, index) => {
        const key = `item-${index}`;
        return (
            <ProgramSequenceItemD
                {...rest}
                key={key}
                sequenceItem={item}
                index={index}
                idx={index}
                sections={sections}
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
        let addButton: React.ReactNode = null;
        if (editing) {
            addButton = (
                <Button onClick={this.addItem}>
                    <Icon name="add"/>
                    Add item
                </Button>
            );
        }
        return (
            <div>
                <ProgramSequenceList
                    className={className}
                    useDragHandle
                    helperClass="dragging"
                    list={sequence}
                    sections={sections}
                    editing={editing}
                    onChange={this.changeItem}
                    onRemove={this.removeItem}
                    onSortEnd={this.onSortEnd}
                />
                {addButton}
            </div>
        );
    }

    private changeItem: ItemChangeHandler = (index, newItem) => {
        this.props.sequence[index] = newItem;
    }

    private removeItem: ItemRemoveHandler = (index) => {
        this.props.sequence.splice(index, 1);
    }

    private addItem = () => {
        let sectionId = 0;
        for (const section of this.props.sections) {
            const sectionNotIncluded = this.props.sequence
                .every((sequenceItem) =>
                    sequenceItem.section !== section.id);
            if (sectionNotIncluded) {
                sectionId = section.id;
                break;
            }
        }
        const item = new ProgramItem({
            section: sectionId,
            duration: new Duration(5, 0).toSeconds(),
        });
        this.props.sequence.push(item);
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
