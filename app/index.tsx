import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import { Router } from "react-router-dom";

import App from "@app/components/App";
import { AppState, ProvideState } from "@app/state";
import logger from "@common/logger";

const state = new AppState();
state.start()
    .catch((err: any) => {
        logger.error({ err }, "error starting state");
    });

const rootElem = document.getElementById("app");

const doRender = (Component: React.ComponentType) => {
    ReactDOM.render((
        <AppContainer>
            <ProvideState state={state}>
                <Router history={state.history}>
                    <Component/>
                </Router>
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
