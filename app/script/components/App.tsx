import { observer } from "mobx-react";
import DevTools from "mobx-react-devtools";
import * as React from "react";

import { Item } from "semantic-ui-react";
import { DeviceView, MessagesView } from ".";
import { SprinklersDevice } from "../sprinklers";
import { UiStore } from "../ui";

import "app/style/app.css";
import "font-awesome/css/font-awesome.css";
import "semantic-ui-css/semantic.css";

@observer
export default class App extends React.Component<{ device: SprinklersDevice, uiStore: UiStore }> {
    render() {
        return (
            <Item.Group divided>
                <MessagesView uiStore={this.props.uiStore} />
                <DeviceView device={this.props.device} />
                <DevTools />
            </Item.Group>
        );
    }
}
