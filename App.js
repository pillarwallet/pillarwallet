// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import 'utils/setup';
import * as React from 'react';
import Intercom from 'react-native-intercom';
import { StatusBar, NetInfo, AppState, Platform, Linking } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { Provider, connect } from 'react-redux';
import RootNavigation from 'navigation/rootNavigation';
import { Sentry } from 'react-native-sentry';
import { setTopLevelNavigator } from 'services/navigation';
import { SENTRY_DSN, BUILD_TYPE } from 'react-native-dotenv';
import { initAppAndRedirectAction } from 'actions/appActions';
import { updateSessionNetworkStatusAction, checkDBConflictsAction } from 'actions/sessionActions';
import { updateOfflineQueueNetworkStatusAction } from 'actions/offlineApiActions';
import {
  startListeningOnOpenNotificationAction,
  stopListeningOnOpenNotificationAction,
} from 'actions/notificationsActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';
import Root from 'components/Root';
import Toast from 'components/Toast';
import configureStore from './src/configureStore';

const store = configureStore();

type Props = {
  dispatch: Function,
  navigation: Object,
  isFetched: Boolean,
  fetchAppSettingsAndRedirect: Function,
  updateSessionNetworkStatus: Function,
  updateOfflineQueueNetworkStatus: Function,
  checkDBConflicts: Function,
  startListeningOnOpenNotification: Function,
  stopListeningOnOpenNotification: Function,
  executeDeepLink: Function,
}

class App extends React.Component<Props, *> {
  constructor(props: Props) {
    super(props);
    if (!__DEV__) {
      Sentry.config(SENTRY_DSN).install();
      Sentry.setTagsContext({
        environment: BUILD_TYPE,
      });
    }
  }

  componentWillMount() {
    Intercom.setInAppMessageVisibility('GONE'); // prevent messanger launcher to appear
  }

  componentWillUnmount() {
    const { stopListeningOnOpenNotification } = this.props;
    stopListeningOnOpenNotification();
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
    Linking.removeEventListener('url', this.handleDeepLinkEvent);
  }

  componentDidMount() {
    const {
      fetchAppSettingsAndRedirect,
      startListeningOnOpenNotification,
      checkDBConflicts,
      executeDeepLink,
    } = this.props;
    checkDBConflicts();
    SplashScreen.hide();
    fetchAppSettingsAndRedirect(AppState.currentState, Platform.OS);
    StatusBar.setBarStyle('dark-content');
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    Linking.getInitialURL()
      .then(url => {
        if (url) executeDeepLink(url);
      })
      .catch(() => {});
    Linking.addEventListener('url', this.handleDeepLinkEvent);
    startListeningOnOpenNotification();
  }

  handleConnectivityChange = isOnline => {
    const { updateSessionNetworkStatus, updateOfflineQueueNetworkStatus } = this.props;
    updateSessionNetworkStatus(isOnline);
    updateOfflineQueueNetworkStatus(isOnline);
    if (!isOnline) {
      Toast.show({
        message: 'No active internet connection found!',
        type: 'warning',
        title: 'Connection Issue',
        autoClose: false,
      });
    } else {
      Toast.close();
    }
  };

  handleDeepLinkEvent = event => {
    const { executeDeepLink } = this.props;
    const { url: deepLink } = event;
    if (deepLink === undefined) return;
    executeDeepLink(deepLink);
  };

  render() {
    const { isFetched } = this.props;
    const isTestEnv = !!process.env['IS_TEST']; // eslint-disable-line dot-notation
    let isHobbesUI = false;

    /*
     * the reason for this validation is because process.env is being set on utils/shim.js
     * and that setting can't be modified, and several validations run around
     * _DEV_ && process.env['NODE_ENV'] === 'development'
     *
     * on the local machine there's no problem, however circleCI stops working with following
     * issue:
     *
     * 'Property left of AssignmentExpression expected node to be of a type ["LVal"] but instead got "StringLiteral"'
     *
     * which is caused when we tried to assign a variable to process.env, i.e. 'HOBBESUI'
    * */
    if (!isTestEnv) {
      isHobbesUI = !!process.env['HOBBESUI']; // eslint-disable-line dot-notation
    }

    if (!isFetched && !isHobbesUI) return null;

    return (
      <RootNavigation
        ref={(node) => {
          if (!node) return;
          setTopLevelNavigator(node);
        }}
      />
    );
  }
}

const mapStateToProps = ({ appSettings: { isFetched } }) => ({
  isFetched,
});

const mapDispatchToProps = (dispatch) => ({
  fetchAppSettingsAndRedirect: (appState: string, platform: string) =>
    dispatch(initAppAndRedirectAction(appState, platform)),
  updateSessionNetworkStatus: (isOnline: boolean) => dispatch(updateSessionNetworkStatusAction(isOnline)),
  updateOfflineQueueNetworkStatus: (isOnline: boolean) => dispatch(updateOfflineQueueNetworkStatusAction(isOnline)),
  checkDBConflicts: () => dispatch(checkDBConflictsAction()),
  startListeningOnOpenNotification: () => dispatch(startListeningOnOpenNotificationAction()),
  stopListeningOnOpenNotification: () => dispatch(stopListeningOnOpenNotificationAction()),
  executeDeepLink: (deepLink: string) => dispatch(executeDeepLinkAction(deepLink)),
});

const AppWithNavigationState = connect(mapStateToProps, mapDispatchToProps)(App);

const AppRoot = () => (
  <Root>
    <Provider store={store}>
      <AppWithNavigationState />
    </Provider>
  </Root>
);

export default AppRoot;
