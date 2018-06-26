import { observer } from "mobx-react";
// import DevTools from "mobx-react-devtools";
import * as React from "react";
import { Redirect, Route, Switch } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import { Container } from "semantic-ui-react";

import { DevicesView, MessagesView, MessageTest, NavBar } from "@app/components";

// tslint:disable:ordered-imports
import "font-awesome/css/font-awesome.css";
import "semantic-ui-css/semantic.css";
import "@app/styles/app.scss";

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
                    <NavBar/>

                    <Switch>
                        <Route path="/devices/grinklers" component={DevicePage}/>
                        <Route path="/messagesTest" component={MessagesTestPage}/>
                        <Redirect to="/"/>
                    </Switch>

                    <MessagesView/>
                </Container>
            </Router>
        );
    }
}

export default observer(App);
