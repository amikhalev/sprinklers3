import * as React from "react";

import { AppState } from "@client/state";

const StateContext = React.createContext<AppState | null>(null);

export interface ProvideStateProps {
  state: AppState;
  children: React.ReactNode;
}

export function ProvideState({ state, children }: ProvideStateProps) {
  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}

export interface ConsumeStateProps {
  children: (state: AppState) => React.ReactNode;
}

export function ConsumeState({ children }: ConsumeStateProps) {
  const consumeState = (state: AppState | null) => {
    if (state == null) {
      throw new Error(
        "Component with ConsumeState must be mounted inside ProvideState"
      );
    }
    return children(state);
  };
  return <StateContext.Consumer>{consumeState}</StateContext.Consumer>;
}

type Diff<
  T extends string | number | symbol,
  U extends string | number | symbol
> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
type Omit<T, K extends keyof T> = { [P in Diff<keyof T, K>]: T[P] };

export function injectState<P extends { appState: AppState }>(
  Component: React.ComponentType<P>
): React.ComponentClass<Omit<P, "appState">> {
  return class extends React.Component<Omit<P, "appState">> {
    render() {
      const consumeState = (state: AppState | null) => {
        if (state == null) {
          throw new Error(
            "Component with injectState must be mounted inside ProvideState"
          );
        }
        return <Component {...this.props} appState={state} />;
      };
      return <StateContext.Consumer>{consumeState}</StateContext.Consumer>;
    }
  };
}
