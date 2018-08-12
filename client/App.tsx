// import DevTools from "mobx-react-devtools";
import * as React from "react";
import { Redirect, Route, Switch } from "react-router";
import { Container } from "semantic-ui-react";

import { MessagesView, NavBar } from "@client/components";
import * as p from "@client/pages";
import * as route from "@client/routePaths";

// tslint:disable:ordered-imports
import "font-awesome/css/font-awesome.css";
import "semantic-ui-css/semantic.css";
import "@client/styles/app";

function NavContainer() {
    return (
        <Container className="app">
            <NavBar/>

            <Switch>
                <Route path={route.device(":deviceId")} component={p.DevicePage}/>
                <Route path={route.device()} component={p.DevicesPage}/>
                <Route path={route.messagesTest} component={p.MessageTest}/>
                <Redirect from="/" to={route.device()} />
                <Redirect to="/"/>
            </Switch>

            <MessagesView/>
        </Container>
    );
}

export default function App() {
    return (
        <Switch>
            <Route path={route.login} component={p.LoginPage}/>
            <Route path={route.logout} component={p.LogoutPage}/>
            <NavContainer/>
        </Switch>
    );
}
