import {observable} from "mobx";

import { getRandomId } from "common/utils";

export class Message {
    id: string;
    header: string = "";
    content: string = "";
    type: Message.Type = Message.Type.Default;

    constructor(header: string, content: string = "", type: Message.Type = Message.Type.Default) {
        this.id = "" + getRandomId();
        this.header = header;
        this.content = content;
        this.type = type;
    }
}

export namespace Message {
    export enum Type {
        Default, Success, Info, Warning, Error,
    }
}

export class UiStore {
    @observable
    messages: Message[] = [];

    addMessage(message: Message) {
        this.messages.push(message);
    }
}
