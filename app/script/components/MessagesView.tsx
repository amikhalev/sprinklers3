import { observer } from "mobx-react";
import * as React from "react";
import { Message, MessageList, TransitionGroup } from "semantic-ui-react";

import { Message as UiMessage, UiStore } from "app/ui";

class MessageView extends React.Component<{
    uiStore: UiStore,
    message: UiMessage,
    index: number,
}> {

    render() {
        const { id, header, content, type } = this.props.message;
        return (
            <Message
                header={header}
                content={content}
                success={type === UiMessage.Type.Success}
                info={type === UiMessage.Type.Info}
                warning={type === UiMessage.Type.Warning}
                error={type === UiMessage.Type.Error}
                onDismiss={this.dismiss}
            />
        );
    }

    private dismiss = () => {
        const { uiStore, index } = this.props;
        uiStore.messages.splice(index, 1);
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
