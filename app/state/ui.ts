import { IObservableArray, observable } from "mobx";
import { MessageProps } from "semantic-ui-react";

import { getRandomId } from "@common/utils";

export interface UiMessage extends MessageProps {
    id: number;
}

export class UiStore {
    messages: IObservableArray<UiMessage> = observable.array();

    addMessage(message: MessageProps) {
        this.messages.push(observable({
            ...message,
            id: getRandomId(),
        }));
    }
}
