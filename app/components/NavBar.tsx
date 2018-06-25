import { Location } from "history";
import * as React from "react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { Menu } from "semantic-ui-react";

interface NavItemProps {
    to: string;
    children: React.ReactNode;
}

function NavItem({ to, children }: NavItemProps) {
    return <Menu.Item as={Link} to={to} active={location.pathname.startsWith(to)}>{children}</Menu.Item>;
}

function NavBar({ location }: { location: Location }) {
    return (
        <Menu>
            <NavItem to="/devices/grinklers">Device grinklers</NavItem>
            <NavItem to="/messagesTest">Messages test</NavItem>
        </Menu>
    );
}

export default withRouter(NavBar);
