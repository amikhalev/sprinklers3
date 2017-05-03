import * as React from "react";
import { observer } from "mobx-react";
import { SprinklersDevice } from "./sprinklers";
import "semantic-ui-css/semantic.min.css";
import "app/style/app.css";
import { Item } from "semantic-ui-react";
import * as classNames from "classnames";

@observer
class Device extends React.Component<{ device: SprinklersDevice }, any> {
    render() {
        const {id, connected} = this.props.device;
        return (
            <Item>
                <Item.Image src={require("app/images/raspberry_pi.png")} />
                <Item.Content>
                    <Item.Header>
                        <span>Device </span><kbd>{id}</kbd>
                    </Item.Header>
                    <Item.Meta>
                        <span className={classNames({
                            "device--connected": connected,
                            "device--disconnected": !connected
                        })}>
                            {connected ? "Connected" : "Disconnected"}
                        </span>
                    </Item.Meta>
                </Item.Content>
            </Item>
        );
    }
}

@observer
export default class App extends React.Component<{ device: SprinklersDevice }, any> {
    render() {
        return <Item.Group divided><Device device={this.props.device} /></Item.Group>
    }
}