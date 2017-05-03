import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./App";
import {MqttApiClient} from "./mqtt";

const client = new MqttApiClient();
client.start();
const device = client.getDevice("grinklers");

const container = document.createElement("div");
document.body.appendChild(container);

ReactDOM.render(<App device={device} />, container);