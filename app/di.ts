import * as PropTypes from "prop-types";
import * as React from "react";

export class Provider<T extends {}> extends React.Component<T> {
    static childContextTypes = {
        injected: any,
    };
}

export function inject<P, T extends React.ComponentType<P>>(...names: string[]): (base: T) => React.ComponentClass<T> {
    return (Component) => {
        return class extends React.Component<T> {

        };
    };
}
