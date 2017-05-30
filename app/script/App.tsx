import * as React from "react";
import {SyntheticEvent} from "react";
import {computed} from "mobx";
import DevTools from "mobx-react-devtools";
import {observer} from "mobx-react";
import {SprinklersDevice, Section, Program, Duration, Schedule} from "./sprinklers";
import {Item, Table, Header, Segment, Form, Input, Button, DropdownItemProps, DropdownProps, Message} from "semantic-ui-react";
import FontAwesome = require("react-fontawesome");
import * as classNames from "classnames";

import "semantic-ui-css/semantic.css";
import "font-awesome/css/font-awesome.css";
import "app/style/app.css";
import {Message as UiMessage, UiStore} from "./ui";

/* tslint:disable:object-literal-sort-keys */

@observer
class SectionTable extends React.PureComponent<{ sections: Section[] }, void> {
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

    public render() {
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

class DurationInput extends React.Component<{
    duration: Duration,
    onDurationChange?: (newDuration: Duration) => void;
}, void> {
    public render() {
        const duration = this.props.duration;
        // const editing = this.props.onDurationChange != null;
        return <div className="field durationInput">
            <label>Duration</label>
            <div className="fields">
                <Input type="number" className="field durationInput--minutes"
                       value={duration.minutes} onChange={this.onMinutesChange}
                       label="M" labelPosition="right"/>
                <Input type="number" className="field durationInput--seconds"
                       value={duration.seconds} onChange={this.onSecondsChange} max="60"
                       label="S" labelPosition="right"/>
            </div>
        </div>;
    }

    private onMinutesChange = (e, {value}) => {
        if (value.length === 0 || isNaN(value)) {
            return;
        }
        const newMinutes = parseInt(value, 10);
        this.props.onDurationChange(this.props.duration.withMinutes(newMinutes));
    }

    private onSecondsChange = (e, {value}) => {
        if (value.length === 0 || isNaN(value)) {
            return;
        }
        const newSeconds = parseInt(value, 10);
        this.props.onDurationChange(this.props.duration.withSeconds(newSeconds));
    }
}

@observer
class RunSectionForm extends React.Component<{
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

    public render() {
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

@observer
class ScheduleView extends React.PureComponent<{ schedule: Schedule }, void> {
    public render() {
        return (
            <div>{JSON.stringify(this.props.schedule)}</div>
        );
    }
}

@observer
class ProgramTable extends React.PureComponent<{ programs: Program[] }, void> {
    private static renderRow(program: Program, i: number): JSX.Element[] {
        if (!program) {
            return null;
        }
        const {name, running, enabled, schedule, sequence} = program;
        return [
            <Table.Row key={i}>
                <Table.Cell className="program--number">{"" + (i + 1)}</Table.Cell>
                <Table.Cell className="program--name">{name}</Table.Cell>
                <Table.Cell className="program--running">{running ? "Running" : "Not running"}</Table.Cell>
                <Table.Cell className="program--enabled">{enabled ? "Enabled" : "Not enabled"}</Table.Cell>
            </Table.Row>
            ,
            <Table.Row key={i + .5}>
                <Table.Cell className="program--sequence" colSpan="4">
                    <ul>
                        {sequence.map((item) =>
                            (<li>Section {item.section + 1 + ""} for&nbsp;
                                {item.duration.minutes}M {item.duration.seconds}S</li>))}
                    </ul>
                    <ScheduleView schedule={schedule}/>
                </Table.Cell>
            </Table.Row>
            ,
        ];
    }

    public render() {
        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell colSpan="7">Programs</Table.HeaderCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.HeaderCell className="program--number">#</Table.HeaderCell>
                        <Table.HeaderCell className="program--name">Name</Table.HeaderCell>
                        <Table.HeaderCell className="program--running">Running?</Table.HeaderCell>
                        <Table.HeaderCell className="program--enabled">Enabled?</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                        Array.prototype.concat.apply([], this.props.programs.map(ProgramTable.renderRow))
                    }
                </Table.Body>
            </Table>
        );
    }
}

const ConnectionState = ({connected}: { connected: boolean }) =>
    <span className={classNames({
        "device--connectionState": true,
        "device--connectionState-connected": connected,
        "device--connectionState-disconnected": !connected,
    })}>
        <FontAwesome name={connected ? "plug" : "chain-broken"}/>
        &nbsp;
        {connected ? "Connected" : "Disconnected"}
    </span>;

@observer
class DeviceView extends React.PureComponent<{ device: SprinklersDevice }, void> {
    public render() {
        const {id, connected, sections, programs} = this.props.device;
        return (
            <Item>
                <Item.Image src={require<string>("app/images/raspberry_pi.png")}/>
                <Item.Content>
                    <Header as="h1">
                        <span>Device </span><kbd>{id}</kbd>
                        <ConnectionState connected={connected}/>
                    </Header>
                    <Item.Meta>

                    </Item.Meta>
                    <SectionTable sections={sections}/>
                    <RunSectionForm sections={sections}/>
                    <ProgramTable programs={programs}/>
                </Item.Content>
            </Item>
        );
    }
}

@observer
class MessagesView extends React.PureComponent<{uiStore: UiStore}, void> {
    public render() {
        return <div>
            {this.props.uiStore.messages.map(this.renderMessage)}
        </div>;
    }

    private renderMessage = (message: UiMessage, index: number) => {
        const {header, content, type} = message;
        return <Message header={header} content={content} success={type === UiMessage.Type.Success}
            info={type === UiMessage.Type.Info} warning={type === UiMessage.Type.Warning}
                        error={type === UiMessage.Type.Error} onDismiss={() => this.dismiss(index)}/>;
    }

    private dismiss(index: number) {
        this.props.uiStore.messages.splice(index, 1);
    }
}

@observer
export default class App extends React.PureComponent<{ device: SprinklersDevice, uiStore: UiStore }, any> {
    public render() {
        return <Item.Group divided>
            <MessagesView uiStore={this.props.uiStore} />
            <DeviceView device={this.props.device}/>
            <DevTools />
        </Item.Group>;
    }
}
