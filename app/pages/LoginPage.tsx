import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { Container, Dimmer, Form, Header, InputOnChangeData, Loader, Message, Segment } from "semantic-ui-react";

import { AppState, injectState } from "@app/state";
import log from "@common/logger";

class LoginPageState {
    @observable username = "";
    @observable password = "";

    @observable loading: boolean = false;
    @observable error: string | null = null;

    @computed get canLogin() {
        return this.username.length > 0 && this.password.length > 0;
    }

    onUsernameChange = (e: any, data: InputOnChangeData) => {
        this.username = data.value;
    }

    onPasswordChange = (e: any, data: InputOnChangeData) => {
        this.password = data.value;
    }

    login(appState: AppState) {
        this.loading = true;
        this.error = null;
        appState.tokenStore.grantPassword(this.username, this.password)
            .then(() => {
                this.loading = false;
                log.info("logged in");
                appState.history.push("/");
            })
            .catch((err) => {
                this.loading = false;
                this.error = err.message;
                log.error({ err }, "login error");
            });
    }
}

class LoginPage extends React.Component<{ appState: AppState }> {
    pageState = new LoginPageState();

    render() {
        const { username, password, canLogin, loading, error } = this.pageState;
        return (
            <Container className="loginPage">
                <Segment>
                    <Dimmer inverted active={loading}>
                        <Loader/>
                    </Dimmer>

                    <Header as="h1">Login</Header>
                    <Form>
                        <Form.Input label="Username" value={username} onChange={this.pageState.onUsernameChange}/>
                        <Form.Input
                            label="Password"
                            value={password}
                            type="password"
                            onChange={this.pageState.onPasswordChange}
                        />
                        <Message error visible={error != null}>{error}</Message>
                        <Form.Button disabled={!canLogin} onClick={this.login}>Login</Form.Button>
                    </Form>
                </Segment>
            </Container>
        );
    }

    login = () => {
        this.pageState.login(this.props.appState);
    }
}

const DecoratedLoginPage = injectState(observer(LoginPage));
export { DecoratedLoginPage as LoginPage };
