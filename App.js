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
import { PersistGate } from 'redux-persist/lib/integration/react';
import styled from 'styled-components/native';
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
import { Container } from 'components/Layout';
import Root from 'components/Root';
import Toast from 'components/Toast';
import Spinner from 'components/Spinner';
import type { RootReducerState } from 'reducers/rootReducer';

import configureStore from './src/configureStore';

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

const { store, persistor } = configureStore();

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

  async componentDidMount() {
    const {
      fetchAppSettingsAndRedirect,
      startListeningOnOpenNotification,
      checkDBConflicts,
      executeDeepLink,
    } = this.props;
    checkDBConflicts();
    const isOnline = await NetInfo.isConnected.fetch();
    this.setOnlineStatus(isOnline); // set initial online status
    SplashScreen.hide();
    fetchAppSettingsAndRedirect(AppState.currentState, Platform.OS);
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    Linking.getInitialURL()
      .then(url => {
        if (url) executeDeepLink(url);
      })
      .catch(() => {});
    Linking.addEventListener('url', this.handleDeepLinkEvent);
    startListeningOnOpenNotification();
  }

  setOnlineStatus = isOnline => {
    const {
      updateSessionNetworkStatus,
      updateOfflineQueueNetworkStatus,
    } = this.props;
    updateSessionNetworkStatus(isOnline);
    updateOfflineQueueNetworkStatus(isOnline);
  };

  handleConnectivityChange = isOnline => {
    this.setOnlineStatus(isOnline);
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

const mapStateToProps = ({ appSettings: { isFetched } }: RootReducerState) => ({
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
      <PersistGate loading={<Container><LoadingSpinner /></Container>} persistor={persistor}>
        <AppWithNavigationState />
      </PersistGate>
    </Provider>
  </Root>
);

export default AppRoot;
