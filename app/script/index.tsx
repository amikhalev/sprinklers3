import * as React from "react";
import * as ReactDOM from "react-dom";
import {AppContainer} from "react-hot-loader";

import App from "./components/App";
import {MqttApiClient} from "./mqtt";
import {Message, UiStore} from "./ui";

const client = new MqttApiClient();
client.start();
const device = client.getDevice("grinklers");
const uiStore = new UiStore();
uiStore.addMessage(new Message("asdf", "boo!", Message.Type.Error));

const rootElem = document.getElementById("app");

ReactDOM.render(<AppContainer>
    <App device={device} uiStore={uiStore}/>
</AppContainer>, rootElem);

if (module.hot) {
    module.hot.accept("./components/App", () => {
        const NextApp = require<any>("./components/App").default as typeof App;
        ReactDOM.render(<AppContainer>
            <NextApp device={device} uiStore={uiStore}/>
        </AppContainer>, rootElem);
    });
}
