// import DevTools from "mobx-react-devtools";
import * as React from "react";
import { Redirect, Route, Switch } from "react-router";
import { Container } from "semantic-ui-react";

import { MessagesView, NavBar } from "@app/components";
import * as p from "@app/pages";
import * as rp from "@app/routePaths";

// tslint:disable:ordered-imports
import "font-awesome/css/font-awesome.css";
import "semantic-ui-css/semantic.css";
import "@app/styles/app.scss";

function NavContainer() {
    return (
        <Container className="app">
            <NavBar/>

            <Switch>
                <Route path={rp.program(":deviceId", ":programId")} component={p.ProgramPage}/>
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
