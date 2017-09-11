import { observer } from "mobx-react";
import DevTools from "mobx-react-devtools";
import * as React from "react";
import { Container } from "semantic-ui-react";

import { DevicesView, MessagesView } from "@app/components";
import MessageTest from "@app/components/MessageTest";

import "@app/styles/app.css";
import "font-awesome/css/font-awesome.css";
import "semantic-ui-css/semantic.css";

class App extends React.Component {
    render() {
        return (
            <Container>
                <MessageTest />
                <DevicesView />
                <MessagesView />
                <DevTools />
            </Container>
        );
    }
}

export default observer(App);
