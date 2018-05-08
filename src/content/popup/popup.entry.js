import 'semantic-ui-css/semantic.min.css';
import './popup.css';

import React from 'react';
import ReactDOM from 'react-dom';

import browser from 'webextension-polyfill';

import { firebase } from '../../import/config/firebase-config';
import user from '../../import/user';
import LoggedIn from './logged-in';
import { AuthComponent } from '../../import/config/firebaseui-config';

import { Button, Loader, Container, Header, Icon, Segment, Message, Divider, Image } from 'semantic-ui-react';

class App extends React.Component {
    constructor(props) {
        super(props);

        var instance = this;

        this.state = {
            loading: true,
            message: null
        }

        this.message = this.message.bind(this);

        firebase.auth().onAuthStateChanged(function (user) {
            instance.setState({ loading: false });
        });
    }

    message(content, type, timeout) {
        var duration = 2000;
        if(timeout) duration = timeout;
        this.setState({
            message: {
                content: content,
                type: type
            }
        });
        setTimeout(() => {
            // only timeout message if it has not been overwritten
            if(this.state.message && this.state.message.content == content) {
                this.setState({message: null});
            }
        }, duration);
    }

    login(interactive) {
        this.setState({ loading: true });
        user.login(true).then(() => {
            this.setState({ loading: false });
            this.message('Logged in', 'success');
        }).catch((err) => {
            this.setState({ loading: false });
            this.message(err.message, 'error', 5000);
        });
    }

    render() {
        var content;

        if (firebase.auth().currentUser) {
            content = (
                <LoggedIn user={firebase.auth().currentUser} message={this.message} />
            );
        } else {
            content = (
                <div>
                    <Header as='h2' className='loginHeader'>
                        <Icon name='address card outline' />
                        <Header.Content>
                            {browser.i18n.getMessage('login')}
                            <Header.Subheader>
                                {browser.i18n.getMessage('login_question')}
                            </Header.Subheader>
                        </Header.Content>
                    </Header>
                    <center><a href="https://vsync.ch/migrate/" target="_blank"><Header as='h3' color='blue' content='Where did my account go?' /></a></center>
                    <Segment padded>
                        <Button loading={this.state.loading} onClick={() => { this.login(true) }} content={browser.i18n.getMessage('login_google')} color='google plus' icon='google plus' labelPosition='left' fluid />
                        <Divider horizontal>Or</Divider>
                        <AuthComponent />
                    </Segment>
                    
                </div>
            );
        }

        return (
            <div style={{ display:"flex", minHeight:"100vh", flexDirection:"column" }}>
                <div style={{flex:1}}>
                    <Container fluid className='page-container'>
                        {content}
                    </Container>
                </div>
                <InfoMessage message={this.state.message} />
                <Segment compact attached className='page-footer' color='grey'>
                    <Header as='h4' color='black'>
                        <Image src='/content/images/logo.svg' verticalAlign='middle' />
                        {' '+browser.i18n.getMessage('app_name')}
                    </Header>
                </Segment>
            </div>
        );
    }
}

const InfoMessage = ({message}) => {

    if(message == null) {
        return null;
    }

    var icon = 'info';
    if(message.type == 'success') icon = 'checkmark';
    if(message.type == 'warn') icon = 'warning sign';
    if(message.type == 'error') icon = 'ban';

    return (
        <Message attached='top' success={message.type == 'success'} warning={message.type == 'warn'} error={message.type == 'error'} icon>
            <Icon name={icon} />
            <Message.Header content={message.content} />
        </Message>
    );
}

// ========================================

ReactDOM.render(
    <App />,
    document.getElementById('root')
)