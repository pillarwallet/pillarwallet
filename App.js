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
import { StatusBar, Platform, Linking, Text, TouchableOpacity } from 'react-native';
import { Provider, connect } from 'react-redux';
import * as Sentry from '@sentry/react-native';
import { PersistGate } from 'redux-persist/lib/integration/react';
import styled, { ThemeProvider } from 'styled-components/native';
import { AppearanceProvider } from 'react-native-appearance';
import { SENTRY_DSN, BUILD_TYPE, SHOW_THEME_TOGGLE, SHOW_ONLY_STORYBOOK } from 'react-native-dotenv';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';

// actions
import { initAppAndRedirectAction } from 'actions/appActions';
import { updateSessionNetworkStatusAction } from 'actions/sessionActions';
import { updateOfflineQueueNetworkStatusAction } from 'actions/offlineApiActions';
import {
  startListeningOnOpenNotificationAction,
  stopListeningOnOpenNotificationAction,
} from 'actions/notificationsActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';
import { startReferralsListenerAction, stopReferralsListenerAction } from 'actions/referralsActions';
import { setAppThemeAction, handleSystemDefaultThemeChangeAction } from 'actions/appSettingsActions';

// constants
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';

// components
import { Container } from 'components/Layout';
import Root from 'components/Root';
import Toast from 'components/Toast';
import Spinner from 'components/Spinner';
import Walkthrough from 'components/Walkthrough';

// utils
import { getThemeByType, defaultTheme } from 'utils/themes';

// services
import { setTopLevelNavigator } from 'services/navigation';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Steps } from 'reducers/walkthroughsReducer';

// other
import RootNavigation from 'navigation/rootNavigation';
import Storybook from 'screens/Storybook';
import configureStore from './src/configureStore';

const { store, persistor } = configureStore();

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

type Props = {
  dispatch: Dispatch,
  isFetched: boolean,
  fetchAppSettingsAndRedirect: () => void,
  updateSessionNetworkStatus: (isOnline: boolean) => void,
  updateOfflineQueueNetworkStatus: (isOnline: boolean) => void,
  startListeningOnOpenNotification: () => void,
  stopListeningOnOpenNotification: () => void,
  executeDeepLink: (deepLinkUrl: string) => void,
  activeWalkthroughSteps: Steps,
  themeType: string,
  startReferralsListener: () => void,
  stopReferralsListener: () => void,
  setAppTheme: (themeType: string) => void,
  isManualThemeSelection: boolean,
  handleSystemDefaultThemeChange: () => void,
}

class App extends React.Component<Props, *> {
  removeNetInfoEventListener: NetInfoSubscription;

  constructor(props: Props) {
    super(props);
    if (!__DEV__) {
      const dist = DeviceInfo.getBuildNumber();
      const release = `${DeviceInfo.getVersion()} (${dist})`;
      // : `${appBundleId}@${appVersion}+${buildNumber}`
      Sentry.init({ dsn: SENTRY_DSN, release, dist });
      Sentry.setRelease(release);
      Sentry.setDist(dist);
      Sentry.setTags({ environment: BUILD_TYPE });
    }
  }

