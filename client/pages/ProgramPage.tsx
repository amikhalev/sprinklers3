import { assign, merge } from "lodash";
import { observer } from "mobx-react";
import * as qs from "query-string";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Button, CheckboxProps, Form, Icon, Input, InputOnChangeData, Menu, Modal } from "semantic-ui-react";

import { ProgramSequenceView, ScheduleView } from "@client/components";
import * as route from "@client/routePaths";
import { AppState, injectState } from "@client/state";
import { ISprinklersDevice } from "@common/httpApi";
import log from "@common/logger";
import { Program, SprinklersDevice } from "@common/sprinklersRpc";
import { action } from "mobx";

interface ProgramPageProps extends RouteComponentProps<{ deviceId: string, programId: string }> {
    appState: AppState;
}

@observer
class ProgramPage extends React.Component<ProgramPageProps> {
    get isEditing(): boolean {
        return qs.parse(this.props.location.search).editing != null;
    }

    iDevice!: ISprinklersDevice;
    device!: SprinklersDevice;
    program!: Program;
    programView: Program | null = null;

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
                        <Icon name="save" />
                        Save
                    </Button>
                    <Button negative onClick={this.stopEditing}>
                        <Icon name="cancel" />
                        Cancel
                    </Button>
                </React.Fragment>
            );
        } else {
            editButtons = (
                <Button primary onClick={this.startEditing}>
                    <Icon name="edit" />
                    Edit
                </Button>
            );
        }
        const stopStartButton = (
            <Button onClick={this.cancelOrRun} positive={!running} negative={running}>
                <Icon name={running ? "stop" : "play"} />
                {running ? "Stop" : "Run"}
            </Button>
        );
        return (
            <Modal.Actions>
                {stopStartButton}
                {editButtons}
                <Button onClick={this.close}>
                    <Icon name="arrow left" />
                    Close
                </Button>
            </Modal.Actions>
        );
    }

    render() {
        const { deviceId: did, programId: pid } = this.props.match.params;
        const { userStore, sprinklersRpc } = this.props.appState;
        const deviceId = Number(did);
        const programId = Number(pid);
        // tslint:disable-next-line:prefer-conditional-expression
        if (!this.iDevice || this.iDevice.id !== deviceId) {
            this.iDevice = userStore.findDevice(deviceId)!;
        }
        if (this.iDevice && this.iDevice.deviceId && (!this.device || this.device.id !== this.iDevice.deviceId)) {
            this.device = sprinklersRpc.getDevice(this.iDevice.deviceId);
        }
        // tslint:disable-next-line:prefer-conditional-expression
        if (!this.program || this.program.id !== programId) {
            if (this.device.programs.length > programId && programId >= 0) {
                this.program = this.device.programs[programId];
            } else {
                return null;
            }
        }
        if (this.isEditing) {
            if (this.programView == null && this.program) {
                // this.programView = createViewModel(this.program);
                // this.programView = observable(toJS(this.program));
                this.programView = this.program.clone();
            }
        } else {
            if (this.programView != null) {
                // this.programView.reset();
                this.programView = null;
            }
        }

        const program = this.programView || this.program;
        const editing = this.isEditing;

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
                            <Form.Checkbox toggle label="Running" checked={running} readOnly={!editing} />
                        </Form.Group>
                        <Form.Field>
                            <label><h4>Sequence</h4></label>
                            <ProgramSequenceView
                                sequence={sequence}
                                sections={this.device.sections}
                                editing={editing}
                            />
                        </Form.Field>
                        <ScheduleView schedule={schedule} editing={editing} label={<h4>Schedule</h4>} />
                    </Form>
                </Modal.Content>
                {this.renderActions(program)}
            </Modal>
        );
    }

    @action.bound
    private cancelOrRun() {
        if (!this.program) {
            return;
        }
        this.program.running ? this.program.cancel() : this.program.run();
    }

    @action.bound
    private startEditing() {
        this.props.history.push({ search: qs.stringify({ editing: true }) });
    }

    @action.bound
    private save() {
        if (!this.programView || !this.program) {
            return;
        }
        assign(this.program, this.programView);
        this.program.update()
            .then((data) => {
                log.info({ data }, "Program updated");
            }, (err) => {
                log.error({ err }, "error updating Program");
            });
        this.stopEditing();
    }

    @action.bound
    private stopEditing() {
        this.props.history.push({ search: "" });
    }

    @action.bound
    private close() {
        const { deviceId } = this.props.match.params;
        this.props.history.push({ pathname: route.device(deviceId), search: "" });
    }

    @action.bound
    private onNameChange(e: any, p: InputOnChangeData) {
        if (this.programView) {
            this.programView.name = p.value;
        }
    }

    @action.bound
    private onEnabledChange(e: any, p: CheckboxProps) {
        if (this.programView) {
            this.programView.enabled = p.checked!;
        }
    }
}

const DecoratedProgramPage = injectState(observer(ProgramPage));
export default DecoratedProgramPage;
