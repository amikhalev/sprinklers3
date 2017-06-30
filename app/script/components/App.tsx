import "app/style/app.css";
import "font-awesome/css/font-awesome.css";
import {observer} from "mobx-react";
import DevTools from "mobx-react-devtools";
import * as React from "react";

import "semantic-ui-css/semantic.css";
import {Item} from "semantic-ui-react";
import {DeviceView, MessagesView} from ".";
import {SprinklersDevice} from "../sprinklers";
import {UiStore} from "../ui";

@observer
export default class App extends React.PureComponent<{ device: SprinklersDevice, uiStore: UiStore }, any> {
    render() {
        return <Item.Group divided>
            <MessagesView uiStore={this.props.uiStore}/>
            <DeviceView device={this.props.device}/>
            <DevTools/>
        </Item.Group>;
    }
}
