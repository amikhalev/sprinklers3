import * as PropTypes from "prop-types";
import * as React from "react";

import { State } from "@app/state";

interface IProvidedStateContext {
    providedState: State;
}

const providedStateContextTypes: PropTypes.ValidationMap<any> = {
    providedState: PropTypes.object,
};

export class ProvideState extends React.Component<{
    state: State,
}> implements React.ChildContextProvider<IProvidedStateContext> {
    static childContextTypes = providedStateContextTypes;

    getChildContext(): IProvidedStateContext {
        return {
            providedState: this.props.state,
        };
    }

    render() {
        return React.Children.only(this.props.children);
    }
}

type Diff<T extends string, U extends string> = ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T];
type Omit<T, K extends keyof T> = {[P in Diff<keyof T, K>]: T[P]};

export function injectState<P extends { "state": State }, T extends React.ComponentClass<P>>(Component: T) {
    return class extends React.Component<Omit<P, "state">> {
        static contextTypes = providedStateContextTypes;
        context: IProvidedStateContext;

        render() {
            const state = this.context.providedState;
            return <Component {...this.props} state={state} />;
        }
    };
}
