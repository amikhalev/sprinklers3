import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Button, Icon, Progress, Segment } from "semantic-ui-react";

import { Duration } from "@common/Duration";
import log from "@common/logger";
import { Section, SectionRun, SectionRunner } from "@common/sprinklers";

interface PausedStateProps {
    paused: boolean;
    togglePaused: () => void;
}

function PausedState({ paused, togglePaused }: PausedStateProps) {
    const classes = classNames({
        "sectionRunner--pausedState": true,
        "sectionRunner--pausedState-paused": paused,
        "sectionRunner--pausedState-unpaused": !paused,
    });
    return (
        <Button className={classes} size="tiny" onClick={togglePaused}>
            <Icon name={paused ? "pause" : "play"}/>
            {paused ? "Paused" : "Processing"}
        </Button>
    );
}

class SectionRunView extends React.Component<{
    run: SectionRun;
    sections: Section[];
}, {
    now: number;
}> {
    animationFrameHandle: number | null = null;
    startTime: number;

    constructor(p: any) {
        super(p);
        const now = performance.now();
        this.state = { now };
        this.startTime = Date.now() - now;
    }

    componentDidMount() {
        this.requestAnimationFrame();
    }

    componentDidUpdate() {
        this.requestAnimationFrame();
    }

    componentWillUnmount() {
        this.cancelAnimationFrame();
    }

    cancelAnimationFrame = () => {
        if (this.animationFrameHandle != null) {
            cancelAnimationFrame(this.animationFrameHandle);
            this.animationFrameHandle = null;
        }
    }

    requestAnimationFrame = () => {
        const startTime = this.props.run.startTime;
        if (startTime != null) {
            if (this.animationFrameHandle == null) {
                this.animationFrameHandle = requestAnimationFrame(this.updateNow);
            }
        } else {
            this.cancelAnimationFrame();
        }
    }

    updateNow = (now: number) => {
        this.animationFrameHandle = null;
        this.setState({
            now: this.startTime + now,
        });
        this.requestAnimationFrame();
    }

    render() {
        const { run, sections } = this.props;
        let now = this.state.now;
        const section = sections[run.section];
        const duration = Duration.fromSeconds(run.duration);
        const cancel = run.cancel;
        const description = `'${section.name}' for ${duration.toString()}`;
        let running: boolean = false;
        let paused: boolean = false;
        let progressBar: React.ReactNode | undefined;
        if (run.startTime != null) {
            running = true;
            if (run.pauseTime) {
                now = run.pauseTime.valueOf();
                paused = true;
            }
            const elapsed = (now.valueOf() - run.startTime.valueOf()) / 1000;
            const percentage = elapsed / run.duration;
            progressBar =
                <Progress color={paused ? "yellow" : "blue"} size="tiny" percent={percentage * 100}/>;
        }
        return (
            <Segment className="sectionRun">
                <div className="flex-horizontal-space-between">
                    {description}
                    <Button onClick={cancel} icon size="mini"><Icon name="remove"/></Button>
                </div>
                {progressBar}
            </Segment>
        );
    }
}

@observer
export default class SectionRunnerView extends React.Component<{
    sectionRunner: SectionRunner, sections: Section[],
}, {}> {
    render() {
        const { current, queue, paused } = this.props.sectionRunner;
        const { sections } = this.props;
        const queueView = queue.map((run) =>
            <SectionRunView key={run.id} run={run} sections={sections}/>);
        if (current) {
            queueView.unshift(<SectionRunView run={current} sections={sections}/>);
        }
        if (queueView.length === 0) {
            queueView.push(<Segment>No items in queue</Segment>);
        }
        return (
            <Segment className="sectionRunner">
                <div style={{ display: "flex", alignContent: "baseline" }}>
                    <h4 style={{ marginBottom: 0 }}>Section Runner Queue</h4>
                    <div className="flex-spacer"/>
                    <PausedState paused={paused} togglePaused={this.togglePaused}/>
                </div>
                <Segment.Group className="queue">
                    {queueView}
                </Segment.Group>
            </Segment>
        );
    }

    togglePaused = () => {
        const { sectionRunner } = this.props;
        const paused = !sectionRunner.paused;
        sectionRunner.setPaused(paused)
            .then((res) => log.info(res, "set section runner paused to " + paused))
            .catch((err) => log.info({ err }, "error setting section runner paused status"));
    }
}
