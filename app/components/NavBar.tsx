import { observer } from "mobx-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { Menu } from "semantic-ui-react";

import * as rp from "@app/routePaths";
import { AppState, ConsumeState, injectState } from "@app/state";

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
            <NavItem to={rp.logout}>Logout</NavItem>
        );
    } else {
        loginMenu = (
            <NavItem to={rp.login}>Login</NavItem>
        );
    }
    return (
        <Menu>
            <NavItem to={rp.device("grinklers")}>Device grinklers</NavItem>
            <NavItem to={rp.messagesTest}>Messages test</NavItem>
            <Menu.Menu position="right">
                {loginMenu}
            </Menu.Menu>
        </Menu>
    );
}

export default observer(injectState(NavBar));
