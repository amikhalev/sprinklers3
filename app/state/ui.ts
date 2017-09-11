import { IObservableArray, observable } from "mobx";
import { MessageProps } from "semantic-ui-react";

import { getRandomId } from "@common/utils";

export interface UiMessage extends MessageProps {
    id: number;
}

export interface UiMessageProps extends MessageProps {
    timeout?: number;
}

export class UiStore {
    messages: IObservableArray<UiMessage> = observable.array();

    addMessage(message: UiMessageProps) {
        const { timeout, ...otherProps } = message;
        const msg = observable({
            ...otherProps,
            id: getRandomId(),
        });
        this.messages.push(msg);
        if (timeout) {
            setTimeout(() => this.messages.remove(msg), timeout);
        }
    }
}
