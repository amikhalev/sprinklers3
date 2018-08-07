// import DevTools from "mobx-react-devtools";
import * as React from "react";
import { Redirect, Route, Switch } from "react-router";
import { Container } from "semantic-ui-react";

import { MessagesView, NavBar } from "@client/components";
import * as p from "@client/pages";
import * as rp from "@client/routePaths";

// tslint:disable:ordered-imports
import "font-awesome/css/font-awesome.css";
import "semantic-ui-css/semantic.css";
import "@client/styles/app";

function NavContainer() {
    return (
        <Container className="app">
            <NavBar/>

            <Switch>
                <Route path={rp.device(":deviceId")} component={p.DevicePage}/>
                <Route path={rp.messagesTest} component={p.MessagesTestPage}/>
                <Redirect to="/"/>
            </Switch>

            <MessagesView/>
        </Container>
    );
}

export default function App() {
    return (
        <Switch>
            <Route path={rp.login} component={p.LoginPage}/>
            <Route path={rp.logout} component={p.LogoutPage}/>
            <NavContainer/>
        </Switch>
    );
}
