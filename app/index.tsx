import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";

import App from "@app/components/App";
import { ProvideState, StateBase, WebApiState as StateClass } from "@app/state";
import logger from "@common/logger";

const state: StateBase = new StateClass();
state.start()
    .catch((err) => {
        logger.error({err}, "error starting state");
    });

const rootElem = document.getElementById("app");

const doRender = (Component: React.ComponentType) => {
    ReactDOM.render((
        <AppContainer>
            <ProvideState state={state}>
                <Component />
            </ProvideState>
        </AppContainer>
    ), rootElem);
};

doRender(App);

if (module.hot) {
    module.hot.accept("@app/components/App", () => {
        const NextApp = require<any>("@app/components/App").default as typeof App;
        doRender(NextApp);
    });
}
