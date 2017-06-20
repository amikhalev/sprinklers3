import * as React from "react";
import {SyntheticEvent} from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";
import {Duration, Section} from "../sprinklers";
import {Segment, Header, Form, DropdownProps, DropdownItemProps} from "semantic-ui-react";
import {DurationInput} from ".";

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
        const {section, duration} = this.state;
        return <Segment>
            <Header>Run Section</Header>
            <Form>
                <Form.Group>
                    <Form.Select label="Section" placeholder="Section" options={this.sectionOptions} value={section}
                                 onChange={this.onSectionChange}/>
                    <DurationInput duration={duration} onDurationChange={this.onDurationChange}/>
                    {/*Label must be &nbsp; to align it properly*/}
                    <Form.Button label="&nbsp;" primary onClick={this.run} disabled={!this.isValid}>Run</Form.Button>
                </Form.Group>
            </Form>
        </Segment>;
    }

    private onSectionChange = (e: SyntheticEvent<HTMLElement>, v: DropdownProps) => {
        this.setState({section: v.value as number});
    }

    private onDurationChange = (newDuration: Duration) => {
        this.setState({duration: newDuration});
    }

    private run = (e: SyntheticEvent<HTMLElement>) => {
        e.preventDefault();
        const section: Section = this.props.sections[this.state.section];
        console.log(`should run section ${section} for ${this.state.duration}`);
        section.run(this.state.duration)
            .then((a) => console.log("ran section", a))
            .catch((err) => console.error("error running section", err));
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