import * as React from "react";

import { StateBase } from "@app/state";

const StateContext = React.createContext<StateBase | null>(null);

export interface ProvideStateProps {
    state: StateBase;
    children: React.ReactNode;
}

export function ProvideState({state, children}: ProvideStateProps) {
    return (
        <StateContext.Provider value={state}>
            {children}
        </StateContext.Provider>
    );
}

export interface ConsumeStateProps {
    children: (state: StateBase) => React.ReactNode;
}

export function ConsumeState({children}: ConsumeStateProps) {
    const consumeState = (state: StateBase | null) => {
        if (state == null) {
            throw new Error("Component with ConsumeState must be mounted inside ProvideState");
        }
        return children(state);
    };
    return <StateContext.Consumer>{consumeState}</StateContext.Consumer>;
}

type Diff<T extends string | number | symbol, U extends string | number | symbol> =
    ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T];
type Omit<T, K extends keyof T> = {[P in Diff<keyof T, K>]: T[P]};

export function injectState<P extends { state: StateBase }>(Component: React.ComponentType<P>) {
    return class extends React.Component<Omit<P, "state">> {
        render() {
            const consumeState = (state: StateBase | null) => {
                if (state == null) {
                    throw new Error("Component with injectState must be mounted inside ProvideState");
                }
                return <Component {...this.props} state={state}/>;
            };
            return <StateContext.Consumer>{consumeState}</StateContext.Consumer>;
        }
    };
}
