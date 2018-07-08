import * as React from "react";
import { Link } from "react-router-dom";
import { Menu } from "semantic-ui-react";

import { AppState, ConsumeState, injectState } from "@app/state";
import { observer } from "mobx-react";

interface NavItemProps {
    to: string;
    children: React.ReactNode;
}

const NavItem = observer(({ to, children }: NavItemProps) => {
    function consumeState(appState: AppState) {
        const { location } = appState.routerStore;
        return (
            <Menu.Item as={Link} to={to} active={location.pathname.startsWith(to)}>{children}</Menu.Item>
        );
    }

    return (<ConsumeState>{consumeState}</ConsumeState>);
});

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
