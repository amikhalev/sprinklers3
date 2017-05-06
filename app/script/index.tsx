import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";

import App from "./App";
import { MqttApiClient } from "./mqtt";

const client = new MqttApiClient();
client.start();
const device = client.getDevice("grinklers");

const rootElem = document.getElementById("app");

ReactDOM.render(<AppContainer>
    <App device={device} />
</AppContainer>, rootElem);

if (module.hot) {
    module.hot.accept("./App", () => {
        const NextApp = require<any>("./App").default;
        ReactDOM.render(<AppContainer>
            <NextApp device={device} />
        </AppContainer>, rootElem);
    });
}
