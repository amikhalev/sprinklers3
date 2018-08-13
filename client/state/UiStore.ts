import { action, IObservableArray, observable } from "mobx";
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

    @action
    addMessage(message: UiMessageProps): UiMessage {
        const { timeout, ...otherProps } = message;
        const msg = observable({
            ...otherProps,
            id: getRandomId(),
        });
        this.messages.push(msg);
        if (timeout) {
            setTimeout(() => {
                this.removeMessage(msg);
            }, timeout);
        }
        return msg;
    }

    @action
    removeMessage(message: UiMessage) {
        return this.messages.remove(message);
    }
}
