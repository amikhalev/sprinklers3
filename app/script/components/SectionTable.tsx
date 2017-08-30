import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Table } from "semantic-ui-react";

import { Section } from "../sprinklers";
import FontAwesome = require("react-fontawesome");

/* tslint:disable:object-literal-sort-keys */

@observer
export default class SectionTable extends React.Component<{ sections: Section[] }> {
    private static renderRow(section: Section, index: number) {
        if (!section) {
            return null;
        }
        const { name, state } = section;
        const sectionStateClass = classNames({
            "section--state": true,
            "section--state-true": state,
            "section--state-false": !state,
        });
        const sectionState = state ?
            (<span><FontAwesome name="tint" /> Irrigating</span>)
            : "Not irrigating";
        return (
            <Table.Row key={index}>
                <Table.Cell className="section--number">{"" + (index + 1)}</Table.Cell>
                <Table.Cell className="section--name">{name}</Table.Cell>
                <Table.Cell className={sectionStateClass}>{sectionState}</Table.Cell>
            </Table.Row>
        );
    }

    render() {
        const rows = this.props.sections.map(SectionTable.renderRow);
        return (
            <Table celled striped>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell colSpan="3">Sections</Table.HeaderCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.HeaderCell className="section--number">#</Table.HeaderCell>
                        <Table.HeaderCell className="section--name">Name</Table.HeaderCell>
                        <Table.HeaderCell className="section--state">State</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rows}
                </Table.Body>
            </Table>
        );
    }
}
