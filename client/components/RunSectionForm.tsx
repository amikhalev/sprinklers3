import { observer } from "mobx-react";
import * as React from "react";
import { Form, Header, Icon, Segment } from "semantic-ui-react";

import { DurationView, SectionChooser } from "@client/components";
import { UiStore } from "@client/state";
import { Duration } from "@common/Duration";
import log from "@common/logger";
import { Section, SprinklersDevice } from "@common/sprinklersRpc";
import { RunSectionResponse } from "@common/sprinklersRpc/deviceRequests";

@observer
export default class RunSectionForm extends React.Component<{
    device: SprinklersDevice,
    uiStore: UiStore,
}, {
    duration: Duration,
    sectionId: number | undefined,
}> {
    constructor(props: any, context?: any) {
        super(props, context);
        this.state = {
            duration: new Duration(0, 0),
            sectionId: undefined,
        };
    }

    render() {
        const { sectionId, duration } = this.state;
        return (
            <Segment>
                <Header>Run Section</Header>
                <Form>
                    <SectionChooser
                        label="Section"
                        sections={this.props.device.sections}
                        sectionId={sectionId}
                        onChange={this.onSectionChange}
                    />
                    <DurationView
                        label="Duration"
                        duration={duration}
                        onDurationChange={this.onDurationChange}
                    />
                    <Form.Button
                        primary
                        onClick={this.run}
                        disabled={!this.isValid}
                    >
                        <Icon name="play"/>
                        Run
                    </Form.Button>
                </Form>
            </Segment>
        );
    }

    private onSectionChange = (newSectionId: number) => {
        this.setState({ sectionId: newSectionId });
    }

    private onDurationChange = (newDuration: Duration) => {
        this.setState({ duration: newDuration });
    }

    private run = (e: React.SyntheticEvent<HTMLElement>) => {
        e.preventDefault();
        const { sectionId, duration } = this.state;
        if (sectionId == null) {
            return;
        }
        const section = this.props.device.sections[sectionId];
        section.run(duration.toSeconds())
            .then(this.onRunSuccess)
            .catch(this.onRunError);
    }

    private onRunSuccess = (result: RunSectionResponse) => {
        log.debug({ result }, "requested section run");
        this.props.uiStore.addMessage({
            success: true, header: "Section running",
            content: result.message, timeout: 2000,
        });
    }

    private onRunError = (err: RunSectionResponse) => {
        log.error(err, "error running section");
        this.props.uiStore.addMessage({
            error: true, header: "Error running section",
            content: err.message,
        });
    }

    private get isValid(): boolean {
        return this.state.sectionId != null && this.state.duration.toSeconds() > 0;
    }
}