  // https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    Intercom.setInAppMessageVisibility('GONE'); // prevent messanger launcher to appear
  }

  componentWillUnmount() {
    const { stopListeningOnOpenNotification, stopReferralsListener } = this.props;
    stopReferralsListener();
    stopListeningOnOpenNotification();
    if (this.removeNetInfoEventListener) {
      this.removeNetInfoEventListener();
      delete this.removeNetInfoEventListener;
    }
    Linking.removeEventListener('url', this.handleDeepLinkEvent);
  }

  componentDidMount() {
    const {
      fetchAppSettingsAndRedirect,
      startListeningOnOpenNotification,
      executeDeepLink,
      startReferralsListener,
    } = this.props;
    NetInfo.fetch()
      .then((netInfoState) => this.setOnlineStatus(netInfoState.isInternetReachable))
      .catch(() => null);
    this.removeNetInfoEventListener = NetInfo.addEventListener(this.handleConnectivityChange);
    startReferralsListener();
    fetchAppSettingsAndRedirect();
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }
    Linking.getInitialURL()
      .then(url => {
        if (url) executeDeepLink(url);
      })
      .catch(() => {});
    Linking.addEventListener('url', this.handleDeepLinkEvent);
    startListeningOnOpenNotification();
  }

  componentDidUpdate(prevProps: Props) {
    const { isFetched, handleSystemDefaultThemeChange, themeType } = this.props;
    const { isFetched: prevIsFetched, themeType: prevThemeType } = prevProps;
    if (isFetched && !prevIsFetched) {
      handleSystemDefaultThemeChange();
    }

    if (themeType !== prevThemeType) {
      if (themeType === DARK_THEME) {
        StatusBar.setBarStyle('light-content');
      } else {
        StatusBar.setBarStyle('dark-content');
      }
    }
  }

  setOnlineStatus = isOnline => {
    const {
      updateSessionNetworkStatus,
      updateOfflineQueueNetworkStatus,
    } = this.props;
    updateSessionNetworkStatus(isOnline);
    updateOfflineQueueNetworkStatus(isOnline);
  };

  handleConnectivityChange = (state: NetInfoState) => {
    const isOnline = state.isInternetReachable;
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
    const {
      isFetched,
      themeType,
      setAppTheme,
      activeWalkthroughSteps,
    } = this.props;
    const theme = getThemeByType(themeType);
    const { colors, current } = theme;

    if (!isFetched) return null;

    return (
      <AppearanceProvider>
        <ThemeProvider theme={theme}>
          <React.Fragment>
            <Root>
              <RootNavigation
                ref={(node) => {
                  if (!node) return;
                  setTopLevelNavigator(node);
                }}
                theme={current === LIGHT_THEME ? 'light' : 'dark'}
              />
              {!!SHOW_THEME_TOGGLE &&
              <TouchableOpacity
                style={{
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  backgroundColor: colors.card,
                }}
                onPress={() => {
                  const themeToChangeTo = current === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
                  setAppTheme(themeToChangeTo);
                }}
              >
                <Text style={{ color: colors.text }}>{`THEME: ${current}`}</Text>
              </TouchableOpacity>}
              {!!activeWalkthroughSteps.length && <Walkthrough steps={activeWalkthroughSteps} />}
            </Root>
          </React.Fragment>
        </ThemeProvider>
      </AppearanceProvider>
    );
  }
}

const mapStateToProps = ({
  appSettings: { isFetched, data: { themeType, isManualThemeSelection } },
  walkthroughs: { steps: activeWalkthroughSteps },
}: RootReducerState): $Shape<Props> => ({
  isFetched,
  themeType,
  isManualThemeSelection,
  activeWalkthroughSteps,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAppSettingsAndRedirect: () => dispatch(initAppAndRedirectAction()),
  updateSessionNetworkStatus: (isOnline: boolean) => dispatch(updateSessionNetworkStatusAction(isOnline)),
  updateOfflineQueueNetworkStatus: (isOnline: boolean) => dispatch(updateOfflineQueueNetworkStatusAction(isOnline)),
  startListeningOnOpenNotification: () => dispatch(startListeningOnOpenNotificationAction()),
  stopListeningOnOpenNotification: () => dispatch(stopListeningOnOpenNotificationAction()),
  startReferralsListener: () => dispatch(startReferralsListenerAction()),
  stopReferralsListener: () => dispatch(stopReferralsListenerAction()),
  executeDeepLink: (deepLink: string) => dispatch(executeDeepLinkAction(deepLink)),
  setAppTheme: (themeType: string) => dispatch(setAppThemeAction(themeType)),
  handleSystemDefaultThemeChange: () => dispatch(handleSystemDefaultThemeChangeAction()),
});

const AppWithNavigationState = connect(mapStateToProps, mapDispatchToProps)(App);

const AppRoot = () => (
  <Provider store={store}>
    <PersistGate loading={<Container defaultTheme={defaultTheme}><LoadingSpinner /></Container>} persistor={persistor}>
      {SHOW_ONLY_STORYBOOK ? <Storybook /> : <AppWithNavigationState />}
    </PersistGate>
  </Provider>
);

export default AppRoot;
