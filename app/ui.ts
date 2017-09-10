import { IObservableArray, observable } from "mobx";
import { MessageProps } from "semantic-ui-react";

import { getRandomId } from "@common/utils";

export interface Message extends MessageProps {
    id: number;
}

export class UiStore {
    @observable
    messages: IObservableArray<Message> = observable.array();

    addMessage(message: MessageProps) {
        this.messages.push(observable({
            ...message,
            id: getRandomId(),
        }));
    }
}
