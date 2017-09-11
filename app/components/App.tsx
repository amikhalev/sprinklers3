import { observer } from "mobx-react";
import DevTools from "mobx-react-devtools";
import * as React from "react";

import { DevicesView, MessagesView } from "@app/components";

import "@app/styles/app.css";
import "font-awesome/css/font-awesome.css";
import "semantic-ui-css/semantic.css";

class App extends React.Component {
    render() {
        return (
            <div>
                <MessagesView />
                <DevicesView />
                <DevTools />
            </div>
        );
    }
}

export default observer(App);
