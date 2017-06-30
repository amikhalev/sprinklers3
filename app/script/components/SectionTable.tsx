import * as React from "react";
import {observer} from "mobx-react";
import * as classNames from "classnames";
import {Table} from "semantic-ui-react";
import FontAwesome = require("react-fontawesome");

import {Section} from "../sprinklers";

/* tslint:disable:object-literal-sort-keys */

@observer
export default class SectionTable extends React.PureComponent<{ sections: Section[] }, {}> {
    private static renderRow(section: Section, index: number) {
        if (!section) {
            return null;
        }
        const {name, state} = section;
        return (
            <Table.Row key={index}>
                <Table.Cell className="section--number">{"" + (index + 1)}</Table.Cell>
                <Table.Cell className="section--name">{name}</Table.Cell>
                <Table.Cell className={classNames({
                    "section--state": true,
                    "section--state-true": state,
                    "section--state-false": !state,
                })}>{state ?
                    (<span><FontAwesome name="tint"/> Irrigating</span>)
                    : "Not irrigating"}
                </Table.Cell>
            </Table.Row>
        );
    }

    render() {
        return (<Table celled striped>
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
                    {
                        this.props.sections.map(SectionTable.renderRow)
                    }
                </Table.Body>
            </Table>
        );
    }
}
