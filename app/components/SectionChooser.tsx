import { computed } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { DropdownItemProps, DropdownProps, Form } from "semantic-ui-react";

import { Section } from "@common/sprinklersRpc";

@observer
export default class SectionChooser extends React.Component<{
    label?: string,
    inline?: boolean,
    sections: Section[],
    value?: Section,
    onChange?: (section: Section) => void,
}> {
    render() {
        const { label, inline, sections, value, onChange } = this.props;
        let section = (value == null) ? "" : sections.indexOf(value);
        section = (section === -1) ? "" : section;
        const onSectionChange = (onChange == null) ? undefined : this.onSectionChange;
        if (onChange == null) {
            return <React.Fragment>{label || ""} '{value ? value.toString() : ""}'</React.Fragment>;
        }
        return (
            <Form.Select
                className="sectionChooser"
                label={label}
                inline={inline}
                placeholder="Section"
                options={this.sectionOptions}
                value={section}
                onChange={onSectionChange}
            />
        );
    }

    private onSectionChange = (e: React.SyntheticEvent<HTMLElement>, v: DropdownProps) => {
        this.props.onChange!(this.props.sections[v.value as number]);
    }

    @computed
    private get sectionOptions(): DropdownItemProps[] {
        return this.props.sections.map((s, i) => ({
            text: s ? `${s.id}: ${s.name}` : null,
            value: i,
        }));
    }
}
