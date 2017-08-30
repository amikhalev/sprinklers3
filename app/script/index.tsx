import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";

import App from "./components/App";
import { MqttApiClient } from "./mqtt";
import { Message, UiStore } from "./ui";

const client = new MqttApiClient();
client.start();
const device = client.getDevice("grinklers");
const uiStore = new UiStore();
uiStore.addMessage(new Message("asdf", "boo!", Message.Type.Error));

const rootElem = document.getElementById("app");

const doRender = (Component: typeof App) => {
    ReactDOM.render((
        <AppContainer>
            <Component device={device} uiStore={uiStore} />
        </AppContainer>
    ), rootElem);
};

doRender(App);

if (module.hot) {
    module.hot.accept("./components/App", () => {
        const NextApp = require<any>("./components/App").default as typeof App;
        doRender(NextApp);
    });
}
