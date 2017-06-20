import * as React from "react";
import DevTools from "mobx-react-devtools";
import {observer} from "mobx-react";
import {SprinklersDevice} from "../sprinklers";
import {Item} from "semantic-ui-react";
import {UiStore} from "../ui";
import {MessagesView, DeviceView} from ".";

import "semantic-ui-css/semantic.css";
import "font-awesome/css/font-awesome.css";
import "app/style/app.css";

@observer
export default class App extends React.PureComponent<{ device: SprinklersDevice, uiStore: UiStore }, any> {
    render() {
        return <Item.Group divided>
            <MessagesView uiStore={this.props.uiStore}/>
            <DeviceView device={this.props.device}/>
            <DevTools />
        </Item.Group>;
    }
}
