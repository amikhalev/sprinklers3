import { computed } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { DropdownItemProps, DropdownProps, Form, Header, Segment } from "semantic-ui-react";

import { UiStore } from "@app/state";
import { Duration } from "@common/Duration";
import log from "@common/logger";
import { Section, SprinklersDevice } from "@common/sprinklers";
import { RunSectionResponse } from "@common/sprinklers/deviceRequests";
import DurationInput from "./DurationInput";

@observer
export default class RunSectionForm extends React.Component<{
    device: SprinklersDevice,
    uiStore: UiStore,
}, {
    duration: Duration,
    section: number | "",
}> {
    constructor(props: any, context?: any) {
        super(props, context);
        this.state = {
            duration: new Duration(0, 0),
            section: "",
        };
    }

    render() {
        const { section, duration } = this.state;
        return (
            <Segment>
                <Header>Run Section</Header>
                <Form>
                    <Form.Select
                        label="Section"
                        placeholder="Section"
                        options={this.sectionOptions}
                        value={section}
                        onChange={this.onSectionChange}
                    />
                    <DurationInput
                        duration={duration}
                        onDurationChange={this.onDurationChange}
                    />
                    {/*Label must be &nbsp; to align it properly*/}
                    <Form.Button
                        label="&nbsp;"
                        primary
                        onClick={this.run}
                        disabled={!this.isValid}
                    >
                        Run
                    </Form.Button>
                </Form>
            </Segment>
        );
    }

    private onSectionChange = (e: React.SyntheticEvent<HTMLElement>, v: DropdownProps) => {
        this.setState({ section: v.value as number });
    }

    private onDurationChange = (newDuration: Duration) => {
        this.setState({ duration: newDuration });
    }

    private run = (e: React.SyntheticEvent<HTMLElement>) => {
        e.preventDefault();
        if (typeof this.state.section !== "number") {
            return;
        }
        const section: Section = this.props.device.sections[this.state.section];
        const { duration } = this.state;
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
        return typeof this.state.section === "number";
    }

    @computed
    private get sectionOptions(): DropdownItemProps[] {
        return this.props.device.sections.map((s, i) => ({
            text: s ? s.name : null,
            value: i,
        }));
    }
}
