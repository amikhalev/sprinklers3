import * as History from "history";
import * as React from "react";
import { Link } from "react-router-dom";
import { Menu } from "semantic-ui-react";

import { AppState, injectState } from "@app/state";
import { observer } from "mobx-react";

interface NavItemProps {
    to: string;
    children: React.ReactNode;
    location: History.Location;
}

@observer
function NavItem({ to, children, location }: NavItemProps) {
    return <Menu.Item as={Link} to={to} active={location.pathname.startsWith(to)}>{children}</Menu.Item>;
}

function NavBar({ appState }: { appState: AppState }) {
    let loginMenu;
    if (appState.isLoggedIn) {
        loginMenu = (
            <NavItem to="/logout">Logout</NavItem>
        );
    } else {
        loginMenu = (
            <NavItem to="/login">Login</NavItem>
        );
    }
    return (
        <Menu>
            <NavItem to="/devices/grinklers">Device grinklers</NavItem>
            <NavItem to="/messagesTest">Messages test</NavItem>
            <Menu.Menu position="right">
                {loginMenu}
            </Menu.Menu>
        </Menu>
    );
}

export default observer(injectState(NavBar));
