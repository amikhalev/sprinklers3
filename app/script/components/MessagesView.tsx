import * as React from "react";
import {observer} from "mobx-react";
import {UiStore, Message as UiMessage} from "../ui";
import {Message} from "semantic-ui-react";

@observer
export default class MessagesView extends React.PureComponent<{ uiStore: UiStore }, {}> {
    render() {
        return <div>
            {this.props.uiStore.messages.map(this.renderMessage)}
        </div>;
    }

    private renderMessage = (message: UiMessage, index: number) => {
        const {header, content, type} = message;
        return <Message header={header} content={content} success={type === UiMessage.Type.Success}
                        info={type === UiMessage.Type.Info} warning={type === UiMessage.Type.Warning}
                        error={type === UiMessage.Type.Error} onDismiss={() => this.dismiss(index)}/>;
    }

    private dismiss(index: number) {
        this.props.uiStore.messages.splice(index, 1);
    }
}
