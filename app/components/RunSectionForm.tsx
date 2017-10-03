import { computed } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { DropdownItemProps, DropdownProps, Form, Header, Segment } from "semantic-ui-react";

import log from "@common/logger";
import { Duration, Section } from "@common/sprinklers";
import DurationInput from "./DurationInput";

@observer
export default class RunSectionForm extends React.Component<{
    sections: Section[],
}, {
    duration: Duration,
    section: number | "",
}> {
    constructor() {
        super();
        this.state = {
            duration: new Duration(1, 1),
            section: "",
        };
    }

    render() {
        const { section, duration } = this.state;
        return (
            <Segment>
                <Header>Run Section</Header>
                <Form>
                    <Form.Group>
                        <Form.Select
                            label="Section"
                            placeholder="Section"
                            options={this.sectionOptions}
                            value={section}
                            onChange={this.onSectionChange}
                        />
                        <DurationInput duration={duration} onDurationChange={this.onDurationChange} />
                        {/*Label must be &nbsp; to align it properly*/}
                        <Form.Button
                            label="&nbsp;"
                            primary
                            onClick={this.run}
                            disabled={!this.isValid}
                        >
                            Run
                        </Form.Button>
                    </Form.Group>
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
        const section: Section = this.props.sections[this.state.section];
        const { duration } = this.state;
        log.debug({ section, duration }, "running section");
        section.run(duration)
            .then((a) => log.debug("ran section", a))
            .catch((err) => log.error(err, "error running section"));
    }

    private get isValid(): boolean {
        return typeof this.state.section === "number";
    }

    @computed
    private get sectionOptions(): DropdownItemProps[] {
        return this.props.sections.map((s, i) => ({
            text: s ? s.name : null,
            value: i,
        }));
    }
}
