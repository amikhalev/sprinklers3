import * as React from "react";
import { Button, Segment } from "semantic-ui-react";

import { AppState, injectState } from "@client/state";
import { getRandomId } from "@common/utils";

class MessageTest extends React.Component<{ appState: AppState }> {
    render() {
        return (
            <Segment>
                <h2>Message Test</h2>
                <Button onClick={this.test1}>Add test message</Button>
                <Button onClick={this.test2}>Add test message w/ timeout</Button>
                <Button onClick={this.test3}>Add test message w/ content</Button>
            </Segment>
        );
    }

    private test1 = () => {
        this.props.appState.uiStore.addMessage({
            info: true, content: "Test Message! " + getRandomId(), header: "Header to test message",
        });
    }

    private test2 = () => {
        this.props.appState.uiStore.addMessage({
            warning: true, content: "Im gonna dissapear in 5 seconds " + getRandomId(),
            header: "Header to test message", timeout: 5000,
        });
    }

    private test3 = () => {
        this.props.appState.uiStore.addMessage({
            color: "brown", content: <div className="ui segment">I Have crazy content!</div>,
            header: "Header to test message", timeout: 5000,
        });
    }
}

export default injectState(MessageTest);
