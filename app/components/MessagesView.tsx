import * as classNames from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import { Message, MessageProps, TransitionGroup } from "semantic-ui-react";

import { AppState, injectState, UiMessage, UiStore } from "@app/state/";

import "@app/styles/MessagesView";

@observer
class MessageView extends React.Component<{
    uiStore: UiStore,
    message: UiMessage,
    className?: string,
}> {

    render() {
        const { id, ...messageProps } = this.props.message;
        const className = classNames(messageProps.className, this.props.className);
        return (
            <Message
                {...messageProps}
                className={className}
                onDismiss={this.dismiss}
            />
        );
    }

    private dismiss: MessageProps["onDismiss"] = (event, data) => {
        const { uiStore, message } = this.props;
        if (message.onDismiss) {
            message.onDismiss(event, data);
        }
        uiStore.messages.remove(message);
    }
}

class MessagesView extends React.Component<{ appState: AppState }> {
    render() {
        const { uiStore } = this.props.appState;
        const messages = uiStore.messages.map((message) => (
            <MessageView key={message.id} uiStore={uiStore} message={message} />
        ));
        messages.reverse();
        return (
            <TransitionGroup as={Message.List} className="messages" animation="scale" duration={200}>
                {messages}
            </TransitionGroup>
        );
    }
}

export default injectState(observer(MessagesView));
