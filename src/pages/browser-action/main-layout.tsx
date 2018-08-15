import * as React from 'react';

import { AppBar, Toolbar, Typography, BottomNavigation, BottomNavigationAction, Button, CircularProgress, Avatar } from '@material-ui/core';
import { red, deepPurple } from '@material-ui/core/colors';

import {
    SettingsApplications as SettingsApplicationsIcon,
    HomeRounded as HomeIcon,
    Info as InfoIcon

} from '@material-ui/icons'

import { withTheme, Theme } from '@material-ui/core/styles';

import { ProfileTab } from './profiles/profile-tab';
import { TutorialTab } from './tutorials/tutorial-tab';
import { SettingsTab } from './settings/settings-tab';
import { AuthCore } from 'auth/wulf-auth';
import { SignIn } from './signin/sign-in';
import { UserState } from '../_redux/users/types';
import { connect } from 'react-redux';
import { ApplicationState, HasRouter, HasDispatch, mapDispatch } from '../_redux';
import { Switch, Route } from 'react-router';
import { ThemeState } from '../_redux/themes/types';
import { replace } from 'connected-react-router';

export type MainLayoutProps = {
    user: UserState
    theme: ThemeState
} & HasRouter

class MainLayoutBase extends React.Component<MainLayoutProps & HasDispatch, {}> {
    constructor(props) {
        super(props);
    }

    getBottomNavigationValue() {
        const initialPathname = this.props.router.location.pathname.split('/')[1];
        if(initialPathname === 'info') {
            return 'info';
        } else if(initialPathname === 'settings') {
            return 'settings';
        } else {
            return '';
        }
    }

    render() {
        if(this.props.user.loading) {
            return <div style={{display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: this.props.theme.theme.palette.background.default}}><CircularProgress variant='indeterminate' color='primary' /></div>
        }

        return (
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch', justifyContent: 'center'}}>

                {/* Header */}
                <div style={{flexBasis: 'content'}}>
                    <AppBar position='sticky' color='primary'>
                        <Toolbar variant='dense' color='inherit'>
                            <Typography variant='title' color='inherit' style={{flexGrow: 1}}>
                                VSync - {this.props.router.location.pathname}
                            </Typography>
                            {
                                this.props.user.user && 
                                    <Typography variant='subheading' color='inherit' style={{paddingLeft: '5px', paddingRight: '5px'}}>
                                        {this.props.user.user.displayName.charAt(0).toUpperCase() + this.props.user.user.displayName.substring(1)}
                                    </Typography>
                            }
                            {
                                this.props.user.user && 
                                    <Avatar alt={this.props.user.user.displayName} src={this.props.user.user.photoURL} style={{width: 30, height: 30, marginRight: '10px'}}/>
                            }
                            {
                                this.props.user.user ?
                                    <Button style={{backgroundColor: red[900], color: '#FFF'}} variant='contained' onClick={AuthCore.logout}>Sign out</Button>
                                :
                                    <Button style={{backgroundColor: deepPurple[500], color: '#FFF'}} variant='contained' onClick={AuthCore.login}>Sign in</Button>
                            }
                        </Toolbar>
                    </AppBar>
                </div>

                {/* Content */}
                <Typography variant='body1' component='div' className='has-scrollbars' style={{display: 'flex', flexGrow: 1, overflow: 'auto', backgroundColor: this.props.theme.theme.palette.background.default}}>
                    <Switch>
                        <Route path='/info' component={TutorialTab} />
                        <Route path='/settings' component={SettingsTab} />
                        <Route path='/' render={() => {return this.props.user.user ? <ProfileTab /> : <SignIn />}} />
                    </Switch>
                </Typography>

                {/* Footer */}
                <div style={{flexBasis: 'content'}}>
                    <BottomNavigation
                        showLabels
                        value={this.getBottomNavigationValue()}
                        onChange={(event, value) => {
                            this.props.dispatch(replace(`/${value}`));
                        }}
                    >
                        <BottomNavigationAction label='Profiles' icon={<HomeIcon />} value='' />
                        {/* <BottomNavigationAction label='Tutorial' icon={<InfoIcon />} value='info' /> */}
                        <BottomNavigationAction label='Settings' icon={<SettingsApplicationsIcon />} value='settings' />
                    </BottomNavigation>
                </div>

            </div>
        )
    }
}

export const MainLayout = connect((state: ApplicationState): MainLayoutProps => {
    return {
        user: state.user,
        router: state.router,
        theme: state.theme
    }
}, mapDispatch)(MainLayoutBase)