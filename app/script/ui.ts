import {observable} from "mobx";

export class Message {
    public id: string;
    public header: string = "";
    public content: string = "";
    public type: Message.Type = Message.Type.Default;

    constructor(header: string, content: string = "", type: Message.Type = Message.Type.Default) {
        this.id = "" + Math.floor(Math.random() * 1000000000);
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
    public messages: Message[] = [];

    public addMessage(message: Message) {
        this.messages.push(message);
    }
}
