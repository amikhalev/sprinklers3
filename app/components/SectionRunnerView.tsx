import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Button, Icon, Segment } from "semantic-ui-react";

import { Duration } from "@common/Duration";
import { Section, SectionRun, SectionRunner } from "@common/sprinklers";

function PausedState({ paused }: { paused: boolean }) {
    const classes = classNames({
        "sectionRunner--pausedState": true,
        "sectionRunner--pausedState-paused": paused,
        "sectionRunner--pausedState-unpaused": !paused,
    });
    return (
        <span className={classes}>
            <Icon name={paused ? "pause" : "play"} />
            {paused ? "Paused" : "Processing"}
        </span>
    );
}

function SectionRunView({ run, sections }:
    { run: SectionRun, sections: Section[] }) {
    const section = sections[run.section];
    const current = run.startTime != null;
    const duration = Duration.fromSeconds(run.duration);
    const cancel = run.cancel;
    return (
        <Segment inverted={current} color={current ? "green" : undefined}>
            '{section.name}' for {duration.toString()}
            <Button onClick={cancel} icon><Icon name="remove" /></Button>
        </Segment>
    );
}

@observer
export default class SectionRunnerView extends React.Component<{
    sectionRunner: SectionRunner, sections: Section[],
}, {}> {
    render() {
        const { current, queue, paused } = this.props.sectionRunner;
        const { sections } = this.props;
        const queueView = queue.map((run) =>
            <SectionRunView key={run.id} run={run} sections={sections} />);
        return (
            <Segment>
                <h4>Section Runner Queue <PausedState paused={paused} /></h4>
                <Segment.Group>
                    {current && <SectionRunView run={current} sections={sections} />}
                    {queueView}
                </Segment.Group>
            </Segment>
        );
    }
}
