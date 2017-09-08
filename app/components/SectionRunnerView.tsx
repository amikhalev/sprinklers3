import { observer } from "mobx-react";
import * as React from "react";
import { Segment } from "semantic-ui-react";

import { SectionRunner } from "@common/sprinklers";

@observer
export default class SectionRunnerView extends React.Component<{ sectionRunner: SectionRunner }, {}> {
    render() {
        return (
            <Segment>
                <h4>Section Runner Queue</h4>
            </Segment>
        );
    }
}
