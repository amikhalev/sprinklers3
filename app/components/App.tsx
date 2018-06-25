import { observer } from "mobx-react";
// import DevTools from "mobx-react-devtools";
import * as React from "react";
import { Redirect, Route } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import { Container } from "semantic-ui-react";

import { DevicesView, MessagesView, MessageTest, NavBar } from "@app/components";

import "@app/styles/app.css";
import "font-awesome/css/font-awesome.css";
import "semantic-ui-css/semantic.css";

function DevicePage() {
    return (
        <DevicesView/>
    );
}

function MessagesTestPage() {
    return (
        <MessageTest/>
    );
}

class App extends React.Component {
    render() {
        return (
            <Router>
                <Container className="app">
                    <NavBar />

                    <Route path="/devices/grinklers" component={DevicePage}/>
                    <Route path="/messagesTest" component={MessagesTestPage}/>
                    <Redirect to="/"/>

                    <MessagesView/>
                </Container>
            </Router>
        );
    }
}

export default observer(App);
