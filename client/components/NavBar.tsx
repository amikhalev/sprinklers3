import { observer } from "mobx-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { Menu } from "semantic-ui-react";

import * as route from "@client/routePaths";
import { AppState, ConsumeState, injectState } from "@client/state";

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
            <NavItem to={route.logout}>Logout</NavItem>
        );
    } else {
        loginMenu = (
            <NavItem to={route.login}>Login</NavItem>
        );
    }
    return (
        <Menu>
            <NavItem to={route.device()}>Devices</NavItem>
            <NavItem to={route.messagesTest}>Messages test</NavItem>
            <Menu.Menu position="right">
                {loginMenu}
            </Menu.Menu>
        </Menu>
    );
}

export default observer(injectState(NavBar));
