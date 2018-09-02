import { computed } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { DropdownItemProps, DropdownProps, Form } from "semantic-ui-react";

import { Section } from "@common/sprinklersRpc";

import "@client/styles/SectionChooser";

@observer
export default class SectionChooser extends React.Component<{
  label?: string;
  inline?: boolean;
  sections: Section[];
  sectionId?: number;
  onChange?: (sectionId: number) => void;
}> {
  render() {
    const { label, inline, sections, sectionId, onChange } = this.props;
    if (onChange == null) {
      const sectionStr =
        sectionId != null ? sections[sectionId].toString() : "";
      return (
        <React.Fragment>
          {label || ""} '{sectionStr}'
        </React.Fragment>
      );
    }
    const section = sectionId == null ? "" : sectionId;
    return (
      <Form.Select
        className="sectionChooser"
        label={label}
        inline={inline}
        placeholder="Section"
        options={this.sectionOptions}
        value={section}
        onChange={this.onSectionChange}
      />
    );
  }

  private onSectionChange = (
    e: React.SyntheticEvent<HTMLElement>,
    v: DropdownProps
  ) => {
    this.props.onChange!(this.props.sections[v.value as number].id);
  };

  @computed
  private get sectionOptions(): DropdownItemProps[] {
    return this.props.sections.map((s, i) => ({
      text: s ? `${s.id}: ${s.name}` : null,
      value: i
    }));
  }
}
