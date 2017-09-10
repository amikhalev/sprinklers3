import { observer } from "mobx-react";
import * as React from "react";
import { Message, MessageProps, TransitionGroup } from "semantic-ui-react";

import { injectState, State, UiMessage, UiStore } from "@app/state/";

@observer
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

    private dismiss: MessageProps["onDismiss"] = (event, data) => {
        const { uiStore, index } = this.props;
        uiStore.messages.splice(index, 1);
        if (this.props.message.onDismiss) {
            this.props.message.onDismiss(event, data);
        }
    }
}

class MessagesView extends React.Component<{ state: State }> {
    render() {
        const { uiStore } = this.props.state;
        const messages = uiStore.messages.map((message, index) => (
            <MessageView key={message.id} uiStore={uiStore} message={message} index={index} />
        ));
        return (
            <div className="messages" >
                <TransitionGroup animation="scale" duration={200}>
                    {messages}
                </TransitionGroup>
            </div>
        );
    }
}

export default injectState(observer(MessagesView));
