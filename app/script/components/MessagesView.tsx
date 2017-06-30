import {observer} from "mobx-react";
import * as React from "react";
import {CSSTransitionGroup} from "react-transition-group";
import {Message} from "semantic-ui-react";
import {Message as UiMessage, UiStore} from "../ui";

@observer
export default class MessagesView extends React.PureComponent<{ uiStore: UiStore }, {}> {
    render() {
        return <div className="messages">
            <CSSTransitionGroup transitionName="message" transitionAppear={true} transitionAppearTimeout={500}
                                transitionEnterTimeout={500} transitionLeaveTimeout={500}>
                {this.props.uiStore.messages.map(this.renderMessage)}
            </CSSTransitionGroup>
        </div>;
    }

    private renderMessage = (message: UiMessage, index: number) => {
        const {header, content, type} = message;
        return <Message key={message.id} className="message"
                        header={header} content={content}
                        success={type === UiMessage.Type.Success}
                        info={type === UiMessage.Type.Info} warning={type === UiMessage.Type.Warning}
                        error={type === UiMessage.Type.Error} onDismiss={() => this.dismiss(index)}/>;
    }

    private dismiss(index: number) {
        this.props.uiStore.messages.splice(index, 1);
    }
}
