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
import { StatusBar, NetInfo, AppState, Platform } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { Provider, connect } from 'react-redux';
import RootNavigation from 'navigation/rootNavigation';
import { Sentry } from 'react-native-sentry';
import { setTopLevelNavigator } from 'services/navigation';
import { SENTRY_DSN, BUILD_TYPE } from 'react-native-dotenv';
import { initAppAndRedirectAction } from 'actions/appActions';
import { updateSessionNetworkStatusAction, checkDBConflictsAction } from 'actions/sessionActions';
import {
  startListeningOnOpenNotificationAction,
  stopListeningOnOpenNotificationAction,
} from 'actions/notificationsActions';
import Root from 'components/Root';
import Toast from 'components/Toast';
import configureStore from './src/configureStore';

global.Symbol = require('core-js/es6/symbol');
require('core-js/fn/symbol/iterator');

// collection fn polyfills
require('core-js/fn/map');
require('core-js/fn/set');
require('core-js/fn/array/find');

const store = configureStore();

type Props = {
  dispatch: Function,
  navigation: Object,
  isFetched: Boolean,
  fetchAppSettingsAndRedirect: Function,
  updateSessionNetworkStatus: Function,
  checkDBConflicts: Function,
  startListeningOnOpenNotification: Function,
  stopListeningOnOpenNotification: Function,
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

  componentWillUnmount() {
    const { stopListeningOnOpenNotification } = this.props;
    stopListeningOnOpenNotification();
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentDidMount() {
    const { fetchAppSettingsAndRedirect, startListeningOnOpenNotification, checkDBConflicts } = this.props;
    checkDBConflicts();
    Intercom.setInAppMessageVisibility('GONE'); // prevent messanger launcher to appear
    SplashScreen.hide();
    fetchAppSettingsAndRedirect(AppState.currentState, Platform.OS);
    StatusBar.setBarStyle('dark-content');
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    startListeningOnOpenNotification();
  }

  handleConnectivityChange = isOnline => {
    const { updateSessionNetworkStatus } = this.props;
    updateSessionNetworkStatus(isOnline);
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

  render() {
    const { isFetched } = this.props;
    if (!isFetched) return null;
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
  checkDBConflicts: () => dispatch(checkDBConflictsAction()),
  startListeningOnOpenNotification: () => dispatch(startListeningOnOpenNotificationAction()),
  stopListeningOnOpenNotification: () => dispatch(stopListeningOnOpenNotificationAction()),
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
