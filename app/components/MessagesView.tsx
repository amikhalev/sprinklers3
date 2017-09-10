import { observer } from "mobx-react";
import * as React from "react";
import { Message, MessageProps, TransitionGroup } from "semantic-ui-react";

import { Message as UiMessage, UiStore } from "@app/ui";

class MessageView extends React.Component<{
    uiStore: UiStore,
    message: UiMessage,
    index: number,
}> {

    render() {
        const { id, ...messageProps } = this.props.message;
        return (
            <Message
                {...messageProps}
                onDismiss={this.dismiss}
            />
        );
    }

    private dismiss = (event: React.MouseEvent<HTMLElement>, data: MessageProps) => {
        const { uiStore, index } = this.props;
        uiStore.messages.splice(index, 1);
        if (this.props.message.onDismiss) {
            this.props.message.onDismiss(event, data);
        }
    }
}

@observer
export default class MessagesView extends React.Component<{ uiStore: UiStore }> {
    render() {
        const messages = this.props.uiStore.messages.map((message, index) => (
            <MessageView key={message.id} uiStore={this.props.uiStore} message={message} index={index} />
        ));
        return (
            <div className="messages" >
            <TransitionGroup  animation="scale" duration={200}>
                {messages}
            </TransitionGroup>
            </div>
        );
    }
}
