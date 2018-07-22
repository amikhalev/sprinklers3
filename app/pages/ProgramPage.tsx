import { observer } from "mobx-react";
import * as React from "react";
import { Button, Menu, Segment} from "semantic-ui-react";

import { ProgramSequenceView, ScheduleView } from "@app/components";
import { AppState, injectState } from "@app/state";
import { Program, SprinklersDevice } from "@common/sprinklersRpc";
import { RouteComponentProps } from "react-router";
import { Link } from "react-router-dom";

@observer
class ProgramDetailView extends React.Component {

}

@observer
class ProgramPage extends React.Component<{
    appState: AppState,
} & RouteComponentProps<{ deviceId: string, programId: number }>> {
    device!: SprinklersDevice;

    render() {
        const { deviceId, programId } = this.props.match.params;
        const device = this.device = this.props.appState.sprinklersRpc.getDevice(deviceId);
        // TODO: check programId
        if (device.programs.length <= programId || !device.programs[programId]) {
            return null;
        }
        const program = device.programs[programId];

        const programRows = this.renderRows(program, programId);
        return (
            <div>
                <Menu attached="top">
                    <Menu.Item header>Program {program.name} ({program.id})</Menu.Item>
                    <Menu.Menu position="right">
                        <Menu.Item>
                            <Button as={Link} to={"/devices/" + deviceId}>
                                Back
                            </Button>
                        </Menu.Item>
                    </Menu.Menu>
                </Menu>
                <Segment attached="bottom">
                    {programRows}
                </Segment>
            </div>
        );
    }

    private renderRows = (program: Program, i: number): JSX.Element | null => {
        const { name, running, enabled, schedule, sequence } = program;
        const cancelOrRun = () => running ? program.cancel() : program.run();
        return (
            <React.Fragment key={i}>
                <b>Enabled: </b>{enabled ? "Enabled" : "Not enabled"}<br/>
                <b>Running: </b>{running ? "Running" : "Not running"}<br/>
                <Button size="small" onClick={cancelOrRun}>
                    {running ? "Cancel" : "Run"}
                </Button>
                <h4>Sequence: </h4> <ProgramSequenceView sequence={sequence} sections={this.device.sections}/>
                <h4>Schedule: </h4> <ScheduleView schedule={schedule}/>
            </React.Fragment>
        );
    }
}

const DecoratedProgramPage = injectState(observer(ProgramPage));
export default DecoratedProgramPage;
