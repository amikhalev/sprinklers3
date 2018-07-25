import { observer } from "mobx-react";
import { createViewModel, IViewModel } from "mobx-utils";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Button, CheckboxProps, Form, Input, InputOnChangeData, Menu, Modal } from "semantic-ui-react";

import { ProgramSequenceView, ScheduleView } from "@app/components";
import * as rp from "@app/routePaths";
import { AppState, injectState } from "@app/state";
import log from "@common/logger";
import { Program, SprinklersDevice } from "@common/sprinklersRpc";

@observer
class ProgramPage extends React.Component<{
    appState: AppState,
} & RouteComponentProps<{ deviceId: string, programId: number }>, {
    programView: Program & IViewModel<Program> | undefined,
}> {
    private device!: SprinklersDevice;
    private program!: Program;

    constructor(p: any) {
        super(p);
        this.state = {
            programView: undefined,
        };
    }

    get isEditing(): boolean {
        return this.state.programView != null;
    }

    renderName(program: Program) {
        const { name } = program;
        if (this.isEditing) {
            return (
                <Menu.Item header>
                    <Form>
                        <Form.Group inline>
                            <Form.Field inline>
                                <label><h4>Program</h4></label>
                                <Input
                                    placeholder="Program Name"
                                    type="text"
                                    value={name}
                                    onChange={this.onNameChange}
                                />
                            </Form.Field>
                            ({program.id})
                        </Form.Group>
                    </Form>
                </Menu.Item>
            );
        } else {
            return <Menu.Item header as="h4">Program {name} ({program.id})</Menu.Item>;
        }
    }

    renderActions(program: Program) {
        const { running } = program;
        const editing = this.isEditing;
        let editButtons;
        if (editing) {
            editButtons = (
                <React.Fragment>
                    <Button primary onClick={this.save}>
                        Save
                    </Button>
                    <Button negative onClick={this.cancelEditing}>
                        Cancel
                    </Button>
                </React.Fragment>
            );
        } else {
            editButtons = (
                <Button primary onClick={this.startEditing}>
                    Edit
                </Button>
            );
        }
        return (
            <Modal.Actions>
                <Button positive={!running} negative={running} onClick={this.cancelOrRun}>
                    {running ? "Stop" : "Run"}
                </Button>
                {editButtons}
                <Button onClick={this.close}>
                    Close
                </Button>
            </Modal.Actions>
        );
    }

    render() {
        const { deviceId, programId } = this.props.match.params;
        const device = this.device = this.props.appState.sprinklersRpc.getDevice(deviceId);
        // TODO: check programId
        if (device.programs.length <= programId || !device.programs[programId]) {
            return null;
        }
        this.program = device.programs[programId];

        const { programView } = this.state;
        const program = programView || this.program;
        const editing = programView != null;

        const { running, enabled, schedule, sequence } = program;

        return (
            <Modal open onClose={this.close} className="programEditor">
                <Modal.Header>{this.renderName(program)}</Modal.Header>
                <Modal.Content>
                    <Form>
                        <Form.Group>
                            <Form.Checkbox
                                toggle
                                label="Enabled"
                                checked={enabled}
                                readOnly={!editing}
                                onChange={this.onEnabledChange}
                            />
                            <Form.Checkbox toggle label="Running" checked={running} readOnly={!editing}/>
                        </Form.Group>
                        <Form.Field>
                            <label><h4>Sequence</h4></label>
                            <ProgramSequenceView sequence={sequence} sections={this.device.sections} editing={editing}/>
                        </Form.Field>
                        <Form.Field>
                            <label><h4>Schedule</h4></label>
                            <ScheduleView schedule={schedule}/>
                        </Form.Field>
                    </Form>
                </Modal.Content>
                {this.renderActions(program)}
            </Modal>
        );
    }

    private cancelOrRun = () => {
        if (!this.program) {
            return;
        }
        this.program.running ? this.program.cancel() : this.program.run();
    }

    private startEditing = () => {
        let { programView } = this.state;
        if (programView) { // stop editing, so save
            programView.submit();
            programView = undefined;
        } else { // start editing
            programView = createViewModel(this.program);
        }
        this.setState({ programView });
    }

    private save = () => {
        let { programView } = this.state;
        if (programView) { // stop editing, so save
            programView.submit();
            programView = undefined;
        }
        this.setState({ programView });
        this.program.update()
            .then((data) => {
                log.info({ data }, "Program updated");
            }, (err) => {
                log.error({ err }, "error updating Program");
            });
    }

    private cancelEditing = () => {
        let { programView } = this.state;
        if (programView) {
            programView = undefined; // stop editing
        }
        this.setState({ programView });
    }

    private close = () => {
        const { deviceId } = this.props.match.params;
        this.props.history.push({ pathname: rp.device(deviceId) });
    }

    private onNameChange = (e: any, p: InputOnChangeData) => {
        const { programView } = this.state;
        if (programView) {
            programView.name = p.value;
        }
    }

    private onEnabledChange = (e: any, p: CheckboxProps) => {
        const { programView } = this.state;
        if (programView) {
            programView.enabled = p.checked!;
        }
    }
}

const DecoratedProgramPage = injectState(observer(ProgramPage));
export default DecoratedProgramPage;
